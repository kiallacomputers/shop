import Stripe from "stripe";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { sendOrderEmails } from "~~/server/utils/orderEmail";
import { throwInternalError } from "~~/server/utils/internalError";

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
    console.error("❌ NO SUPABASE USER ID ON STRIPE SESSION", {
      sessionId: session.id,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Stripe session has no Supabase user ID",
    });
  }


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

    throwInternalError(
      event,
      "STRIPE EXISTING ORDER CHECK ERROR",
      existingOrderError,
      "Unable to process this payment confirmation.",
    );
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
    session.metadata?.customer_name ||
    session.metadata?.shipping_name ||
    session.customer_details?.name ||
    null;

  // The customer selects a saved delivery address before Stripe Checkout.
  // create-checkout snapshots that exact address into Stripe metadata so the
  // webhook, emails and invoice do not depend on the address later being edited.
  const hasSavedShippingAddress = Boolean(
    session.metadata?.shipping_address_line_1 ||
      session.metadata?.shipping_postcode,
  );

  const shippingAddress = hasSavedShippingAddress
    ? {
        name: session.metadata?.shipping_name || customerName || null,
        line1: session.metadata?.shipping_address_line_1 || null,
        line2: session.metadata?.shipping_address_line_2 || null,
        city: session.metadata?.shipping_suburb || null,
        state: session.metadata?.shipping_state || null,
        postal_code: session.metadata?.shipping_postcode || null,
        country: session.metadata?.shipping_country || "AU",
      }
    : null;

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
      shipping_name:
        session.metadata?.shipping_name || null,
      shipping_address_line_1:
        session.metadata?.shipping_address_line_1 || null,
      shipping_address_line_2:
        session.metadata?.shipping_address_line_2 || null,
      shipping_suburb:
        session.metadata?.shipping_suburb || null,
      shipping_state:
        session.metadata?.shipping_state || null,
      shipping_postcode:
        session.metadata?.shipping_postcode || null,
      shipping_country:
        session.metadata?.shipping_country || "AU",
      shipping_method:
        session.metadata?.shipping_method || null,
      shipping_service_code:
        session.metadata?.shipping_service_code || null,
      shipping_cost:
        Number(session.metadata?.shipping_cost || 0),
      processing_fee:
        Number(session.metadata?.processing_fee || 0),
    })
    .select("*")
    .single();

  if (orderError || !order) {
    console.error(
      "❌ ORDER CREATION FAILED:",
      orderError,
    );

    throwInternalError(
      event,
      "STRIPE ORDER CREATION ERROR",
      orderError || new Error("Order insert returned no row"),
      "Unable to complete the paid order.",
    );
  }

  console.log("✅ ORDER CREATED:", order.id);

  // ========================================
  // SAVE ITEMS + UPDATE STOCK
  // ========================================

  const paidQuoteId = Number(session.metadata?.quote_id || 0);

  if (Number.isInteger(paidQuoteId) && paidQuoteId > 0) {
    const { data: paidQuote, error: paidQuoteError } = await supabase
      .from("customer_quote_requests")
      .select("id,user_id,status,customer_quote_request_items(id,product_id,variant_id,product_name,variant_name,product_code,quantity,requested_price,quoted_price)")
      .eq("id", paidQuoteId)
      .eq("user_id", userId)
      .maybeSingle();

    if (paidQuoteError) throwInternalError(event, "STRIPE PAID QUOTE LOOKUP ERROR", paidQuoteError, "Unable to complete the paid order.");
    if (!paidQuote) throw createError({ statusCode: 500, statusMessage: "Paid quote could not be found." });

    const quoteItems = Array.isArray(paidQuote.customer_quote_request_items)
      ? paidQuote.customer_quote_request_items
      : [];

    for (const item of quoteItems) {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const price = Number(item.quoted_price ?? item.requested_price ?? 0);
      const productId = Number(item.product_id);
      const variantId = item.variant_id ? Number(item.variant_id) : null;

      const { error: orderItemError } = await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: productId,
        product_name: item.variant_name ? `${item.product_name} - ${item.variant_name}` : item.product_name,
        variant_id: variantId,
        variant_name: item.variant_name || null,
        product_code: item.product_code || null,
        quantity,
        price,
      });
      if (orderItemError) throwInternalError(event, "STRIPE ORDER ITEM INSERT ERROR", orderItemError, "Unable to complete the paid order.");

      const stockTable = variantId ? "product_variants" : "products";
      const stockId = variantId || productId;
      const { data: stockRow, error: stockReadError } = await supabase
        .from(stockTable)
        .select("id,name,stock")
        .eq("id", stockId)
        .single();
      if (stockReadError || !stockRow) throwInternalError(event, "STRIPE STOCK LOOKUP ERROR", stockReadError || new Error(`Stock item ${stockId} was not found`), "Unable to complete the paid order.");
      const newStock = Math.max(0, Number(stockRow.stock || 0) - quantity);
      const { error: stockError } = await supabase.from(stockTable).update({ stock: newStock }).eq("id", stockId);
      if (stockError) throwInternalError(event, "STRIPE STOCK UPDATE ERROR", stockError, "Unable to complete the paid order.");
    }

    await supabase
      .from("customer_quote_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", paidQuoteId)
      .eq("user_id", userId);

    console.log("✅ PAID QUOTE CONVERTED TO ORDER:", paidQuoteId);
  } else {
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
      const variantId = stripeProduct.metadata?.variant_id || null;
      const productCode = stripeProduct.metadata?.product_code || null;

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
          variant_id: variantId ? Number(variantId) : null,
          variant_name: variantId ? productName.split(" - ").slice(1).join(" - ") || null : null,
          product_code: productCode,
          quantity,
          price,
        });

      if (orderItemError) {
        console.error(
          "❌ ORDER ITEM INSERT ERROR:",
          orderItemError,
        );

        throwInternalError(
          event,
          "STRIPE ORDER ITEM INSERT ERROR",
          orderItemError,
          "Unable to complete the paid order.",
        );
      }

      // Update stock on the selected variant, or on the base product when there are no variants.
      const stockTable = variantId ? "product_variants" : "products";
      const stockId = variantId ? Number(variantId) : Number(productId);
      const { data: stockRow, error: productError } = await supabase.from(stockTable).select("id, name, stock").eq("id", stockId).single();
      if (productError || !stockRow) throwInternalError(event, "STRIPE STOCK LOOKUP ERROR", productError || new Error(`Stock item ${stockId} was not found`), "Unable to complete the paid order.");
      const currentStock = Number(stockRow.stock || 0);
      const newStock = Math.max(0, currentStock - quantity);
      const { error: stockError } = await supabase.from(stockTable).update({ stock: newStock }).eq("id", stockId);
      if (stockError) throwInternalError(event, "STRIPE STOCK UPDATE ERROR", stockError, "Unable to complete the paid order.");
      console.log(`✅ STOCK UPDATED: ${stockRow.name}: ${currentStock} -> ${newStock}`);
    }

  }

  // ========================================
  // CUSTOMER ORDER CONFIRMATION EMAIL
  // ========================================

  let confirmationEmailSent = false;

  if (customerEmail) {
    try {
      const { data: savedItems, error: savedItemsError } = await supabase
        .from("order_items")
        .select("product_name, quantity, price")
        .eq("order_id", order.id)
        .order("id", { ascending: true });

      if (savedItemsError) {
        throw savedItemsError;
      }

      const emailResult = await sendOrderEmails({
        id: order.id,
        customer_email: customerEmail,
        customer_name: customerName,
        total,
        shipping_method: session.metadata?.shipping_method || null,
        shipping_service_code: session.metadata?.shipping_service_code || null,
        shipping_postcode: session.metadata?.shipping_postcode || null,
        shipping_cost: Number(session.metadata?.shipping_cost || 0),
        processing_fee: Number(session.metadata?.processing_fee || 0),
        shipping_address: shippingAddress,
        paid_at: new Date(),
        items: (savedItems || []).map((item: any) => ({
          product_name: item.product_name || "Product",
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
        })),
      });

      confirmationEmailSent = emailResult.customerSent;
      console.log("✅ CUSTOMER ORDER EMAIL SENT");
      console.log("✅ SELLER ORDER EMAIL SENT:", emailResult.sellerSent);
    } catch (emailError: any) {
      // The order/payment must remain successful even if email delivery fails.
      // Logging the error avoids Stripe repeatedly re-processing a paid order.
      console.error(
        "❌ ORDER CONFIRMATION EMAIL ERROR:",
        emailError?.message || emailError,
      );
    }
  } else {
    console.warn("⚠️ ORDER HAS NO CUSTOMER EMAIL; CONFIRMATION NOT SENT");
  }

  console.log("=================================");
  console.log("🎉 WEBHOOK COMPLETE");
  console.log("ORDER ID:", order.id);
  console.log("SESSION ID:", session.id);
  console.log("EMAIL SENT:", confirmationEmailSent);
  console.log("=================================");

  return {
    received: true,
    orderId: order.id,
    confirmationEmailSent,
  };
});
