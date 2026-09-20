import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event); const productId = Number(getRouterParam(event,"productId")); const supabase = getAdminSupabase();
  const { data: existing } = await supabase.from("product_reviews").select("id,rating,title,review,status").eq("product_id",productId).eq("user_id",user.id).maybeSingle();
  const { data: items } = await supabase.from("order_items").select("order_id,orders!inner(id,user_id,status)").eq("product_id",productId);
  const delivered = (items || []).find((row:any) => row.orders?.user_id === user.id && String(row.orders?.status).toLowerCase() === "delivered");
  return { eligible: Boolean(delivered), orderId: delivered?.order_id || null, existing: existing || null };
});
