import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  try {
    // ==========================================
    // SUPABASE
    // ==========================================

    const supabase = await serverSupabaseClient(event);

    // ==========================================
    // USER
    // ==========================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    // ==========================================
    // ADMIN
    // ==========================================

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("🔥 ADMIN CHECK ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage: "Unable to verify administrator access",
      });
    }

    if (!adminUser) {
      throw createError({
        statusCode: 403,
        statusMessage: "Administrator access required",
      });
    }

    // ==========================================
    // CATEGORY ID
    // ==========================================

    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Category ID is required",
      });
    }

    // ==========================================
    // GET CATEGORY
    // ==========================================

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, parent_id, sort_order")
      .eq("id", id)
      .maybeSingle();

    if (categoryError) {
      throw createError({
        statusCode: 500,
        statusMessage: categoryError.message,
      });
    }

    if (!category) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }

    // ==========================================
    // PUT - UPDATE
    // ==========================================

    if (event.method === "PUT") {
      const body = await readBody(event);

      const name = String(body?.name || "").trim();

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Category name is required",
        });
      }

      const parentId = body?.parent_id || null;

      // ========================================
      // PREVENT SELF-PARENT
      // ========================================

      if (parentId && String(parentId) === String(id)) {
        throw createError({
          statusCode: 400,
          statusMessage: "A category cannot be its own parent.",
        });
      }

      // ========================================
      // CHECK DUPLICATE
      // ========================================

      let duplicateQuery = supabase
        .from("categories")
        .select("id")
        .ilike("name", name)
        .neq("id", id);

      if (parentId) {
        duplicateQuery = duplicateQuery.eq("parent_id", parentId);
      } else {
        duplicateQuery = duplicateQuery.is("parent_id", null);
      }

      const { data: duplicate } = await duplicateQuery.maybeSingle();

      if (duplicate) {
        throw createError({
          statusCode: 409,
          statusMessage:
            "A category with this name already exists at this level.",
        });
      }

      // ========================================
      // UPDATE
      // ========================================

      const { data, error } = await supabase
        .from("categories")
        .update({
          name,
          parent_id: parentId,
          sort_order: Number(body?.sort_order ?? 0),
        })
        .eq("id", id)
        .select("id, name, parent_id, sort_order")
        .single();

      if (error) {
        console.error("🔥 CATEGORY UPDATE ERROR:", error);

        throw createError({
          statusCode: 500,
          statusMessage: error.message || "Unable to update category",
        });
      }

      return data;
    }

    // ==========================================
    // DELETE
    // ==========================================

    if (event.method === "DELETE") {
      // ========================================
      // CHECK SUBCATEGORIES
      // ========================================

      const { data: children, error: childError } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", id)
        .limit(1);

      if (childError) {
        throw createError({
          statusCode: 500,
          statusMessage: childError.message,
        });
      }

      if (children && children.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Cannot delete "${category.name}" because it contains subcategories. Delete or move the subcategories first.`,
        });
      }

      // ========================================
      // CHECK PRODUCTS
      // ========================================

      const { data: products, error: productError } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", id)
        .limit(1);

      if (productError) {
        console.error("🔥 PRODUCT CHECK ERROR:", productError);

        throw createError({
          statusCode: 500,
          statusMessage: productError.message || "Unable to check products",
        });
      }

      if (products && products.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Cannot delete "${category.name}" because products are assigned to it. Move the products to another category first.`,
        });
      }

      // ========================================
      // DELETE
      // ========================================

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("🔥 CATEGORY DELETE ERROR:", deleteError);

        throw createError({
          statusCode: 500,
          statusMessage: deleteError.message || "Unable to delete category",
        });
      }

      return {
        success: true,
        id,
      };
    }

    // ==========================================
    // METHOD NOT ALLOWED
    // ==========================================

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error: any) {
    console.error("🔥 CATEGORY API ERROR:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Category request failed",
    });
  }
});
