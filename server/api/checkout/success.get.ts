import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user: any = await requireRequestUser(event);
  const sessionId = String(getQuery(event).session_id || "").trim();

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Stripe checkout session is required.",
    });
  }

  const supabase = getAdminSupabase();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      stripe_session_id,
      customer_email,
      customer_name,
      total,
      status,
      shipping_name,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_suburb,
      shipping_state,
      shipping_postcode,
      shipping_country,
      shipping_method,
      shipping_service_code,
      shipping_cost,
      created_at
    `)
    .eq("stripe_session_id", sessionId)
    .eq("user_id", String(user.id))
    .maybeSingle();

  if (orderError) {
    throw createError({
      statusCode: 500,
      statusMessage: orderError.message || "Unable to load your order.",
    });
  }

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "Your order is still being finalised.",
    });
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, product_name, quantity, price")
    .eq("order_id", order.id)
    .order("id", { ascending: true });

  if (itemsError) {
    throw createError({
      statusCode: 500,
      statusMessage: itemsError.message || "Unable to load your order items.",
    });
  }

  return {
    ...order,
    items: items || [],
  };
});
