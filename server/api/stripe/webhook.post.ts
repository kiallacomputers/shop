import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {

  console.log("=================================");
  console.log("🔥 STRIPE WEBHOOK HIT");
  console.log("=================================");

  const config = useRuntimeConfig();

  // ----------------------------------------
  // STRIPE
  // ----------------------------------------

  const stripe = new Stripe(
    config.stripeSecretKey
  );

  // ----------------------------------------
  // READ RAW BODY
  // ----------------------------------------

  const body = await readRawBody(event);

  const signature = getHeader(
    event,
    "stripe-signature"
  );

  if (!body || !signature) {

    console.error(
      "MISSING STRIPE WEBHOOK DATA"
    );

    throw createError({
      statusCode: 400,
      statusMessage:
        "Missing Stripe webhook data",
    });

  }

  // ----------------------------------------
  // VERIFY STRIPE WEBHOOK
  // ----------------------------------------

  let stripeEvent: Stripe.Event;

  try {

    stripeEvent =
      stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripeWebhookSecret
      );

  } catch (error: any) {

    console.error(
      "WEBHOOK SIGNATURE ERROR:",
      error.message
    );

    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });

  }

  console.log(
    "EVENT TYPE:",
    stripeEvent.type
  );


  // ----------------------------------------
  // ONLY PROCESS COMPLETED CHECKOUTS
  // ----------------------------------------

  if (
    stripeEvent.type !==
    "checkout.session.completed"
  ) {

    console.log(
      "Ignoring event:",
      stripeEvent.type
    );

    return {
      received: true,
    };

  }


  // ----------------------------------------
  // GET CHECKOUT SESSION
  // ----------------------------------------

  const session =
    stripeEvent.data.object
      as Stripe.Checkout.Session;

  console.log(
    "SESSION ID:",
    session.id
  );

  console.log(
    "PAYMENT STATUS:",
    session.payment_status
  );


  // ----------------------------------------
  // MAKE SURE PAYMENT IS PAID
  // ----------------------------------------

  if (
    session.payment_status !==
    "paid"
  ) {

    console.log(
      "PAYMENT NOT PAID"
    );

    return {
      received: true,
    };

  }

  console.log(
    "✅ PAYMENT IS PAID"
  );


  // ----------------------------------------
  // SUPABASE
  // ----------------------------------------

  const supabase =
    createClient(
      config.public.supabaseUrl,
      config.supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );


  // ----------------------------------------
  // CHECK FOR EXISTING ORDER
  // ----------------------------------------

  console.log(
    "CHECKING FOR EXISTING ORDER..."
  );

  const {
    data: existingOrder,
    error: existingOrderError,
  } = await supabase
    .from("orders")
    .select("id")
    .eq(
      "stripe_session_id",
      session.id
    )
    .maybeSingle();


  if (existingOrderError) {

    console.error(
      "EXISTING ORDER CHECK ERROR:",
      existingOrderError
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        existingOrderError.message,
    });

  }


  // ----------------------------------------
  // STOP DUPLICATE WEBHOOK
  // ----------------------------------------

  if (existingOrder) {

    console.log(
      "================================="
    );

    console.log(
      "⚠️ ORDER ALREADY EXISTS"
    );

    console.log(
      "ORDER ID:",
      existingOrder.id
    );

    console.log(
      "STRIPE SESSION:",
      session.id
    );

    console.log(
      "Ignoring duplicate webhook."
    );

    console.log(
      "================================="
    );

    return {
      received: true,
      duplicate: true,
    };

  }


  // ----------------------------------------
  // CUSTOMER INFORMATION
  // ----------------------------------------

  const customerEmail =
    session.customer_details?.email ||
    session.customer_email ||
    null;

  const customerName =
    session.customer_details?.name ||
    null;


  // ----------------------------------------
  // ORDER TOTAL
  // ----------------------------------------

  const total =
    (session.amount_total || 0) / 100;


  console.log(
    "CUSTOMER:",
    customerName
  );

  console.log(
    "EMAIL:",
    customerEmail
  );

  console.log(
    "ORDER TOTAL:",
    total
  );


  // ----------------------------------------
  // GET STRIPE LINE ITEMS
  // ----------------------------------------

  console.log(
    "GETTING STRIPE LINE ITEMS..."
  );

  const lineItems =
    await stripe.checkout.sessions
      .listLineItems(
        session.id,
        {
          expand: [
            "data.price.product",
          ],
        }
      );


  console.log(
    "LINE ITEMS:",
    JSON.stringify(
      lineItems.data,
      null,
      2
    )
  );


  // ----------------------------------------
  // CREATE ORDER
  // ----------------------------------------

  console.log(
    "CREATING ORDER..."
  );

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .insert({

      stripe_session_id:
        session.id,

      customer_email:
        customerEmail,

      customer_name:
        customerName,

      total:
        total,

      status:
        "paid",

    })
    .select()
    .single();


  if (orderError) {

    console.error(
      "================================="
    );

    console.error(
      "❌ ORDER CREATION FAILED"
    );

    console.error(
      orderError
    );

    console.error(
      "================================="
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        orderError.message,
    });

  }


  console.log(
    "================================="
  );

  console.log(
    "✅ ORDER CREATED"
  );

  console.log(
    "ORDER ID:",
    order.id
  );

  console.log(
    "================================="
  );


  // ----------------------------------------
  // PROCESS EACH PRODUCT
  // ----------------------------------------

  for (
    const lineItem
    of lineItems.data
  ) {

    console.log(
      "---------------------------------"
    );

    console.log(
      "PROCESSING ITEM"
    );


    // --------------------------------------
    // STRIPE PRODUCT
    // --------------------------------------

    const product =
      lineItem.price?.product;


    console.log(
      "STRIPE PRODUCT:",
      product
    );


    if (
      !product ||
      typeof product === "string"
    ) {

      console.log(
        "PRODUCT NOT FOUND"
      );

      continue;

    }


    // --------------------------------------
    // PRODUCT DATABASE ID
    // --------------------------------------

    const productId =
      product.metadata?.product_id;


    console.log(
      "DATABASE PRODUCT ID:",
      productId
    );


    if (!productId) {

      console.log(
        "NO PRODUCT ID IN METADATA"
      );

      continue;

    }


    // --------------------------------------
    // QUANTITY
    // --------------------------------------

    const quantity =
      Number(
        lineItem.quantity
      ) || 1;


    console.log(
      "QUANTITY SOLD:",
      quantity
    );


    // --------------------------------------
    // PRODUCT NAME
    // --------------------------------------

    const productName =
      product.name;


    // --------------------------------------
    // PRODUCT PRICE
    // --------------------------------------

    const price =
      (
        lineItem.price
          ?.unit_amount || 0
      ) / 100;


    console.log(
      "PRODUCT NAME:",
      productName
    );

    console.log(
      "PRODUCT PRICE:",
      price
    );


    // --------------------------------------
    // SAVE ORDER ITEM
    // --------------------------------------

    console.log(
      "SAVING ORDER ITEM..."
    );


    const {
      data: orderItem,
      error: orderItemError,
    } = await supabase
      .from("order_items")
      .insert({

        order_id:
          order.id,

        product_id:
          Number(productId),

        product_name:
          productName,

        quantity:
          quantity,

        price:
          price,

      })
      .select()
      .single();


    if (orderItemError) {

      console.error(
        "ORDER ITEM ERROR:",
        orderItemError
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          orderItemError.message,
      });

    }


    console.log(
      "ORDER ITEM CREATED:",
      orderItem.id
    );


    // --------------------------------------
    // GET CURRENT STOCK
    // --------------------------------------

    console.log(
      "GETTING CURRENT STOCK..."
    );


    const {
      data: productData,
      error: productError,
    } = await supabase
      .from("products")
      .select(
        "id, name, stock"
      )
      .eq(
        "id",
        productId
      )
      .single();


    console.log(
      "SUPABASE PRODUCT:",
      productData
    );

    console.log(
      "SUPABASE ERROR:",
      productError
    );


    if (
      productError ||
      !productData
    ) {

      console.error(
        "COULD NOT FIND SUPABASE PRODUCT"
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          "Product not found",
      });

    }


    // --------------------------------------
    // CALCULATE NEW STOCK
    // --------------------------------------

    const currentStock =
      Number(
        productData.stock
      );


    const newStock =
      Math.max(
        0,
        currentStock - quantity
      );


    console.log(
      `STOCK: ${currentStock} -> ${newStock}`
    );


    // --------------------------------------
    // UPDATE STOCK
    // --------------------------------------

    console.log(
      "UPDATING STOCK"
    );

    console.log(
      "Product ID:",
      productId
    );

    console.log(
      "Old Stock:",
      currentStock
    );

    console.log(
      "New Stock:",
      newStock
    );


    const {
      data: updateData,
      error: updateError,
    } = await supabase
      .from("products")
      .update({

        stock:
          newStock,

      })
      .eq(
        "id",
        productId
      )
      .select(
        "id, name, stock"
      );


    console.log(
      "UPDATE RESULT:",
      updateData
    );

    console.log(
      "UPDATE ERROR:",
      updateError
    );


    if (updateError) {

      console.error(
        "❌ STOCK UPDATE FAILED:",
        updateError
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          updateError.message,
      });

    }


    // --------------------------------------
    // MAKE SURE UPDATE MATCHED A ROW
    // --------------------------------------

    if (
      !updateData ||
      updateData.length === 0
    ) {

      console.error(
        "❌ STOCK UPDATE DID NOT MATCH ANY PRODUCT"
      );

      console.error(
        "Product ID:",
        productId
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          "Product stock update matched no rows",
      });

    }


    console.log(
      "✅ DATABASE UPDATED"
    );

    console.log(
      "PRODUCT:",
      updateData[0].name
    );

    console.log(
      "NEW STOCK:",
      updateData[0].stock
    );

  }


  // ----------------------------------------
  // COMPLETE
  // ----------------------------------------

  console.log(
    "================================="
  );

  console.log(
    "🎉 WEBHOOK COMPLETE"
  );

  console.log(
    "ORDER ID:",
    order.id
  );

  console.log(
    "STRIPE SESSION:",
    session.id
  );

  console.log(
    "================================="
  );


  return {
    received: true,
    orderId: order.id,
  };

});