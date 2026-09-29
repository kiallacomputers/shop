import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { data, error } = await getAdminSupabase().from("customer_pricing_levels")
    .select("key,name,markup_percent,sort_order,active").eq("active", true)
    .order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return (data || []).map((row:any) => ({ key:String(row.key), name:String(row.name), markup_percent:Number(row.markup_percent || 0) }));
});
