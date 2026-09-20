import Stripe from "stripe";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
import { getSiteOrigin } from "~~/server/utils/siteUrl";

const text = (value: unknown) => String(value ?? "").trim();
const PROCESSING_FEE = 2;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.stripeSecretKey) {
    throw createError({ statusCode: 500, statusMessage: "Stripe is not configured." });
  }

  const user: any = await requireRequestUser(event);
  const quoteId = Number(getRouterParam(event, "quoteId"));
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid quote." });
  }

  const supabase = getAdminSupabase();
  const { data: quote, error: quoteError } = await supabase
    .from("customer_quote_requests")
    .select("id,quote_number,user_id,status,quoted_total,expires_at,customer_quote_request_items(id,product_id,variant_id,product_name,variant_name,product_code,quantity,requested_price,quoted_price)")
    .eq("id", quoteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (quoteError) throw createError({ statusCode: 500, statusMessage: quoteError.message });
  if (!quote) throw createError({ statusCode: 404, statusMessage: "Quote not found." });
  if (quote.status !== "quoted") {
    throw createError({ statusCode: 400, statusMessage: "This quote is not ready for payment." });
  }
  if (quote.expires_at && new Date(quote.expires_at).getTime() < Date.now()) {
    throw createError({ statusCode: 400, statusMessage: "This quote has expired. Please request an updated quote." });
  }

  const total = Number(quote.quoted_total || 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw createError({ statusCode: 400, statusMessage: "This quote does not have a valid total yet." });
  }

  const items = Array.isArray(quote.customer_quote_request_items) ? quote.customer_quote_request_items : [];
  if (!items.length) {
    throw createError({ statusCode: 400, statusMessage: "This quote does not contain any products." });
  }

  // Use the customer's primary saved address so paid quote orders flow through
  // the same order/invoice/shipping pipeline as normal purchases.
  let { data: address, error: addressError } = await supabase
    .from("customer_addresses")
    .select("id,user_id,label,full_name,address_line_1,address_line_2,suburb,state,postcode,country,phone,is_primary")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (addressError) throw createError({ statusCode: 500, statusMessage: addressError.message });

  // If an older account has addresses but none marked primary, use the first one.
  if (!address) {
    const fallback = await supabase
      .from("customer_addresses")
      .select("id,user_id,label,full_name,address_line_1,address_line_2,suburb,state,postcode,country,phone,is_primary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fallback.error) throw createError({ statusCode: 500, statusMessage: fallback.error.message });
    address = fallback.data;
  }

  if (!address) {
    throw createError({ statusCode: 400, statusMessage: "Please add a delivery address in My Account before paying this quote." });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  const siteOrigin = getSiteOrigin(event);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "aud",
        product_data: {
          name: `Kialla Computers ${quote.quote_number || `Quote #${quote.id}`}`,
          description: `${items.length} quoted item${items.length === 1 ? "" : "s"}`,
        },
        unit_amount: Math.round(total * 100),
      },
      quantity: 1,
    }, {
      price_data: {
        currency: "aud",
        product_data: { name: "Processing Fee" },
        unit_amount: Math.round(PROCESSING_FEE * 100),
      },
      quantity: 1,
    }],
    client_reference_id: String(user.id),
    customer_email: user.email || undefined,
    metadata: {
      user_id: String(user.id),
      quote_id: String(quote.id),
      quote_number: String(quote.quote_number || ""),
      quote_payment: "true",
      shipping_address_id: String(address.id),
      shipping_label: text(address.label),
      shipping_name: text(address.full_name),
      shipping_address_line_1: text(address.address_line_1),
      shipping_address_line_2: text(address.address_line_2),
      shipping_suburb: text(address.suburb),
      shipping_state: text(address.state),
      shipping_postcode: text(address.postcode),
      shipping_country: text(address.country) || "AU",
      shipping_phone: text(address.phone),
      shipping_method: "Quoted order",
      shipping_service_code: "quote",
      shipping_cost: "0.00",
      processing_fee: PROCESSING_FEE.toFixed(2),
    },
    success_url: `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteOrigin}/account?quote=${quote.id}`,
    billing_address_collection: "auto",
  });

  return { url: session.url, sessionId: session.id };
});
