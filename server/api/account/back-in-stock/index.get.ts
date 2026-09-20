import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("customer_back_in_stock_notifications")
    .select(`id,product_id,variant_id,status,requested_at,sent_at,cancelled_at,products(name,slug,product_code,stock,images),product_variants(name,product_code,stock,images)`)
    .eq("user_id", user.id)
    .order("requested_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return [];
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return data || [];
});
