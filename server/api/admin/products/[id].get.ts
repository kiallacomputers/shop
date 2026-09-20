import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("ADMIN PRODUCT ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load product",
    });
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  const { data: relatedRows, error: relatedError } = await supabase
    .from("product_related_products")
    .select("related_product_id, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (relatedError) {
    console.error("ADMIN PRODUCT RELATED PRODUCTS ERROR:", relatedError);
    throw createError({
      statusCode: 500,
      statusMessage: relatedError.message || "Unable to load related products",
    });
  }

  return {
    ...data,
    related_product_ids: (relatedRows || []).map((row) => Number(row.related_product_id)),
  };
});
