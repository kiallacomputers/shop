import { requireAdmin, getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = getRouterParam(event, "id");

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const supabase = getAdminSupabase();

  const { data: product, error: findError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .maybeSingle();

  if (findError) {
    console.error("FIND PRODUCT ERROR:", findError);
    throw createError({
      statusCode: 500,
      statusMessage: findError.message || "Unable to find product",
    });
  }

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    console.error("DELETE PRODUCT ERROR:", deleteError);
    throw createError({
      statusCode: 500,
      statusMessage: deleteError.message || "Unable to delete product",
    });
  }

  console.log(`ADMIN PRODUCT DELETED: ${product.id} - ${product.name}`);

  return {
    success: true,
    message: "Product deleted successfully",
    productId: product.id,
  };
});
