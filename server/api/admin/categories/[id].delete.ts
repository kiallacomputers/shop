import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ============================================
  // VERIFY ADMIN
  // ============================================

  await requireAdmin(event);

  // ============================================
  // GET CATEGORY ID
  // ============================================

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required.",
    });
  }

  // ============================================
  // SUPABASE
  // ============================================

  const supabase = getAdminSupabase();

  // ============================================
  // CHECK FOR CHILD CATEGORIES
  // ============================================

  const { data: children, error: childrenError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("parent_id", id);

  if (childrenError) {
    console.error("ADMIN CATEGORY CHILD CHECK ERROR:", childrenError);

    throw createError({
      statusCode: 500,
      statusMessage: childrenError.message || "Unable to check subcategories.",
    });
  }

  if (children && children.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot delete this category because it has ${children.length} subcategor${
        children.length === 1 ? "y" : "ies"
      }.`,
    });
  }

  // ============================================
  // CHECK FOR PRODUCTS
  // ============================================

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("category", id)
    .limit(1);

  if (productsError) {
    console.error("ADMIN CATEGORY PRODUCT CHECK ERROR:", productsError);

    throw createError({
      statusCode: 500,
      statusMessage: productsError.message || "Unable to check products.",
    });
  }

  if (products && products.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage:
        "Cannot delete this category because products are assigned to it.",
    });
  }

  // ============================================
  // DELETE
  // ============================================

  console.log("=================================");
  console.log("DELETING CATEGORY");
  console.log("ID:", id);
  console.log("=================================");

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    console.error("=================================");
    console.error("ADMIN DELETE CATEGORY ERROR");
    console.error(error);
    console.error("=================================");

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to delete category.",
    });
  }

  // ============================================
  // SUCCESS
  // ============================================

  console.log("=================================");
  console.log("✅ CATEGORY DELETED");
  console.log(data);
  console.log("=================================");

  return data;
});
