import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  try {
    // ==========================================
    // SUPABASE CLIENT
    // ==========================================

    const supabase = await serverSupabaseClient(event);

    // ==========================================
    // GET CURRENT USER
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
    // CHECK ADMIN
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
    // GET METHOD
    // ==========================================

    if (event.method === "GET") {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id, sort_order")
        .order("sort_order", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error("🔥 CATEGORY LOAD ERROR:", error);

        throw createError({
          statusCode: 500,
          statusMessage: error.message || "Unable to load categories",
        });
      }

      return data || [];
    }

    // ==========================================
    // POST
    // ==========================================

    if (event.method === "POST") {
      const body = await readBody(event);

      const name = String(body?.name || "").trim();

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Category name is required",
        });
      }

      const parentId = body?.parent_id || null;

      const sortOrder = Number(body?.sort_order ?? 0);

      // ========================================
      // CHECK DUPLICATE
      // ========================================

      let duplicateQuery = supabase
        .from("categories")
        .select("id")
        .ilike("name", name);

      if (parentId) {
        duplicateQuery = duplicateQuery.eq("parent_id", parentId);
      } else {
        duplicateQuery = duplicateQuery.is("parent_id", null);
      }

      const { data: existing } = await duplicateQuery.maybeSingle();

      if (existing) {
        throw createError({
          statusCode: 409,
          statusMessage:
            "A category with this name already exists at this level.",
        });
      }

      // ========================================
      // INSERT
      // ========================================

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name,
          parent_id: parentId,
          sort_order: sortOrder,
        })
        .select("id, name, parent_id, sort_order")
        .single();

      if (error) {
        console.error("🔥 CATEGORY CREATE ERROR:", error);

        throw createError({
          statusCode: 500,
          statusMessage: error.message || "Unable to create category",
        });
      }

      return data;
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error: any) {
    console.error("🔥 CATEGORIES API ERROR:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Category request failed",
    });
  }
});
