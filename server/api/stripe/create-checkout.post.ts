
import Stripe from "stripe";
import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { calculateFreightOptions } from "~~/server/utils/freight";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Stripe is not configured",
    });
  }

  const stripe =
    new Stripe(config.stripeSecretKey);

  const user: any =
    await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "You must be logged in to checkout",
    });
  }

  const userId = String(
    user.id || user.sub || "",
  );

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "Unable to determine your user ID",
    });
  }

  const body = await readBody(event);

  if (
    !Array.isArray(body?.items) ||
    body.items.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty",
    });
  }

  const requestedItems =
    body.items.map((item: any) => ({
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

  const quantities =
    new Map<number, number>();

  for (const item of requestedItems) {
    quantities.set(
      item.id,
      (quantities.get(item.id) || 0) +
        item.quantity,
    );
  }

  const productIds = [
    ...quantities.keys(),
  ];

  const supabase =
    getAdminSupabase();

  const {
    data: products,
    error: productError,
  } = await supabase
    .from("products")
    .select(
      "id, name, price, stock, active",
    )
    .in("id", productIds);

  if (productError) {
    throw createError({
      statusCode: 500,
      statusMessage:
        productError.message,
    });
  }

  if (
    !products ||
    products.length !==
      productIds.length
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "One or more products in your cart no longer exist",
    });
  }

  const lineItems:
    Stripe.Checkout.SessionCreateParams.LineItem[] =
      [];

  for (const product of products) {
    const quantity =
      quantities.get(
        Number(product.id),
      ) || 0;

    const stock =
      Number(product.stock);

    const price =
      Number(product.price);

    if (product.active === false) {
      throw createError({
        statusCode: 400,
        statusMessage:
          `${product.name} is no longer available`,
      });
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          `Invalid price for ${product.name}`,
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
            product_id:
              String(product.id),
          },
        },
        unit_amount:
          Math.round(price * 100),
      },
      quantity,
    });
  }

  // ========================================
  // SERVER-SIDE FREIGHT RECALCULATION
  // ========================================

  const freight =
    await calculateFreightOptions({
      items: requestedItems,
      postcode: body?.postcode,
    });

  const requestedServiceCode =
    String(
      body?.shippingServiceCode || "",
    ).trim();

  const selectedRate =
    freight.rates.find(
      (rate) =>
        rate.code ===
        requestedServiceCode,
    );

  if (!selectedRate) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "The selected delivery service is no longer available. Please recalculate delivery.",
    });
  }

  if (selectedRate.price > 0) {
    lineItems.push({
      price_data: {
        currency: "aud",
        product_data: {
          name:
            `Delivery - ${selectedRate.name}`,
          metadata: {
            shipping_service_code:
              selectedRate.code,
          },
        },
        unit_amount:
          Math.round(
            selectedRate.price * 100,
          ),
      },
      quantity: 1,
    });
  }

  const requestUrl =
    getRequestURL(event);

  const session =
    await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,

      client_reference_id: userId,

      metadata: {
        user_id: userId,
        shipping_postcode:
          freight.postcode,
        shipping_service_code:
          selectedRate.code,
        shipping_method:
          selectedRate.name,
        shipping_cost:
          selectedRate.price.toFixed(2),
      },

      customer_email:
        user.email || undefined,

      success_url:
        `${requestUrl.origin}/checkout/success` +
        `?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${requestUrl.origin}/shoppingcart`,

      billing_address_collection:
        "required",

      shipping_address_collection: {
        allowed_countries: ["AU"],
      },
    });

  return {
    url: session.url,
    sessionId: session.id,
  };
});
