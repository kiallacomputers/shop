import { serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    // ============================================
    // GET AUTHENTICATED USER
    // ============================================

    const supabase = await serverSupabaseClient(event);

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

    console.log("========================================");
    console.log("CATEGORY ADMIN CHECK");
    console.log("AUTH USER ID:", user.id);
    console.log("AUTH EMAIL:", user.email);
    console.log("========================================");

    // ============================================
    // CHECK ADMIN
    // ============================================
    // IMPORTANT:
    //
    // Your admin_users table uses:
    //
    // admin_users.id
    //
    // as the user's UUID.
    //
    // DO NOT use:
    // .eq("user_id", user.id)
    //
    // ============================================

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    console.log("ADMIN USER:", adminUser);
    console.log("ADMIN ERROR:", adminError);

    if (adminError) {
      console.error("🔥 ADMIN CHECK ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage: "Unable to verify administrator access",
      });
    }

    if (!adminUser) {
      console.error("🔥 USER IS NOT AN ADMIN:", user.id);

      throw createError({
        statusCode: 403,
        statusMessage: "Administrator access required",
      });
    }

    console.log("✅ ADMIN VERIFIED");

    // ============================================
    // GET CATEGORY ID
    // ============================================

    const categoryId = getRouterParam(event, "id");

    if (!categoryId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Category ID is required",
      });
    }

    console.log("CATEGORY ID:", categoryId);

    // ============================================
    // GET REQUEST METHOD
    // ============================================

    const method = event.method;

    // ============================================
    // SERVICE CLIENT
    // ============================================

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const serviceKey = config.supabaseSecretKey || config.supabaseServiceKey;

    if (!supabaseUrl || !serviceKey) {
      console.error("🔥 SUPABASE SERVER CONFIGURATION MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase server configuration is missing",
      });
    }

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================
    // PUT - UPDATE CATEGORY
    // ============================================

    if (method === "PUT") {
      const body = await readBody(event);

      console.log("UPDATE CATEGORY BODY:", body);

      const name = String(body?.name || "").trim();

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Category name is required",
        });
      }

      // ------------------------------------------
      // SLUG
      // ------------------------------------------

      const slug = String(body?.slug || "").trim() || generateSlug(name);

      // ------------------------------------------
      // PARENT
      // ------------------------------------------

      const parentId =
        body?.parent_id === null ||
        body?.parent_id === "" ||
        body?.parent_id === undefined
          ? null
          : body.parent_id;

      // ------------------------------------------
      // ACTIVE
      // ------------------------------------------

      const active = body?.active !== false;

      // ------------------------------------------
      // PREVENT CATEGORY BEING ITS OWN PARENT
      // ------------------------------------------

      if (parentId !== null && String(parentId) === String(categoryId)) {
        throw createError({
          statusCode: 400,
          statusMessage: "A category cannot be its own parent.",
        });
      }

      // ------------------------------------------
      // CHECK CATEGORY EXISTS
      // ------------------------------------------

      const { data: existingCategory, error: existingError } =
        await adminSupabase
          .from("categories")
          .select("id")
          .eq("id", categoryId)
          .maybeSingle();

      if (existingError) {
        console.error("🔥 CATEGORY LOOKUP ERROR:", existingError);

        throw createError({
          statusCode: 500,
          statusMessage: existingError.message || "Unable to find category",
        });
      }

      if (!existingCategory) {
        throw createError({
          statusCode: 404,
          statusMessage: "Category not found",
        });
      }

      // ------------------------------------------
      // CHECK SLUG
      // ------------------------------------------

      const { data: slugCategory, error: slugError } = await adminSupabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .neq("id", categoryId)
        .maybeSingle();

      if (slugError) {
        console.error("🔥 SLUG CHECK ERROR:", slugError);

        throw createError({
          statusCode: 500,
          statusMessage: slugError.message || "Unable to check category slug",
        });
      }

      if (slugCategory) {
        throw createError({
          statusCode: 409,
          statusMessage: "A category with this name already exists.",
        });
      }

      // ------------------------------------------
      // UPDATE
      // ------------------------------------------

      const { data: updatedCategory, error: updateError } = await adminSupabase
        .from("categories")
        .update({
          name,
          slug,
          parent_id: parentId,
          active,
        })
        .eq("id", categoryId)
        .select()
        .single();

      if (updateError) {
        console.error("🔥 CATEGORY UPDATE ERROR:", updateError);

        throw createError({
          statusCode: 500,
          statusMessage: updateError.message || "Unable to update category",
        });
      }

      console.log("✅ CATEGORY UPDATED:", updatedCategory);

      return updatedCategory;
    }

    // ============================================
    // DELETE CATEGORY
    // ============================================

    if (method === "DELETE") {
      console.log("🗑️ DELETE CATEGORY:", categoryId);

      // ------------------------------------------
      // CHECK FOR CHILDREN
      // ------------------------------------------

      const { data: children, error: childrenError } = await adminSupabase
        .from("categories")
        .select("id")
        .eq("parent_id", categoryId);

      if (childrenError) {
        console.error("🔥 CHILD CATEGORY ERROR:", childrenError);

        throw createError({
          statusCode: 500,
          statusMessage:
            childrenError.message || "Unable to check subcategories",
        });
      }

      if (children && children.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage:
            "This category has subcategories. Delete or move the subcategories first.",
        });
      }

      // ------------------------------------------
      // CHECK PRODUCTS
      // ------------------------------------------

      const { data: products, error: productsError } = await adminSupabase
        .from("products")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1);

      if (productsError) {
        console.error("🔥 PRODUCT CATEGORY CHECK ERROR:", productsError);

        throw createError({
          statusCode: 500,
          statusMessage: productsError.message || "Unable to check products",
        });
      }

      if (products && products.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage:
            "This category is being used by products and cannot be deleted.",
        });
      }

      // ------------------------------------------
      // DELETE
      // ------------------------------------------

      const { error: deleteError } = await adminSupabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (deleteError) {
        console.error("🔥 CATEGORY DELETE ERROR:", deleteError);

        throw createError({
          statusCode: 500,
          statusMessage: deleteError.message || "Unable to delete category",
        });
      }

      console.log("✅ CATEGORY DELETED");

      return {
        success: true,
        id: categoryId,
      };
    }

    // ============================================
    // METHOD NOT ALLOWED
    // ============================================

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
      statusMessage: error?.message || "Unable to process category request",
    });
  }
});

// ============================================
// SLUG GENERATOR
// ============================================

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
