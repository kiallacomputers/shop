import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🛒 CREATE STRIPE CHECKOUT");
  console.log("=================================");

  const config = useRuntimeConfig();

  // ----------------------------------------
  // STRIPE
  // ----------------------------------------

  const stripe = new Stripe(config.stripeSecretKey);

  // ----------------------------------------
  // READ REQUEST BODY
  // ----------------------------------------

  const body = await readBody(event);

  // ----------------------------------------
  // USER ID
  // ----------------------------------------

  const userId = body.userId || null;

  console.log("USER ID:", userId);

  if (!userId) {
    console.error("❌ NO USER ID RECEIVED");

    throw createError({
      statusCode: 401,
      statusMessage: "You must be logged in to checkout",
    });
  }

  // ----------------------------------------
  // CART
  // ----------------------------------------

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    console.error("❌ CART IS EMPTY");

    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty",
    });
  }

  console.log("CART ITEMS:", body.items);

  // ----------------------------------------
  // CREATE STRIPE LINE ITEMS
  // ----------------------------------------

  const lineItems = body.items.map((item: any) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);

    if (!item.id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Product ID is missing",
      });
    }

    if (!item.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Product name is missing",
      });
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid price for ${item.name}`,
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid quantity for ${item.name}`,
      });
    }

    return {
      price_data: {
        currency: "aud",

        product_data: {
          name: item.name,

          // --------------------------------
          // THIS IS IMPORTANT
          // --------------------------------
          // Stripe stores your Supabase
          // product ID in the Stripe product
          // metadata.

          metadata: {
            product_id: String(item.id),
          },
        },

        unit_amount: Math.round(price * 100),
      },

      quantity: quantity,
    };
  });

  console.log("STRIPE LINE ITEMS:", JSON.stringify(lineItems, null, 2));

  // ----------------------------------------
  // REQUEST URL
  // ----------------------------------------

  const requestUrl = getRequestURL(event);

  console.log("CHECKOUT ORIGIN:", requestUrl.origin);

  // ----------------------------------------
  // CREATE STRIPE CHECKOUT SESSION
  // ----------------------------------------

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: lineItems,

    // --------------------------------------
    // USER INFORMATION
    // --------------------------------------
    // This travels with the Stripe session
    // and is available to the webhook.

    metadata: {
      user_id: String(userId),
    },

    success_url:
      `${requestUrl.origin}/checkout/success` +
      `?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${requestUrl.origin}/cart`,

    billing_address_collection: "required",

    shipping_address_collection: {
      allowed_countries: ["AU"],
    },
  });

  console.log("=================================");
  console.log("✅ STRIPE SESSION CREATED");
  console.log("SESSION ID:", session.id);
  console.log("USER ID:", userId);
  console.log("CHECKOUT URL:", session.url);
  console.log("=================================");

  // ----------------------------------------
  // RETURN TO BROWSER
  // ----------------------------------------

  return {
    url: session.url,
    sessionId: session.id,
  };
});
