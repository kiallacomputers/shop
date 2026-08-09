import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const stripe = new Stripe(config.stripeSecretKey);

  const body = await readBody(event);

  if (!body.items || !Array.isArray(body.items)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty",
    });
  }

  const lineItems = body.items.map((item: any) => ({
    price_data: {
      currency: "aud",
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(Number(item.price) * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: lineItems,

    success_url: `${getRequestURL(event).origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${getRequestURL(event).origin}/cart`,

    billing_address_collection: "required",

    shipping_address_collection: {
      allowed_countries: ["AU"],
    },
  });

  return {
    url: session.url,
  };
});
