import { requireAdmin, getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🔥 ADMIN PRODUCT LOAD");

  // ============================================================
  // CHECK ADMIN ACCESS
  // ============================================================

  await requireAdmin(event);

  // ============================================================
  // GET PRODUCT ID FROM URL
  // ============================================================

  const id = getRouterParam(event, "id");

  console.log("🔥 PRODUCT ID:", id);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  // ============================================================
  // GET SERVER-SIDE SUPABASE CLIENT
  // ============================================================

  const supabase = getAdminSupabase();

  // ============================================================
  // LOAD PRODUCT
  // ============================================================

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  // ============================================================
  // DEBUG INFORMATION
  // ============================================================

  console.log("🔥 PRODUCT DATA:", data);
  console.log("🔥 PRODUCT ERROR:", error);

  // ============================================================
  // SUPABASE ERROR
  // ============================================================

  if (error) {
    console.error("🔥 SUPABASE PRODUCT LOAD ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // ============================================================
  // PRODUCT NOT FOUND
  // ============================================================

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  console.log("🔥 PRODUCT LOADED SUCCESSFULLY:", data.id);
  console.log("=================================");

  return data;
});
