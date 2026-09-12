import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
import { sendQuoteRequestEmails } from "~~/server/utils/quoteEmail";
import {
  calculateBaseCustomerPrice,
  calculateVariantCustomerPrice,
  getPricingLevelForUser,
  getStandardPricingLevel,
} from "~~/server/utils/customerPricing";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const body = await readBody(event);
  const requested = Array.isArray(body?.items) ? body.items.slice(0, 100) : [];

  if (!requested.length) {
    throw createError({ statusCode: 400, statusMessage: "Your cart is empty." });
  }

  const productIds = [...new Set(requested.map((row: any) => Number(row.id)).filter(Number.isInteger))];
  const variantIds = [...new Set(requested.map((row: any) => Number(row.variantId)).filter(Number.isInteger))];
  const addonOptionIds = [...new Set(requested.flatMap((row:any) => Array.isArray(row.addonOptionIds) ? row.addonOptionIds : []).map(Number).filter(Number.isInteger))];
  const supabase = getAdminSupabase();

  const [{ data: products, error: productError }, pricingLevel, standardLevel] = await Promise.all([
    supabase.from("products").select("id,name,product_code,buy_price_ex_gst,price,active").in("id", productIds),
    getPricingLevelForUser(user.id),
    getStandardPricingLevel(),
  ]);
  if (productError) throw createError({ statusCode: 500, statusMessage: productError.message });

  let variants: any[] = [];
  if (variantIds.length) {
    const { data, error } = await supabase
      .from("product_variants")
      .select("id,product_id,name,product_code,price,active")
      .in("id", variantIds);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    variants = data || [];
  }

  let addonOptions:any[] = [];
  if (addonOptionIds.length) {
    const { data, error } = await supabase
      .from("product_addon_options")
      .select("id,name,price,active,group_id,product_addon_groups!inner(id,product_id,name,active)")
      .in("id", addonOptionIds);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    addonOptions = data || [];
  }
  const addonMap = new Map(addonOptions.map((option:any) => [Number(option.id), option]));

  const productMap = new Map((products || []).map((p: any) => [Number(p.id), p]));
  const variantMap = new Map(variants.map((v: any) => [Number(v.id), v]));

  const items: any[] = [];
  for (const row of requested) {
    const product = productMap.get(Number(row.id));
    const quantity = Math.max(1, Math.min(99, Number(row.quantity || 1)));
    if (!product || product.active === false) continue;

    const basePrice = calculateBaseCustomerPrice(
      product.buy_price_ex_gst,
      pricingLevel.markupPercent,
      product.price,
      standardLevel.markupPercent,
    );

    let requestedPrice = basePrice;
    let variant: any = null;
    if (row.variantId) {
      variant = variantMap.get(Number(row.variantId));
      if (!variant || Number(variant.product_id) !== Number(product.id) || variant.active === false) continue;
      requestedPrice = calculateVariantCustomerPrice({
        baseCustomerPrice: basePrice,
        storedBasePrice: product.price,
        variantPrice: variant.price,
      });
    }

    const selectedAddons = (Array.isArray(row.addonOptionIds) ? row.addonOptionIds : [])
      .map((id:any) => addonMap.get(Number(id)))
      .filter((option:any) => option && option.active !== false && option.product_addon_groups?.active !== false && Number(option.product_addon_groups?.product_id) === Number(product.id));
    const addonTotal = selectedAddons.reduce((sum:number, option:any) => sum + Number(option.price || 0), 0);
    requestedPrice += addonTotal;
    const addonSuffix = selectedAddons.length
      ? ` + ${selectedAddons.map((option:any) => `${option.product_addon_groups?.name}: ${option.name}`).join(", ")}`
      : "";

    items.push({
      product_id: Number(product.id),
      variant_id: variant ? Number(variant.id) : null,
      product_name: `${product.name}${addonSuffix}` ,
      variant_name: variant?.name || null,
      product_code: variant?.product_code || product.product_code || null,
      quantity,
      requested_price: requestedPrice,
    });
  }

  if (!items.length) {
    throw createError({ statusCode: 400, statusMessage: "No valid products were found in the cart." });
  }

  const { data: quote, error: quoteError } = await supabase
    .from("customer_quote_requests")
    .insert({
      user_id: user.id,
      status: "requested",
      customer_message: String(body?.message || "").trim().slice(0, 2000) || null,
      updated_at: new Date().toISOString(),
    })
    .select("id,status,created_at")
    .single();

  if (quoteError) throw createError({ statusCode: 500, statusMessage: quoteError.message });

  const quoteNumber = `KCQ-${new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replaceAll("-", "")}-${String(quote.id).padStart(6, "0")}`;
  const { error: quoteNumberError } = await supabase
    .from("customer_quote_requests")
    .update({ quote_number: quoteNumber })
    .eq("id", quote.id);
  if (quoteNumberError) throw createError({ statusCode: 500, statusMessage: quoteNumberError.message });
  quote.quote_number = quoteNumber;

  const { error: itemError } = await supabase
    .from("customer_quote_request_items")
    .insert(items.map((item) => ({ ...item, quote_request_id: quote.id })));

  if (itemError) {
    await supabase.from("customer_quote_requests").delete().eq("id", quote.id);
    throw createError({ statusCode: 500, statusMessage: itemError.message });
  }

  // Email both the customer and Kialla Computers. Email delivery is deliberately
  // non-fatal so a valid quote request is never lost because Graph is unavailable.
  try {
    await sendQuoteRequestEmails({
      id: quote.id,
      quote_number: quote.quote_number,
      created_at: quote.created_at,
      customer_email: String(user.email || ""),
      customer_name: String(user.user_metadata?.display_name || user.user_metadata?.full_name || ""),
      customer_message: String(body?.message || "").trim() || null,
      items,
    });
  } catch (emailError: any) {
    console.error("QUOTE REQUEST EMAIL ERROR:", emailError?.message || emailError);
  }

  return quote;
});
