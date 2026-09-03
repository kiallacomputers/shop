import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("ADMIN ADS LOAD ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load advertisements",
    });
  }

  return data ?? [];
});
