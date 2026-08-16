import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ============================================
  // VERIFY ADMIN
  // ============================================

  await requireAdmin(event);

  // ============================================
  // SUPABASE
  // ============================================

  const supabase = getAdminSupabase();

  // ============================================
  // LOAD CATEGORIES
  // ============================================

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    console.error("=================================");
    console.error("ADMIN CATEGORIES GET ERROR");
    console.error(error);
    console.error("=================================");

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load categories.",
    });
  }

  // ============================================
  // SUCCESS
  // ============================================

  return data ?? [];
});
