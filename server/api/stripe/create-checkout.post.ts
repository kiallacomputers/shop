import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
  // READ CART
  // ----------------------------------------

  const body = await readBody(event);

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    console.error("❌ CART IS EMPTY");

    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty",
    });
  }

  console.log("CART ITEMS:", JSON.stringify(body.items, null, 2));

  // ----------------------------------------
  // SUPABASE
  // ----------------------------------------

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // ----------------------------------------
  // GET AUTHENTICATED USER
  // ----------------------------------------

  const accessToken = getCookie(event, "sb-access-token");

  let userId: string | null = null;

  if (accessToken) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError) {
      console.error("SUPABASE USER ERROR:", userError);
    }

    if (user) {
      userId = user.id;
    }
  }

  console.log("USER ID:", userId);

  // ----------------------------------------
  // FALLBACK:
  // USE SUPABASE SERVER CLIENT IF AVAILABLE
  // ----------------------------------------

  if (!userId) {
    try {
      const serverSupabase = serverSupabaseClient(event);

      const {
        data: { user },
      } = await serverSupabase.auth.getUser();

      if (user) {
        userId = user.id;
      }
    } catch (error) {
      console.log("Could not get authenticated Supabase user");
    }
  }

  console.log("FINAL USER ID:", userId);

  // ----------------------------------------
  // REQUIRE LOGIN
  // ----------------------------------------

  if (!userId) {
    console.error("❌ NO AUTHENTICATED USER");

    throw createError({
      statusCode: 401,
      statusMessage: "You must be logged in to checkout",
    });
  }

  // ----------------------------------------
  // CREATE STRIPE LINE ITEMS
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
  // CREATE STRIPE CHECKOUT SESSION
  // ----------------------------------------

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: lineItems,

    // --------------------------------------
    // CUSTOMER INFORMATION
    // --------------------------------------

    metadata: {
      user_id: userId,
    },

    // --------------------------------------
    // RETURN URLS
    // --------------------------------------

    success_url:
      `${getRequestURL(event).origin}` +
      `/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${getRequestURL(event).origin}/cart`,

    // --------------------------------------
    // BILLING
    // --------------------------------------

    billing_address_collection: "required",

    // --------------------------------------
    // SHIPPING
    // --------------------------------------

    shipping_address_collection: {
      allowed_countries: ["AU"],
    },
  });

  console.log("=================================");

  console.log("✅ STRIPE SESSION CREATED:", session.id);

  console.log("USER ID:", userId);

  console.log("CHECKOUT URL:", session.url);

  console.log("=================================");

  // ----------------------------------------
  // RETURN CHECKOUT URL
  // ----------------------------------------

  return {
    url: session.url,
    sessionId: session.id,
  };
});
