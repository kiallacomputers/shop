import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { sendDeliveredNotification, sendShippingNotification } from "~~/server/utils/orderEmail";

const allowedStatuses = [
  "paid",
  "processing",
  "shipping",
  "delivered",
  "cancelled",
  "refunded",
];

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order ID is required.",
    });
  }

  const body = await readBody(event);
  const status = String(body?.status ?? "").trim().toLowerCase();

  if (!allowedStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid order status.",
    });
  }

  const supabase = getAdminSupabase();
  const { data: existing, error: loadError } = await supabase
    .from("orders")
    .select(`id, user_id, stripe_session_id, customer_email, customer_name, total, status,
      tracking_number, carrier, tracking_status, shipping_method, shipping_name,
      shipping_address_line_1, shipping_address_line_2, shipping_suburb, shipping_state,
      shipping_postcode, shipped_at, delivered_at, shipped_notified_at, delivered_notified_at,
      created_at`)
    .eq("id", id)
    .single();

  if (loadError || !existing) {
    throw createError({
      statusCode: loadError?.code === "PGRST116" ? 404 : 500,
      statusMessage: loadError?.message || "Unable to load order.",
    });
  }

  if (status === "shipping" && !existing.tracking_number) {
    throw createError({
      statusCode: 400,
      statusMessage: "Add the Australia Post tracking number before marking the order as Shipping.",
    });
  }

  if (status === "delivered" && String(existing.status || "").toLowerCase() !== "shipping") {
    throw createError({
      statusCode: 400,
      statusMessage: "Mark the order as Shipping before marking it Delivered.",
    });
  }

  const now = new Date().toISOString();
  const update: Record<string, any> = { status };

  if (status === "shipping") {
    update.shipped_at = existing.shipped_at || now;
    update.carrier = existing.carrier || "Australia Post";
    update.tracking_status = "Shipped - track with Australia Post";
  }

  if (status === "delivered") {
    update.delivered_at = existing.delivered_at || now;
    update.tracking_status = "Delivered";
  }

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select(`id, user_id, stripe_session_id, customer_email, customer_name, total, status,
      tracking_number, carrier, tracking_status, shipped_at, delivered_at,
      shipped_notified_at, delivered_notified_at, created_at`)
    .single();

  if (error) {
    console.error("ADMIN UPDATE ORDER ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to update order.",
    });
  }

  const mailData = {
    id: existing.id,
    customer_email: existing.customer_email,
    customer_name: existing.customer_name,
    tracking_number: existing.tracking_number,
    shipping_method: existing.shipping_method,
    shipping_name: existing.shipping_name,
    shipping_address_line_1: existing.shipping_address_line_1,
    shipping_address_line_2: existing.shipping_address_line_2,
    shipping_suburb: existing.shipping_suburb,
    shipping_state: existing.shipping_state,
    shipping_postcode: existing.shipping_postcode,
  };

  if (
    status === "shipping" &&
    String(existing.status || "").toLowerCase() !== "shipping" &&
    !existing.shipped_notified_at &&
    existing.customer_email &&
    existing.tracking_number
  ) {
    try {
      await sendShippingNotification(mailData as any);
      const notifiedAt = new Date().toISOString();
      await supabase.from("orders").update({ shipped_notified_at: notifiedAt }).eq("id", id);
      (data as any).shipped_notified_at = notifiedAt;
    } catch (mailError) {
      console.error("SHIPPED EMAIL ERROR:", mailError);
    }
  }

  if (
    status === "delivered" &&
    String(existing.status || "").toLowerCase() !== "delivered" &&
    !existing.delivered_notified_at &&
    existing.customer_email &&
    existing.tracking_number
  ) {
    try {
      await sendDeliveredNotification(mailData as any);
      const notifiedAt = new Date().toISOString();
      await supabase.from("orders").update({ delivered_notified_at: notifiedAt }).eq("id", id);
      (data as any).delivered_notified_at = notifiedAt;
    } catch (mailError) {
      console.error("DELIVERED EMAIL ERROR:", mailError);
    }
  }

  return data;
});
