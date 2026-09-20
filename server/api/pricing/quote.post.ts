import { getAdminSupabase } from "~~/server/utils/adminAuth";
import {
  calculateBaseCustomerPrice,
  calculateVariantCustomerPrice,
  getPricingLevelForEvent,
  getStandardPricingLevel,
} from "~~/server/utils/customerPricing";

type QuoteItem = { productId?: number | string; variantId?: number | string | null };

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const requested: QuoteItem[] = Array.isArray(body?.items) ? body.items.slice(0, 250) : [];

  const productIds = [...new Set(
    requested.map((item) => Number(item?.productId)).filter((id) => Number.isInteger(id) && id > 0),
  )];
  const variantIds = [...new Set(
    requested.map((item) => Number(item?.variantId)).filter((id) => Number.isInteger(id) && id > 0),
  )];

  const [level, standardLevel] = await Promise.all([
    getPricingLevelForEvent(event),
    getStandardPricingLevel(),
  ]);
  if (!productIds.length) {
    return { pricingLevel: { key: level.key, name: level.name }, products: {}, variants: {} };
  }

  const supabase = getAdminSupabase();
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,buy_price_ex_gst,price,active")
    .in("id", productIds);

  if (productError) throw createError({ statusCode: 500, statusMessage: productError.message });

  const productMap = new Map((products || []).map((product: any) => [Number(product.id), product]));
  const productPrices: Record<string, number> = {};

  for (const product of products || []) {
    if (product.active === false) continue;
    productPrices[String(product.id)] = calculateBaseCustomerPrice(
      product.buy_price_ex_gst,
      level.markupPercent,
      product.price,
      standardLevel.markupPercent,
    );
  }

  const variantPrices: Record<string, number> = {};
  if (variantIds.length) {
    const { data: variants, error: variantError } = await supabase
      .from("product_variants")
      .select("id,product_id,price,active")
      .in("id", variantIds);

    if (variantError) throw createError({ statusCode: 500, statusMessage: variantError.message });

    for (const variant of variants || []) {
      if (variant.active === false) continue;
      const product: any = productMap.get(Number(variant.product_id));
      if (!product) continue;
      const baseCustomerPrice = productPrices[String(product.id)];
      if (!Number.isFinite(baseCustomerPrice)) continue;

      variantPrices[String(variant.id)] = calculateVariantCustomerPrice({
        baseCustomerPrice,
        storedBasePrice: product.price,
        variantPrice: variant.price,
      });
    }
  }

  return {
    pricingLevel: { key: level.key, name: level.name },
    products: productPrices,
    variants: variantPrices,
  };
});
