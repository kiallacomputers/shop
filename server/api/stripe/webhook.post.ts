import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  console.log("🔥 STRIPE WEBHOOK HIT");

  const config = useRuntimeConfig();

  const stripe = new Stripe(config.stripeSecretKey);

  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  console.log("=================================");
  console.log("STRIPE WEBHOOK RECEIVED");
  console.log("=================================");

  if (!body || !signature) {
    console.log("NO BODY");
    throw createError({
      statusCode: 400,
      statusMessage: "Missing Stripe webhook data",
    });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret,
    );
  } catch (error: any) {
    console.log("WEBHOOK SIGNATURE ERROR:", error.message);

    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }

  console.log("EVENT TYPE:", stripeEvent.type);

  if (stripeEvent.type !== "checkout.session.completed") {
    console.log("Ignoring event:", stripeEvent.type);

    return {
      received: true,
    };
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session;

  console.log("SESSION ID:", session.id);
  console.log("PAYMENT STATUS:", session.payment_status);

  if (session.payment_status !== "paid") {
    console.log("PAYMENT NOT PAID");

    return {
      received: true,
    };
  }

  console.log("PAYMENT IS PAID");

  // ----------------------------------------
  // GET STRIPE LINE ITEMS
  // ----------------------------------------

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  console.log("LINE ITEMS:", JSON.stringify(lineItems.data, null, 2));

  // ----------------------------------------
  // SUPABASE
  // ----------------------------------------

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  for (const lineItem of lineItems.data) {
    console.log("---------------------------------");
    console.log("PROCESSING ITEM");

    const product = lineItem.price?.product;

    console.log("STRIPE PRODUCT:", product);

    if (!product || typeof product === "string") {
      console.log("PRODUCT NOT FOUND");
      continue;
    }

    const productId = product.metadata?.product_id;

    console.log("DATABASE PRODUCT ID:", productId);

    if (!productId) {
      console.log("NO PRODUCT ID IN METADATA");
      continue;
    }

    const quantity = Number(lineItem.quantity) || 1;

    console.log("QUANTITY SOLD:", quantity);

    // ----------------------------------------
    // GET PRODUCT FROM SUPABASE
    // ----------------------------------------

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id, stock")
      .eq("id", productId)
      .single();

    console.log("SUPABASE PRODUCT:", productData);
    console.log("SUPABASE ERROR:", productError);

    if (productError || !productData) {
      console.log("COULD NOT FIND SUPABASE PRODUCT");
      continue;
    }

    const currentStock = Number(productData.stock);

    const newStock = Math.max(0, currentStock - quantity);

    console.log(`STOCK: ${currentStock} -> ${newStock}`);

    // ----------------------------------------
    // UPDATE STOCK
    // ----------------------------------------

    const { data: updateData, error: updateError } = await supabase
      .from("products")
      .update({
        stock: newStock,
      })
      .eq("id", productId)
      .select();

    console.log("UPDATE RESULT:", updateData);
    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      console.error("STOCK UPDATE FAILED:", updateError);
    } else {
      console.log(`SUCCESS: Product ${productId} stock is now ${newStock}`);
    }
  }

  console.log("=================================");
  console.log("WEBHOOK COMPLETE");
  console.log("=================================");

  return {
    received: true,
  };
});
