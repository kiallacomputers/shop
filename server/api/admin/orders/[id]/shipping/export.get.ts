import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { calculateMyPostParcel, csvCell, requireMyPostSenderConfig } from "~~/server/utils/mypostCsv";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Order ID is required." });
  }

  const sender = requireMyPostSenderConfig();
  const supabase = getAdminSupabase();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`id, customer_email, customer_name, shipping_name, shipping_address_line_1,
      shipping_address_line_2, shipping_suburb, shipping_state, shipping_postcode,
      shipping_method, shipping_service_code`)
    .eq("id", id)
    .single();

  if (orderError || !order) {
    throw createError({
      statusCode: orderError?.code === "PGRST116" ? 404 : 500,
      statusMessage: orderError?.message || "Unable to load order.",
    });
  }

  const requiredAddress = [
    order.shipping_name || order.customer_name,
    order.shipping_address_line_1,
    order.shipping_suburb,
    order.shipping_state,
    order.shipping_postcode,
  ];
  if (requiredAddress.some((value) => !String(value || "").trim())) {
    throw createError({
      statusCode: 400,
      statusMessage: "The order is missing delivery address details required by MyPost Business.",
    });
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity")
    .eq("order_id", order.id)
    .order("id", { ascending: true });

  if (itemsError || !items?.length) {
    throw createError({
      statusCode: 500,
      statusMessage: itemsError?.message || "Unable to load order items for MyPost Business export.",
    });
  }

  const parcel = await calculateMyPostParcel(items);
  const descriptor = `${order.shipping_method || ""} ${order.shipping_service_code || ""}`.toLowerCase();
  const service = descriptor.includes("express") ? "EXP" : "PP";
  const itemDescription = items.map((item: any) => `${item.quantity || 1}x ${item.product_name || "Product"}`).join("; ").slice(0, 50);

  const headers = [
    "Send From Name",
    "Send From Business Name",
    "Send From Address Line 1",
    "Send From Address Line 2",
    "Send From Suburb",
    "Send From State",
    "Send From Postcode",
    "Send From Phone Number",
    "Send from Email Address",
    "Deliver To Name",
    "Deliver To Address Line 1",
    "Deliver to Address Line 2",
    "Deliver To Suburb",
    "Deliver To State",
    "Deliver To Postcode",
    "Deliver to Email Address",
    "Deliver To Phone Number",
    "Additional Label Information 1",
    "Send Tracking Notifications",
    "Item Packaging Type",
    "Item Delivery Service",
    "Item weight",
    "Item length",
    "Item width",
    "Item height",
    "Item Description",
    "Item Dangerous Goods Flag",
    "Signature on Delivery",
  ];

  const values = [
    sender.name,
    sender.businessName,
    sender.addressLine1,
    sender.addressLine2,
    sender.suburb,
    sender.state,
    sender.postcode,
    sender.phone,
    sender.email,
    order.shipping_name || order.customer_name,
    order.shipping_address_line_1,
    order.shipping_address_line_2,
    order.shipping_suburb,
    String(order.shipping_state || "").toUpperCase(),
    order.shipping_postcode,
    order.customer_email,
    "",
    `Kialla Computers order ${order.id}`.slice(0, 50),
    order.customer_email ? "YES" : "NO",
    "OWN_PACKAGING",
    service,
    parcel.weight,
    parcel.length,
    parcel.width,
    parcel.height,
    itemDescription,
    "NO",
    "NO",
  ];

  const csv = `${headers.map(csvCell).join(",")}\r\n${values.map(csvCell).join(",")}\r\n`;

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(event, "Content-Disposition", `attachment; filename="mypost-order-${order.id}.csv"`);
  return `\uFEFF${csv}`;
});
