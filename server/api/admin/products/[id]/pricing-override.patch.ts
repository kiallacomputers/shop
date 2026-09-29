import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { getStandardPricingLevel } from "~~/server/utils/customerPricing";

const roundMoney = (value:number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundToNearestDollar = (value:number) => value <= 0 ? 0 : Math.max(1, Math.round(value));

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode:400, statusMessage:"Product ID is required" });

  const body = await readBody(event);
  const override = Number(body?.pricing_level_markup_override_percent ?? 0);
  if (!Number.isFinite(override)) {
    throw createError({ statusCode:400, statusMessage:"Pricing level override must be a valid percentage" });
  }

  const supabase = getAdminSupabase();
  const { data: product, error: productError } = await supabase
    .from("products").select("id,buy_price_ex_gst").eq("id", id).single();
  if (productError || !product) {
    throw createError({ statusCode:404, statusMessage:"Product not found" });
  }

  const standard = await getStandardPricingLevel();
  const effectiveStandardMarkup = Number(standard.markupPercent || 0) + override;
  const sellExGst = roundMoney(Number(product.buy_price_ex_gst || 0) * (1 + effectiveStandardMarkup / 100));
  const sellPrice = roundToNearestDollar(sellExGst * 1.1);

  const { data, error } = await supabase.from("products").update({
    pricing_level_markup_override_percent: override,
    sell_markup_percent: effectiveStandardMarkup,
    price: sellPrice,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("id,pricing_level_markup_override_percent,sell_markup_percent,price").single();

  if (error) throw createError({ statusCode:500, statusMessage:error.message });
  return data;
});
