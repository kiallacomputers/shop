import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
import { getPricingLevelForUser } from "~~/server/utils/customerPricing";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const supabase = getAdminSupabase();

  const [ordersResult, wishlistResult, quoteResult, pricingLevel] = await Promise.all([
    supabase
      .from("orders")
      .select("id,total,status,tracking_number,carrier,tracking_status,shipped_at,delivered_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("customer_wishlist").select("product_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("customer_quote_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getPricingLevelForUser(user.id),
  ]);

  if (ordersResult.error) throw createError({ statusCode: 500, statusMessage: ordersResult.error.message });

  const orders = ordersResult.data || [];
  const totalSpent = orders.reduce((sum: number, row: any) => sum + Number(row.total || 0), 0);
  const openOrders = orders.filter((row: any) => !["delivered","completed","cancelled","refunded"].includes(String(row.status || "").toLowerCase()));

  return {
    pricingLevel: { key: pricingLevel.key, name: pricingLevel.name },
    stats: {
      orders: orders.length,
      totalSpent,
      openOrders: openOrders.length,
      wishlist: wishlistResult.count || 0,
      quotes: quoteResult.count || 0,
    },
    recentOrders: orders.slice(0, 5),
  };
});
