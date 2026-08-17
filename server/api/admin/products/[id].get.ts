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

  return data;
});
