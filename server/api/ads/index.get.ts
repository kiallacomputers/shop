import { getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async () => {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("ads")
    .select("id,title,image_url,link_url,active,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("PUBLIC ADS LOAD ERROR:", error);

    // Keep the storefront usable if the migration has not been run yet.
    if (error.code === "42P01") return [];

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load advertisements",
    });
  }

  return data ?? [];
});
