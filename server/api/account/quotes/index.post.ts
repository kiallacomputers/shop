import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
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

    items.push({
      product_id: Number(product.id),
      variant_id: variant ? Number(variant.id) : null,
      product_name: product.name,
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

  const { error: itemError } = await supabase
    .from("customer_quote_request_items")
    .insert(items.map((item) => ({ ...item, quote_request_id: quote.id })));

  if (itemError) {
    await supabase.from("customer_quote_requests").delete().eq("id", quote.id);
    throw createError({ statusCode: 500, statusMessage: itemError.message });
  }

  return quote;
});
