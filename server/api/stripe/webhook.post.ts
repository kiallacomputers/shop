import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const stripe = new Stripe(config.stripeSecretKey);

  // IMPORTANT: read the raw Stripe request
  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing Stripe webhook signature",
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
    console.error("Stripe webhook signature error:", error.message);

    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Stripe webhook signature",
    });
  }

  console.log("Stripe event:", stripeEvent.type);

  // Only process successful checkout
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    console.log("Payment successful:", session.id);

    if (session.payment_status !== "paid") {
      console.log("Payment was not paid");

      return {
        received: true,
      };
    }

    // Get the products purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
    });

    const supabase = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey,
    );

    for (const lineItem of lineItems.data) {
      const product = lineItem.price?.product;

      if (!product || typeof product === "string") {
        console.log("No Stripe product found");
        continue;
      }

      const productId = product.metadata?.product_id;

      if (!productId) {
        console.log("No database product ID found");
        continue;
      }

      const quantity = lineItem.quantity || 1;

      console.log(`Reducing stock: product ${productId}, quantity ${quantity}`);

      // Get current stock
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, stock")
        .eq("id", productId)
        .single();

      if (productError) {
        console.error("Product lookup error:", productError);
        continue;
      }

      if (!productData) {
        console.error("Product not found:", productId);
        continue;
      }

      const currentStock = Number(productData.stock);

      const newStock = Math.max(0, currentStock - quantity);

      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock: newStock,
        })
        .eq("id", productId);

      if (updateError) {
        console.error("Stock update failed:", updateError);
      } else {
        console.log(`Stock updated: ${currentStock} -> ${newStock}`);
      }
    }
  }

  return {
    received: true,
  };
});
