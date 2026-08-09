import Stripe from "stripe";

const config = useRuntimeConfig();

const stripe = new Stripe(config.stripeSecretKey);

export default defineEventHandler(async (event) => {
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
      config.stripeWebhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);

    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Stripe signature",
    });
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    console.log("Stripe payment completed:", session.id);

    const items = JSON.parse(
      session.metadata?.items || "[]"
    );

    const supabase = serverSupabaseServiceRole(event);

    for (const item of items) {
      const { data: product, error } = await supabase
        .from("products")
        .select("id, stock")
        .eq("id", item.id)
        .single();

      if (error || !product) {
        console.error("Product not found:", item.id);
        continue;
      }

      const newStock = product.stock - item.quantity;

      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock: Math.max(0, newStock),
        })
        .eq("id", item.id);

      if (updateError) {
        console.error(
          `Failed to update stock for ${item.id}:`,
          updateError
        );
      }
    }
  }

  return {
    received: true,
  };
});
