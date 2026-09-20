import { requireAdmin } from "~~/server/utils/adminAuth";
import { getStandardPricingLevel } from "~~/server/utils/customerPricing";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const level = await getStandardPricingLevel();

  return {
    key: level.key,
    name: level.name,
    markup_percent: level.markupPercent,
  };
});
