import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("ADMIN CATEGORIES ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load categories",
    });
  }

  return data ?? [];
});
