import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const productId = Number(getRouterParam(event, "productId"));
  if (!Number.isInteger(productId) || productId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "A valid product is required." });
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("customer_wishlist")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  // Removing a product from the wishlist also stops any pending stock alerts
  // for that product so the customer is not emailed unexpectedly later.
  await supabase
    .from("customer_back_in_stock_notifications")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "waiting");

  return { saved: false, product_id: productId };
});
