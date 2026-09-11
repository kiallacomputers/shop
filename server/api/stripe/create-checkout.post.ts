import Stripe from "stripe";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
import { getSiteOrigin } from "~~/server/utils/siteUrl";
import { calculateFreightOptions, getStorePickupOption } from "~~/server/utils/freight";
import {
  calculateBaseCustomerPrice,
  calculateVariantCustomerPrice,
  getPricingLevelForUser,
  getStandardPricingLevel,
} from "~~/server/utils/customerPricing";
import { throwInternalError } from "~~/server/utils/internalError";

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

  const fulfilmentMethod = text(body?.fulfilmentMethod).toLowerCase() === "pickup" ? "pickup" : "delivery";
  const addressId = text(body?.addressId);
  if (fulfilmentMethod === "delivery" && !addressId) {
    throw createError({ statusCode: 400, statusMessage: "Please choose a delivery address." });
  }

  const requestedItems = body.items.map((item: any) => ({
    id: Number(item?.id),
    variantId: item?.variantId == null ? null : Number(item.variantId),
    quantity: Number(item?.quantity),
  }));

  if (requestedItems.some((item: any) => !Number.isInteger(item.id) || item.id <= 0 || (item.variantId !== null && (!Number.isInteger(item.variantId) || item.variantId <= 0)) || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid cart item" });
  }

  const quantities = new Map<string, number>();
  for (const item of requestedItems) {
    const key = `${item.id}:${item.variantId ?? "base"}`;
    quantities.set(key, (quantities.get(key) || 0) + item.quantity);
  }

  const supabase = getAdminSupabase();

  // Always read the selected delivery address from the database for delivery orders.
  // Store pickup uses the administrator-configured pickup location instead.
  let address: any = null;
  let postcode = "";
  let pickupOption: any = null;

  if (fulfilmentMethod === "delivery") {
    const { data: savedAddress, error: addressError } = await supabase
      .from("customer_addresses")
      .select("id, user_id, label, full_name, address_line_1, address_line_2, suburb, state, postcode, country, phone, is_primary")
      .eq("id", addressId)
      .eq("user_id", userId)
      .maybeSingle();

    if (addressError) {
      throwInternalError(event, "CHECKOUT ADDRESS LOOKUP ERROR", addressError, "Unable to load the selected delivery address.");
    }

    if (!savedAddress) {
      throw createError({ statusCode: 400, statusMessage: "The selected delivery address could not be found. Please choose it again." });
    }

    address = savedAddress;
    postcode = text(address.postcode);
    if (!/^\d{4}$/.test(postcode)) {
      throw createError({ statusCode: 400, statusMessage: "The selected delivery address has an invalid postcode." });
    }
  } else {
    pickupOption = await getStorePickupOption();
    if (!pickupOption.enabled) {
      throw createError({ statusCode: 400, statusMessage: "Pickup in store is currently unavailable." });
    }
  }

  const productIds = [...new Set(requestedItems.map((item: any) => item.id))];
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, price, buy_price_ex_gst, stock, active, has_variants, product_code")
    .in("id", productIds);

  if (productError) {
    throwInternalError(event, "CHECKOUT PRODUCT LOOKUP ERROR", productError, "Unable to load your cart products.");
  }

  if (!products || products.length !== productIds.length) {
    throw createError({ statusCode: 400, statusMessage: "One or more products in your cart no longer exist" });
  }

  const [pricingLevel, standardPricingLevel] = await Promise.all([
    getPricingLevelForUser(userId),
    getStandardPricingLevel(),
  ]);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  const variantIds = requestedItems.map((item: any) => item.variantId).filter((id: any) => Number.isInteger(id));
  const { data: variants, error: variantError } = variantIds.length
    ? await supabase.from("product_variants").select("id,product_id,name,product_code,price,stock,active").in("id", variantIds)
    : { data: [], error: null };
  if (variantError) throwInternalError(event, "CHECKOUT VARIANT LOOKUP ERROR", variantError, "Unable to load product options.");
  const variantMap = new Map((variants || []).map((v: any) => [Number(v.id), v]));

  for (const item of requestedItems) {
    const product: any = products.find((p: any) => Number(p.id) === item.id);
    if (!product) throw createError({ statusCode: 400, statusMessage: "A product in your cart no longer exists" });
    const quantity = quantities.get(`${item.id}:${item.variantId ?? "base"}`) || 0;
    const variant: any = item.variantId ? variantMap.get(Number(item.variantId)) : null;

    if (product.has_variants && (!variant || Number(variant.product_id) !== Number(product.id))) {
      throw createError({ statusCode: 400, statusMessage: `Please choose a valid option for ${product.name}` });
    }
    if (!product.has_variants && item.variantId) throw createError({ statusCode: 400, statusMessage: `Invalid option for ${product.name}` });

    const sellable: any = variant || product;
    const stock = Number(sellable.stock);

    // Customer pricing is always recalculated server-side. The browser/cart
    // cannot choose or submit its own price.
    const baseCustomerPrice = calculateBaseCustomerPrice(
      product.buy_price_ex_gst,
      pricingLevel.markupPercent,
      product.price,
      standardPricingLevel.markupPercent,
    );
    const price = variant
      ? calculateVariantCustomerPrice({
          baseCustomerPrice,
          storedBasePrice: product.price,
          variantPrice: variant.price,
        })
      : baseCustomerPrice;
    if (product.active === false || variant?.active === false) throw createError({ statusCode: 400, statusMessage: `${product.name} is no longer available` });
    if (!Number.isFinite(price) || price <= 0) throw createError({ statusCode: 400, statusMessage: `Invalid price for ${product.name}` });
    // Back orders are allowed. Stock may be zero or lower than the requested
    // quantity; the paid order is still accepted and stock is clamped to zero
    // by the webhook after purchase.

    lineItems.push({
      price_data: {
        currency: "aud",
        product_data: {
          name: variant ? `${product.name} - ${variant.name}` : product.name,
          metadata: { product_id: String(product.id), variant_id: variant ? String(variant.id) : "", product_code: variant?.product_code || product.product_code || "" },
        },
        unit_amount: Math.round(price * 100),
      },
      quantity,
    });
  }

  const requestedServiceCode = text(body?.shippingServiceCode);
  let selectedRate: { code: string; name: string; price: number; free: boolean };

  if (fulfilmentMethod === "pickup") {
    if (requestedServiceCode && requestedServiceCode !== "STORE_PICKUP") {
      throw createError({ statusCode: 400, statusMessage: "Invalid pickup option." });
    }
    selectedRate = { code: "STORE_PICKUP", name: pickupOption.name, price: 0, free: true };
  } else {
    // Recalculate freight server-side using the postcode from the selected saved address.
    const freight = await calculateFreightOptions({ items: requestedItems, postcode });
    const matchedRate = freight.rates.find((rate) => rate.code === requestedServiceCode);
    if (!matchedRate) {
      throw createError({
        statusCode: 400,
        statusMessage: "The selected delivery service is no longer available. Please recalculate delivery.",
      });
    }
    selectedRate = matchedRate;
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

  const siteOrigin = getSiteOrigin(event);

  // Snapshot the chosen address into Stripe metadata so the paid order retains
  // the exact delivery destination even if the customer later edits My Account.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    client_reference_id: userId,
    metadata: {
      user_id: userId,
      fulfilment_method: fulfilmentMethod,
      shipping_address_id: fulfilmentMethod === "delivery" ? String(address.id) : "",
      shipping_label: fulfilmentMethod === "delivery" ? text(address.label) : "Store Pickup",
      customer_name: fulfilmentMethod === "delivery"
        ? text(address.full_name)
        : text(user?.user_metadata?.full_name || user?.user_metadata?.name || user.email),
      shipping_name: fulfilmentMethod === "delivery"
        ? text(address.full_name)
        : text(pickupOption.name),
      shipping_address_line_1: fulfilmentMethod === "delivery" ? text(address.address_line_1) : text(pickupOption.addressLine1),
      shipping_address_line_2: fulfilmentMethod === "delivery" ? text(address.address_line_2) : text(pickupOption.addressLine2),
      shipping_suburb: fulfilmentMethod === "delivery" ? text(address.suburb) : text(pickupOption.suburb),
      shipping_state: fulfilmentMethod === "delivery" ? text(address.state) : text(pickupOption.state),
      shipping_postcode: fulfilmentMethod === "delivery" ? postcode : text(pickupOption.postcode),
      shipping_country: "AU",
      shipping_phone: fulfilmentMethod === "delivery" ? text(address.phone) : "",
      pickup_name: fulfilmentMethod === "pickup" ? text(pickupOption.name) : "",
      pickup_instructions: fulfilmentMethod === "pickup" ? text(pickupOption.instructions) : "",
      shipping_service_code: selectedRate.code,
      shipping_method: selectedRate.name,
      shipping_cost: selectedRate.price.toFixed(2),
      pricing_level: pricingLevel.key,
      pricing_level_name: pricingLevel.name,
    },
    customer_email: user.email || undefined,
    success_url: `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteOrigin}/shoppingcart`,
    // The delivery address has already been selected on the Kialla Computers
    // site, so Stripe only collects billing details if the payment method needs them.
    billing_address_collection: "auto",
  });

  return { url: session.url, sessionId: session.id };
});
