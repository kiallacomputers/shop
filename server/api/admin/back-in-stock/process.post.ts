import { requireAdmin } from "~~/server/utils/adminAuth";
import { processBackInStockNotifications } from "~~/server/utils/backInStockNotifications";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const productId = Number(body?.product_id);
  const variantId = body?.variant_id == null ? null : Number(body.variant_id);
  if (!Number.isInteger(productId) || productId <= 0 || (variantId != null && (!Number.isInteger(variantId) || variantId <= 0))) {
    throw createError({ statusCode: 400, statusMessage: "Invalid product selection." });
  }
  const origin = getRequestURL(event).origin;
  return await processBackInStockNotifications({ productId, variantId, origin });
});
