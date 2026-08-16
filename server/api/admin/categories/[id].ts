import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required.",
    });
  }

  const supabase = getAdminSupabase();

  const method = event.method;

  // ============================================
  // GET CATEGORY
  // ============================================

  if (method === "GET") {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw createError({
        statusCode: 404,
        statusMessage: error.message || "Category not found.",
      });
    }

    return data;
  }

  // ============================================
  // UPDATE CATEGORY
  // ============================================

  if (method === "PUT") {
    const body = await readBody(event);

    if (!body?.name || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Category name is required.",
      });
    }

    const name = body.name.trim();

    const slug =
      body.slug ||
      name
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const parent_id =
      body.parent_id === null ||
      body.parent_id === undefined ||
      body.parent_id === ""
        ? null
        : body.parent_id;

    const active = body.active !== false;

    console.log("=================================");
    console.log("ADMIN UPDATE CATEGORY");
    console.log("ID:", id);
    console.log("NAME:", name);
    console.log("SLUG:", slug);
    console.log("PARENT:", parent_id);
    console.log("ACTIVE:", active);
    console.log("=================================");

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        parent_id,
        active,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("ADMIN CATEGORY UPDATE ERROR:", error);

      throw createError({
        statusCode: 500,
        statusMessage: error.message || "Unable to update category.",
      });
    }

    console.log("CATEGORY UPDATED:", data);

    return data;
  }

  // ============================================
  // DELETE CATEGORY
  // ============================================

  if (method === "DELETE") {
    console.log("=================================");
    console.log("ADMIN DELETE CATEGORY");
    console.log("ID:", id);
    console.log("=================================");

    // Check for children first
    const { data: children, error: childrenError } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", id);

    if (childrenError) {
      throw createError({
        statusCode: 500,
        statusMessage:
          childrenError.message || "Unable to check subcategories.",
      });
    }

    if (children && children.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "This category has subcategories. Delete or move the subcategories first.",
      });
    }

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("ADMIN CATEGORY DELETE ERROR:", error);

      throw createError({
        statusCode: 500,
        statusMessage: error.message || "Unable to delete category.",
      });
    }

    console.log("CATEGORY DELETED:", data);

    return {
      success: true,
      category: data,
    };
  }

  // ============================================
  // METHOD NOT ALLOWED
  // ============================================

  throw createError({
    statusCode: 405,
    statusMessage: `Method ${method} not allowed.`,
  });
});
