import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { throwInternalError } from "~~/server/utils/internalError";

export default defineCachedEventHandler(async (event) => {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,parent_id,active")
    .order("name", { ascending: true });

  if (error) {
    throwInternalError(event, "STOREFRONT CATEGORY LOAD ERROR", error, "Unable to load categories.");
  }

  return data || [];
}, {
  maxAge: 300,
  name: "storefront-categories",
  getKey: () => "all",
});
