import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { throwInternalError } from "~~/server/utils/internalError";

export default defineCachedEventHandler(async (event) => {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("ads")
    .select("id,title,image_url,link_url,active,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // Keep the storefront usable if the ads migration has not been run yet.
    if (error.code === "42P01") return [];
    throwInternalError(event, "PUBLIC ADS LOAD ERROR", error, "Unable to load advertisements.");
  }

  return data ?? [];
}, {
  maxAge: 300,
  name: "storefront-ads",
  getKey: () => "active",
});
