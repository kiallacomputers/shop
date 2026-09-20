import { requireRequestUser } from "~~/server/utils/requestUser";
import { getPricingLevelForUser } from "~~/server/utils/customerPricing";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const level = await getPricingLevelForUser(user.id);

  // Intentionally return only the customer-facing level name/key.
  // The markup percentage remains server-side.
  return {
    pricingLevel: {
      key: level.key,
      name: level.name,
    },
  };
});
