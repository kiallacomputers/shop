import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import {
  calculateBaseCustomerPrice,
  calculateVariantCustomerPrice,
  getPricingLevelForUser,
  getStandardPricingLevel,
} from "~~/server/utils/customerPricing";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const customerId = String(body?.customerId || "").trim();
  const productId = Number(body?.productId);
  const variantId = body?.variantId ? Number(body.variantId) : null;
  if (!customerId || !Number.isInteger(productId) || productId <= 0)
    throw createError({ statusCode: 400, statusMessage: "Customer and product are required." });

  const supabase = getAdminSupabase();
  const { data: customer, error: customerError } = await supabase
    .from("sales_customers").select("id,user_id").eq("id", customerId).single();
  if (customerError || !customer)
    throw createError({ statusCode: 404, statusMessage: "Customer not found." });

  const [level, standardLevel, productResult] = await Promise.all([
    getPricingLevelForUser(customer.user_id ? String(customer.user_id) : null),
    getStandardPricingLevel(),
    supabase.from("products").select("id,buy_price_ex_gst,price,active").eq("id", productId).single(),
  ]);
  const product:any = productResult.data;
  if (productResult.error || !product || product.active === false)
    throw createError({ statusCode: 400, statusMessage: "Product is not available." });

  const basePrice = calculateBaseCustomerPrice(
    product.buy_price_ex_gst, level.markupPercent, product.price, standardLevel.markupPercent
  );
  const standardBasePrice = calculateBaseCustomerPrice(
    product.buy_price_ex_gst, standardLevel.markupPercent, product.price, standardLevel.markupPercent
  );
  let price = basePrice;
  let standardPrice = standardBasePrice;

  if (variantId) {
    const { data: variant, error } = await supabase
      .from("product_variants").select("id,product_id,price,active").eq("id", variantId).single();
    if (error || !variant || Number(variant.product_id) !== productId || variant.active === false)
      throw createError({ statusCode: 400, statusMessage: "Variant is not available." });
    price = calculateVariantCustomerPrice({
      baseCustomerPrice: basePrice,
      storedBasePrice: product.price,
      variantPrice: variant.price,
    });
    standardPrice = calculateVariantCustomerPrice({
      baseCustomerPrice: standardBasePrice,
      storedBasePrice: product.price,
      variantPrice: variant.price,
    });
  }

  return { price, basePrice, standardPrice, pricingLevel: { key: level.key, name: level.name, markupPercent: level.markupPercent } };
});
