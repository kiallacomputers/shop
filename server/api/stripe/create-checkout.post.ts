import Stripe from "stripe";
import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🛒 CREATE STRIPE CHECKOUT");
  console.log("=================================");

  const config = useRuntimeConfig();

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Stripe is not configured",
    });
  }

  const stripe = new Stripe(config.stripeSecretKey);

  // ----------------------------------------
  // AUTHENTICATE THE REAL USER
  // ----------------------------------------

  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "You must be logged in to checkout",
    });
  }

  // ----------------------------------------
  // READ CART
  // ----------------------------------------

  const body = await readBody(event);

  if (!Array.isArray(body?.items) || body.items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty",
    });
  }

  // ----------------------------------------
  // NORMALISE / VALIDATE CART IDS
  // ----------------------------------------

  const requestedItems = body.items.map((item: any) => ({
    id: Number(item?.id),
    quantity: Number(item?.quantity),
  }));

  if (
    requestedItems.some(
      (item: any) =>
        !Number.isInteger(item.id) ||
        item.id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0,
    )
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid cart item",
    });
  }

  // Combine duplicate product IDs safely.
  const quantities = new Map<number, number>();

  for (const item of requestedItems) {
    quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
  }

  const productIds = [...quantities.keys()];

  // ----------------------------------------
  // LOAD PRODUCTS FROM DATABASE
  // ----------------------------------------
  // Never trust product names/prices/stock supplied
  // by the browser.

  const supabase = getAdminSupabase();

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, price, stock, active")
    .in("id", productIds);

  if (productError) {
    console.error("PRODUCT LOOKUP ERROR:", productError);

    throw createError({
      statusCode: 500,
      statusMessage: productError.message,
    });
  }

  if (!products || products.length !== productIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "One or more products in your cart no longer exist",
    });
  }

  // ----------------------------------------
  // VALIDATE STOCK AND BUILD STRIPE ITEMS
  // ----------------------------------------

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const product of products) {
    const quantity = quantities.get(Number(product.id)) || 0;
    const stock = Number(product.stock);
    const price = Number(product.price);

    if (product.active === false) {
      throw createError({
        statusCode: 400,
        statusMessage: `${product.name} is no longer available`,
      });
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid price for ${product.name}`,
      });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      throw createError({
        statusCode: 500,
        statusMessage: `Invalid stock value for ${product.name}`,
      });
    }

    if (quantity > stock) {
      throw createError({
        statusCode: 400,
        statusMessage:
          stock === 0
            ? `${product.name} is out of stock`
            : `Only ${stock} of ${product.name} is available`,
      });
    }

    lineItems.push({
      price_data: {
        currency: "aud",
        product_data: {
          name: product.name,
          metadata: {
            product_id: String(product.id),
          },
        },
        unit_amount: Math.round(price * 100),
      },
      quantity,
    });
  }

  console.log(
    "STRIPE LINE ITEMS:",
    JSON.stringify(lineItems, null, 2),
  );

  // ----------------------------------------
  // CREATE CHECKOUT SESSION
  // ----------------------------------------

  const requestUrl = getRequestURL(event);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: lineItems,

    client_reference_id: user.id,

    metadata: {
      user_id: user.id,
    },

    customer_email: user.email || undefined,

    success_url:
      `${requestUrl.origin}/checkout/success` +
      `?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${requestUrl.origin}/shoppingcart`,

    billing_address_collection: "required",

    shipping_address_collection: {
      allowed_countries: ["AU"],
    },
  });

  console.log("=================================");
  console.log("✅ STRIPE SESSION CREATED");
  console.log("SESSION ID:", session.id);
  console.log("USER ID:", user.id);
  console.log("CHECKOUT URL:", session.url);
  console.log("=================================");

  return {
    url: session.url,
    sessionId: session.id,
  };
});
