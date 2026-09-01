import Stripe from "stripe";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
import { calculateFreightOptions } from "~~/server/utils/freight";

const text = (value: unknown) => String(value ?? "").trim();

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  if (!config.stripeSecretKey) {
    throw createError({ statusCode: 500, statusMessage: "Stripe is not configured" });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  const user: any = await requireRequestUser(event);
  const userId = String(user.id || "");
  const body = await readBody(event);

  if (!Array.isArray(body?.items) || body.items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Cart is empty" });
  }

  const addressId = text(body?.addressId);
  if (!addressId) {
    throw createError({ statusCode: 400, statusMessage: "Please choose a delivery address." });
  }

  const requestedItems = body.items.map((item: any) => ({
    id: Number(item?.id),
    quantity: Number(item?.quantity),
  }));

  if (requestedItems.some((item: any) => !Number.isInteger(item.id) || item.id <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid cart item" });
  }

  const quantities = new Map<number, number>();
  for (const item of requestedItems) {
    quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
  }

  const supabase = getAdminSupabase();

  // Always read the selected delivery address from the database. Never trust
  // address fields supplied by the browser.
  const { data: address, error: addressError } = await supabase
    .from("customer_addresses")
    .select("id, user_id, label, full_name, address_line_1, address_line_2, suburb, state, postcode, country, phone, is_primary")
    .eq("id", addressId)
    .eq("user_id", userId)
    .maybeSingle();

  if (addressError) {
    throw createError({ statusCode: 500, statusMessage: addressError.message });
  }

  if (!address) {
    throw createError({ statusCode: 400, statusMessage: "The selected delivery address could not be found. Please choose it again." });
  }

  const postcode = text(address.postcode);
  if (!/^\d{4}$/.test(postcode)) {
    throw createError({ statusCode: 400, statusMessage: "The selected delivery address has an invalid postcode." });
  }

  const productIds = [...quantities.keys()];
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, price, stock, active")
    .in("id", productIds);

  if (productError) {
    throw createError({ statusCode: 500, statusMessage: productError.message });
  }

  if (!products || products.length !== productIds.length) {
    throw createError({ statusCode: 400, statusMessage: "One or more products in your cart no longer exist" });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const product of products) {
    const quantity = quantities.get(Number(product.id)) || 0;
    const stock = Number(product.stock);
    const price = Number(product.price);

    if (product.active === false) {
      throw createError({ statusCode: 400, statusMessage: `${product.name} is no longer available` });
    }
    if (!Number.isFinite(price) || price <= 0) {
      throw createError({ statusCode: 400, statusMessage: `Invalid price for ${product.name}` });
    }
    if (quantity > stock) {
      throw createError({
        statusCode: 400,
        statusMessage: stock === 0 ? `${product.name} is out of stock` : `Only ${stock} of ${product.name} is available`,
      });
    }

    lineItems.push({
      price_data: {
        currency: "aud",
        product_data: {
          name: product.name,
          metadata: { product_id: String(product.id) },
        },
        unit_amount: Math.round(price * 100),
      },
      quantity,
    });
  }

  // Recalculate freight server-side using the postcode from the selected saved address.
  const freight = await calculateFreightOptions({ items: requestedItems, postcode });
  const requestedServiceCode = text(body?.shippingServiceCode);
  const selectedRate = freight.rates.find((rate) => rate.code === requestedServiceCode);

  if (!selectedRate) {
    throw createError({
      statusCode: 400,
      statusMessage: "The selected delivery service is no longer available. Please recalculate delivery.",
    });
  }

  if (selectedRate.price > 0) {
    lineItems.push({
      price_data: {
        currency: "aud",
        product_data: {
          name: `Delivery - ${selectedRate.name}`,
          metadata: { shipping_service_code: selectedRate.code },
        },
        unit_amount: Math.round(selectedRate.price * 100),
      },
      quantity: 1,
    });
  }

  const requestUrl = getRequestURL(event);

  // Snapshot the chosen address into Stripe metadata so the paid order retains
  // the exact delivery destination even if the customer later edits My Account.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    client_reference_id: userId,
    metadata: {
      user_id: userId,
      shipping_address_id: String(address.id),
      shipping_label: text(address.label),
      shipping_name: text(address.full_name),
      shipping_address_line_1: text(address.address_line_1),
      shipping_address_line_2: text(address.address_line_2),
      shipping_suburb: text(address.suburb),
      shipping_state: text(address.state),
      shipping_postcode: postcode,
      shipping_country: text(address.country) || "AU",
      shipping_phone: text(address.phone),
      shipping_service_code: selectedRate.code,
      shipping_method: selectedRate.name,
      shipping_cost: selectedRate.price.toFixed(2),
    },
    customer_email: user.email || undefined,
    success_url: `${requestUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${requestUrl.origin}/shoppingcart`,
    // The delivery address has already been selected on the Kialla Computers
    // site, so Stripe only collects billing details if the payment method needs them.
    billing_address_collection: "auto",
  });

  return { url: session.url, sessionId: session.id };
});
