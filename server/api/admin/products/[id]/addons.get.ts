import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid product" });
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("product_addon_groups")
    .select("id,product_id,name,selection_type,required,sort_order,active,product_addon_options(id,group_id,name,price,sort_order,active)")
    .eq("product_id", id)
    .order("sort_order")
    .order("sort_order", { referencedTable: "product_addon_options" });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load add-ons" });
  return data || [];
});
