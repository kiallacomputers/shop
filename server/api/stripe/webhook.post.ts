import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  console.log("🔥 STRIPE WEBHOOK HIT");

  const config = useRuntimeConfig();
  const supabaseSecretKey = "sb_publishable_pLRAptwDfESFnWFKCFM2eQ_UNpltmqX";

  const stripe = new Stripe(config.stripeSecretKey);

  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
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
    console.error("WEBHOOK SIGNATURE ERROR:", error.message);

    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }

  console.log("EVENT TYPE:", stripeEvent.type);

  if (stripeEvent.type !== "checkout.session.completed") {
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
  // SUPABASE
  // ----------------------------------------

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // ----------------------------------------
  // GET STRIPE LINE ITEMS
  // ----------------------------------------

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  console.log("LINE ITEMS:", JSON.stringify(lineItems.data, null, 2));

  // ----------------------------------------
  // PROCESS EACH PRODUCT
  // ----------------------------------------

  for (const lineItem of lineItems.data) {
    console.log("---------------------------------");
    console.log("PROCESSING ITEM");

    const stripeProduct = lineItem.price?.product;

    console.log("STRIPE PRODUCT:", stripeProduct);

    if (!stripeProduct || typeof stripeProduct === "string") {
      console.log("PRODUCT NOT FOUND");
      continue;
    }

    // ----------------------------------------
    // GET DATABASE PRODUCT ID
    // ----------------------------------------

    const productId = stripeProduct.metadata?.product_id;

    console.log("DATABASE PRODUCT ID:", productId);

    if (!productId) {
      console.log("NO PRODUCT ID IN STRIPE METADATA");
      continue;
    }

    const quantity = Number(lineItem.quantity) || 1;

    console.log("QUANTITY SOLD:", quantity);

    // ----------------------------------------
    // GET PRODUCT FROM SUPABASE
    // ----------------------------------------

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("id", productId)
      .single();

    console.log("SUPABASE PRODUCT:", productData);

    console.log("SUPABASE ERROR:", productError);

    if (productError || !productData) {
      console.error("COULD NOT FIND SUPABASE PRODUCT", productId);

      continue;
    }

    // ----------------------------------------
    // CALCULATE STOCK
    // ----------------------------------------

    const currentStock = Number(productData.stock) || 0;

    const newStock = Math.max(0, currentStock - quantity);

    console.log(`STOCK: ${currentStock} -> ${newStock}`);

    // ----------------------------------------
    // UPDATE STOCK
    // ----------------------------------------

    console.log("UPDATING STOCK");

    console.log("Product ID:", productId);

    console.log("Old Stock:", productData.stock);

    console.log("New Stock:", newStock);

    const { data: updateData, error: updateError } = await supabase
      .from("products")
      .update({
        stock: newStock,
      })
      .eq("id", productId)
      .select("id, name, stock");

    console.log("UPDATE RESULT:", updateData);

    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      console.error("STOCK UPDATE FAILED:", updateError);

      throw createError({
        statusCode: 500,
        statusMessage: updateError.message,
      });
    }

    // ----------------------------------------
    // VERIFY UPDATE
    // ----------------------------------------

    if (!updateData || updateData.length === 0) {
      console.error("STOCK UPDATE DID NOT MATCH ANY PRODUCT");

      console.error("Product ID:", productId);

      throw createError({
        statusCode: 500,
        statusMessage: "Product stock update matched no rows",
      });
    }

    console.log(
      `DATABASE UPDATED: ${updateData[0].name} stock is now ${updateData[0].stock}`,
    );
  }

  // ----------------------------------------
  // WEBHOOK COMPLETE
  // ----------------------------------------

  console.log("=================================");
  console.log("WEBHOOK COMPLETE");
  console.log("=================================");

  return {
    received: true,
  };
});
