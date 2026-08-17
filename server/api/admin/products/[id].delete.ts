import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" });
  }

  const supabase = getAdminSupabase();

  const { data: product, error: lookupError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    throw createError({
      statusCode: 500,
      statusMessage: lookupError.message || "Unable to load product",
    });
  }

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" });
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("ADMIN DELETE PRODUCT ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to delete product",
    });
  }

  return {
    success: true,
    id: product.id,
    name: product.name,
  };
});
