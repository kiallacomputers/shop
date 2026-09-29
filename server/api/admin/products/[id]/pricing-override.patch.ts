import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { getStandardPricingLevel } from "~~/server/utils/customerPricing";

const roundMoney = (value:number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const roundToNearestDollar = (value:number) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(1, Math.round(value));
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" });
  }

  const body = await readBody(event);
  const override = Number(body?.pricing_level_markup_override_percent);

  if (!Number.isFinite(override)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Pricing level override must be a valid percentage",
    });
  }

  const supabase = getAdminSupabase();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,buy_price_ex_gst")
    .eq("id", id)
    .maybeSingle();

  if (productError) {
    console.error("PRICING OVERRIDE PRODUCT LOOKUP ERROR:", productError);
    throw createError({
      statusCode: 500,
      statusMessage: productError.message || "Unable to load product pricing",
    });
  }

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" });
  }

  const standard = await getStandardPricingLevel();
  const globalStandardMarkup = Number(standard?.markupPercent || 0);
  const effectiveStandardMarkup = globalStandardMarkup + override;
  const buyExGst = Number(product.buy_price_ex_gst || 0);

  const sellExGst = roundMoney(
    buyExGst * (1 + effectiveStandardMarkup / 100),
  );
  const sellPrice = roundToNearestDollar(sellExGst * 1.1);

  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update({
      pricing_level_markup_override_percent: override,
      sell_markup_percent: effectiveStandardMarkup,
      price: sellPrice,
    })
    .eq("id", id)
    .select("id,pricing_level_markup_override_percent,sell_markup_percent,price")
    .maybeSingle();

  if (updateError) {
    console.error("PRICING OVERRIDE UPDATE ERROR:", updateError);
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message || "Unable to save pricing override",
    });
  }

  if (!updated) {
    throw createError({
      statusCode: 500,
      statusMessage: "The product pricing override was not updated",
    });
  }

  return updated;
});
