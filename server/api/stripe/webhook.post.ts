import Stripe from "stripe";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🔥 STRIPE WEBHOOK HIT");
  console.log("=================================");

  const config = useRuntimeConfig();

  if (!config.stripeSecretKey) {
    console.error("❌ STRIPE_SECRET_KEY IS MISSING");

    throw createError({
      statusCode: 500,
      statusMessage: "Stripe secret key is not configured",
    });
  }

  if (!config.stripeWebhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET IS MISSING");

    throw createError({
      statusCode: 500,
      statusMessage: "Stripe webhook secret is not configured",
    });
  }

  const stripe = new Stripe(config.stripeSecretKey);

  // ========================================
  // RAW BODY + SIGNATURE
  // ========================================

  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
    console.error("❌ MISSING WEBHOOK BODY OR SIGNATURE");

    throw createError({
      statusCode: 400,
      statusMessage: "Missing Stripe webhook data",
    });
  }

  // ========================================
  // VERIFY EVENT
  // ========================================

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret,
    );
  } catch (error: any) {
    console.error(
      "❌ STRIPE WEBHOOK SIGNATURE ERROR:",
      error?.message || error,
    );

    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Stripe webhook signature",
    });
  }

  console.log("EVENT ID:", stripeEvent.id);
  console.log("EVENT TYPE:", stripeEvent.type);

  if (stripeEvent.type !== "checkout.session.completed") {
    console.log("IGNORED EVENT:", stripeEvent.type);

    return {
      received: true,
      ignored: true,
    };
  }

  // ========================================
  // CHECKOUT SESSION
  // ========================================

  const session =
    stripeEvent.data.object as Stripe.Checkout.Session;

  console.log("SESSION ID:", session.id);
  console.log("PAYMENT STATUS:", session.payment_status);
  console.log("SESSION METADATA:", session.metadata);
  console.log(
    "CLIENT REFERENCE ID:",
    session.client_reference_id,
  );

  if (session.payment_status !== "paid") {
    console.log("⚠️ SESSION COMPLETED BUT PAYMENT NOT PAID");

    return {
      received: true,
      unpaid: true,
    };
  }

  // Use metadata first, then client_reference_id.
  const userId = String(
    session.metadata?.user_id ||
      session.client_reference_id ||
      "",
  );

  if (!userId) {
    console.error(
      "❌ NO SUPABASE USER ID ON STRIPE SESSION",
      {
        sessionId: session.id,
        metadata: session.metadata,
        clientReferenceId: session.client_reference_id,
      },
    );

    throw createError({
      statusCode: 500,
      statusMessage: "Stripe session has no Supabase user ID",
    });
  }

  console.log("SUPABASE USER ID:", userId);

  const supabase = getAdminSupabase();

  // ========================================
  // IDEMPOTENCY / DUPLICATE CHECK
  // ========================================

  const {
    data: existingOrder,
    error: existingOrderError,
  } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existingOrderError) {
    console.error(
      "❌ EXISTING ORDER CHECK ERROR:",
      existingOrderError,
    );

    throw createError({
      statusCode: 500,
      statusMessage: existingOrderError.message,
    });
  }

  if (existingOrder) {
    console.log(
      "⚠️ ORDER ALREADY EXISTS:",
      existingOrder.id,
    );

    return {
      received: true,
      duplicate: true,
      orderId: existingOrder.id,
    };
  }

  // ========================================
  // CUSTOMER + TOTAL
  // ========================================

  const customerEmail =
    session.customer_details?.email ||
    session.customer_email ||
    null;

  const customerName =
    session.customer_details?.name ||
    null;

  const total =
    Number(session.amount_total || 0) / 100;

  // ========================================
  // STRIPE LINE ITEMS
  // ========================================

  const lineItems =
    await stripe.checkout.sessions.listLineItems(
      session.id,
      {
        limit: 100,
        expand: ["data.price.product"],
      },
    );

  console.log(
    "LINE ITEM COUNT:",
    lineItems.data.length,
  );

  if (lineItems.data.length === 0) {
    console.error("❌ STRIPE SESSION HAS NO LINE ITEMS");

    throw createError({
      statusCode: 500,
      statusMessage: "Stripe session contains no line items",
    });
  }

  // ========================================
  // CREATE ORDER
  // ========================================

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      customer_email: customerEmail,
      customer_name: customerName,
      total,
      status: "paid",
    })
    .select("*")
    .single();

  if (orderError || !order) {
    console.error(
      "❌ ORDER CREATION FAILED:",
      orderError,
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        orderError?.message ||
        "Unable to create order",
    });
  }

  console.log("✅ ORDER CREATED:", order.id);

  // ========================================
  // SAVE ITEMS + UPDATE STOCK
  // ========================================

  for (const lineItem of lineItems.data) {
    const stripeProduct =
      lineItem.price?.product;

    if (
      !stripeProduct ||
      typeof stripeProduct === "string"
    ) {
      console.error(
        "❌ STRIPE PRODUCT WAS NOT EXPANDED:",
        lineItem.id,
      );

      continue;
    }

    const productId =
      stripeProduct.metadata?.product_id;

    if (!productId) {
      console.error(
        "❌ PRODUCT ID MISSING FROM STRIPE PRODUCT METADATA:",
        stripeProduct.id,
      );

      continue;
    }

    const quantity =
      Number(lineItem.quantity || 1);

    const productName =
      stripeProduct.name ||
      lineItem.description ||
      "Product";

    const price =
      Number(lineItem.price?.unit_amount || 0) /
      100;

    console.log(
      `PROCESSING PRODUCT ${productId}: ${productName} x ${quantity}`,
    );

    // Save order item.
    const {
      error: orderItemError,
    } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: Number(productId),
        product_name: productName,
        quantity,
        price,
      });

    if (orderItemError) {
      console.error(
        "❌ ORDER ITEM INSERT ERROR:",
        orderItemError,
      );

      throw createError({
        statusCode: 500,
        statusMessage: orderItemError.message,
      });
    }

    // Read current stock.
    const {
      data: productData,
      error: productError,
    } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("id", Number(productId))
      .single();

    if (productError || !productData) {
      console.error(
        "❌ PRODUCT LOOKUP ERROR:",
        productError,
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          productError?.message ||
          `Product ${productId} was not found`,
      });
    }

    const currentStock =
      Number(productData.stock || 0);

    const newStock = Math.max(
      0,
      currentStock - quantity,
    );

    const {
      error: stockError,
    } = await supabase
      .from("products")
      .update({
        stock: newStock,
      })
      .eq("id", Number(productId));

    if (stockError) {
      console.error(
        "❌ STOCK UPDATE ERROR:",
        stockError,
      );

      throw createError({
        statusCode: 500,
        statusMessage: stockError.message,
      });
    }

    console.log(
      `✅ STOCK UPDATED: ${productData.name}: ${currentStock} -> ${newStock}`,
    );
  }

  console.log("=================================");
  console.log("🎉 WEBHOOK COMPLETE");
  console.log("ORDER ID:", order.id);
  console.log("SESSION ID:", session.id);
  console.log("=================================");

  return {
    received: true,
    orderId: order.id,
  };
});
