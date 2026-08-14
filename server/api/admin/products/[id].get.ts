import { requireAdmin } from "../../../utils/adminAuth";

export default defineEventHandler(async (event) => {
  const { supabase } = await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("PRODUCT GET ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  console.log("ADMIN PRODUCT:", data);

  return data;
});
