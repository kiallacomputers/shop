import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const { data, error } = await getAdminSupabase()
    .from("products")
    .select("id,name,product_code,buy_price_ex_gst,price,stock,low_stock_level,reorder_level,target_stock_level,images,active")
    .order("name");
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data || [];
});
