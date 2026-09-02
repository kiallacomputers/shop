import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order ID is required.",
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
      shipping_postcode,
      shipping_method,
      shipping_service_code,
      shipping_cost,
      shipping_name,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_suburb,
      shipping_state,
      shipping_country,
      tracking_number,
      carrier,
      tracking_status,
      tracking_last_checked_at,
      tracking_events,
      shipped_at,
      delivered_at,
      shipped_notified_at,
      delivered_notified_at,
      created_at
    `)
    .eq("id", id)
    .single();

  if (orderError || !order) {
    console.error("ADMIN ORDER ERROR:", orderError);

    throw createError({
      statusCode: orderError?.code === "PGRST116" ? 404 : 500,
      statusMessage:
        orderError?.message ||
        "Unable to load order.",
    });
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      id,
      order_id,
      product_id,
      product_name,
      quantity,
      price
    `)
    .eq("order_id", order.id)
    .order("id", {
      ascending: true,
    });

  if (itemsError) {
    console.error("ADMIN ORDER ITEMS ERROR:", itemsError);

    throw createError({
      statusCode: 500,
      statusMessage:
        itemsError.message ||
        "Unable to load order items.",
    });
  }

  return {
    ...order,
    items: items ?? [],
  };
});
