import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🛒 CREATE STRIPE CHECKOUT");
  console.log("=================================");

  const config = useRuntimeConfig();

  const stripe = new Stripe(config.stripeSecretKey);

  const body = await readBody(event);

  // ----------------------------------------
  // CHECK CART
  // ----------------------------------------

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty",
    });
  }

  // ----------------------------------------
  // USER ID
  // ----------------------------------------

  const userId = body.userId || null;

  console.log("USER ID:", userId);

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "You must be logged in to checkout",
    });
  }

  // ----------------------------------------
  // CREATE LINE ITEMS
  // ----------------------------------------

  const lineItems = body.items.map((item: any) => ({
    price_data: {
      currency: "aud",

      product_data: {
        name: item.name,

        metadata: {
          product_id: String(item.id),
        },
      },

      unit_amount: Math.round(Number(item.price) * 100),
    },

    quantity: Number(item.quantity),
  }));

  console.log("STRIPE LINE ITEMS:", JSON.stringify(lineItems, null, 2));

  // ----------------------------------------
  // CREATE CHECKOUT SESSION
  // ----------------------------------------

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: lineItems,

      metadata: {
        user_id: String(userId),
      },

      success_url:
        `${getRequestURL(event).origin}` +
        `/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${getRequestURL(event).origin}/cart`,

      billing_address_collection: "required",

      shipping_address_collection: {
        allowed_countries: ["AU"],
      },
    });

    console.log("=================================");
    console.log("✅ STRIPE SESSION CREATED");
    console.log("SESSION:", session.id);
    console.log("URL:", session.url);
    console.log("=================================");

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error: any) {
    console.error("=================================");
    console.error("❌ STRIPE CHECKOUT ERROR");
    console.error(error);
    console.error("=================================");

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Unable to create Stripe checkout",
    });
  }
});
