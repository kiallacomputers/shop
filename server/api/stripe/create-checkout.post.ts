import Stripe from "stripe";

const config = useRuntimeConfig();

const stripe = new Stripe(config.stripeSecretKey);

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body?.items || !Array.isArray(body.items) || !body.items.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty",
    });
  }

  const supabase = serverSupabaseServiceRole(event);

  // Get product IDs from the cart
  const productIds = body.items.map((item: any) => item.id);

  // Get the real products from Supabase
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .in("id", productIds);

  if (error) {
    console.error("Supabase product error:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to load products",
    });
  }

  if (!products || products.length !== productIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "One or more products no longer exist",
    });
  }

  // Build Stripe line items
  const lineItems = body.items.map((cartItem: any) => {
    const product = products.find(
      (p) => p.id === cartItem.id
    );

    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `Product ${cartItem.id} not found`,
      });
    }

    const quantity = Number(cartItem.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid quantity for ${product.name}`,
      });
    }

    // Check stock before creating checkout
    if (product.stock < quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `${product.name} does not have enough stock`,
      });
    }

    return {
      price_data: {
        currency: "aud",

        product_data: {
          name: product.name,
        },

        // Stripe uses cents
        unit_amount: Math.round(Number(product.price) * 100),
      },

      quantity,
    };
  });

  // Save only the information required by the webhook
  const checkoutItems = body.items.map((cartItem: any) => ({
    id: cartItem.id,
    quantity: Number(cartItem.quantity),
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: lineItems,

      metadata: {
        items: JSON.stringify(checkoutItems),
      },

      success_url: `${config.public.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${config.public.siteUrl}/cart`,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("Stripe checkout error:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to create Stripe checkout",
    });
  }
});
