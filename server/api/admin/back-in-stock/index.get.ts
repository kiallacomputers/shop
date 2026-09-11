import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("customer_back_in_stock_notifications")
    .select(`id,user_id,email,customer_name,product_id,variant_id,status,requested_at,sent_at,last_error,products(name,slug,product_code,stock),product_variants(name,product_code,stock)`)
    .order("requested_at", { ascending: false })
    .limit(1000);
  if (error) {
    if (error.code === "42P01") return [];
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return data || [];
});
