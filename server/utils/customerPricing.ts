import type { H3Event } from "h3";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { getRequestUser } from "~~/server/utils/requestUser";

export type PricingLevel = {
  key: string;
  name: string;
  markupPercent: number;
};

export const STANDARD_PRICING_LEVEL: PricingLevel = {
  key: "standard",
  name: "Standard",
  markupPercent: 20,
};

export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const roundToNearestFive = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(1, Math.round(value));
};

export const calculateBaseCustomerPrice = (
  buyPriceExGst: unknown,
  markupPercent: number,
  fallbackPrice: unknown,
  standardMarkupPercent = STANDARD_PRICING_LEVEL.markupPercent,
) => {
  const buy = Number(buyPriceExGst);

  // Customer pricing is calculated directly from the supplier Buy Price ex GST:
  //
  //   Buy Price ex GST
  //   + customer markup
  //   + 10% GST
  //   rounded to the nearest dollar
  //
  // Example:
  //   Buy Price ex GST: $302
  //   Family markup: 10%
  //   $302 x 1.10 x 1.10 = $365.42
  //   rounded to nearest dollar = $365
  if (Number.isFinite(buy) && buy > 0) {
    const exGstWithMarkup = buy * (1 + markupPercent / 100);
    return roundToNearestFive(exGstWithMarkup * 1.1);
  }

  // Older products that do not yet have a Buy Price ex GST fall back to the
  // stored public Sell Price. The saved Sell Price is treated as the Standard
  // pricing level so customer pricing still works until the Buy Price is added.
  const publicStandardPrice = Number(fallbackPrice);
  if (!Number.isFinite(publicStandardPrice) || publicStandardPrice <= 0) {
    return 0;
  }

  if (markupPercent === standardMarkupPercent) {
    return roundMoney(publicStandardPrice);
  }

  const standardMultiplier = 1 + standardMarkupPercent / 100;
  const customerMultiplier = 1 + markupPercent / 100;

  return roundToNearestFive(
    (publicStandardPrice / standardMultiplier) * customerMultiplier,
  );
};

export const calculateVariantCustomerPrice = ({
  baseCustomerPrice,
  storedBasePrice,
  variantPrice,
}: {
  baseCustomerPrice: number;
  storedBasePrice: unknown;
  variantPrice: unknown;
}) => {
  const override =
    variantPrice == null || variantPrice === "" ? NaN : Number(variantPrice);
  if (!Number.isFinite(override) || override <= 0) return baseCustomerPrice;

  const baseStored = Number(storedBasePrice);
  if (!Number.isFinite(baseStored) || baseStored <= 0) {
    return roundToNearestFive(override);
  }

  // A variant's saved price is also a Standard-level public price. Apply the
  // same customer-price ratio used for the base product rather than preserving
  // the full Standard-price variant difference.
  const pricingRatio = baseCustomerPrice / baseStored;
  return roundToNearestFive(override * pricingRatio);
};

export async function getStandardPricingLevel(): Promise<PricingLevel> {
  const supabase = getAdminSupabase();
  const { data: level, error } = await supabase
    .from("customer_pricing_levels")
    .select("key,name,markup_percent,active")
    .eq("key", "standard")
    .eq("active", true)
    .maybeSingle();

  if (error) {
    if (error.code !== "42P01") {
      console.error("STANDARD CUSTOMER PRICING LEVEL ERROR:", error);
    }
    return STANDARD_PRICING_LEVEL;
  }

  if (!level) return STANDARD_PRICING_LEVEL;

  const markupPercent = Number(level.markup_percent);
  return {
    key: String(level.key),
    name: String(level.name),
    markupPercent: Number.isFinite(markupPercent)
      ? markupPercent
      : STANDARD_PRICING_LEVEL.markupPercent,
  };
}

export async function getPricingLevelForUser(userId?: string | null): Promise<PricingLevel> {
  const supabase = getAdminSupabase();
  let key = "standard";

  if (userId) {
    const { data: assignment, error: assignmentError } = await supabase
      .from("customer_pricing_assignments")
      .select("pricing_level_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (assignmentError && assignmentError.code !== "42P01") {
      console.error("CUSTOMER PRICING ASSIGNMENT ERROR:", assignmentError);
    }

    key = String(assignment?.pricing_level_key || "standard");
  }

  const { data: level, error } = await supabase
    .from("customer_pricing_levels")
    .select("key,name,markup_percent,active")
    .eq("key", key)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    // Allows the site to remain usable before the migration is applied.
    if (error.code !== "42P01") console.error("CUSTOMER PRICING LEVEL ERROR:", error);
    return STANDARD_PRICING_LEVEL;
  }

  if (!level) return STANDARD_PRICING_LEVEL;

  const markupPercent = Number(level.markup_percent);
  return {
    key: String(level.key),
    name: String(level.name),
    markupPercent: Number.isFinite(markupPercent) ? markupPercent : 20,
  };
}

export async function getPricingLevelForEvent(event: H3Event): Promise<PricingLevel> {
  const user: any = await getRequestUser(event);
  const userId = user?.id || user?.sub || null;
  return getPricingLevelForUser(userId ? String(userId) : null);
}
