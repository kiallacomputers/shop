import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { postManualQuoteToAccounting } from "~~/server/utils/manualQuoteAccounting";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid quote." });
  try {
    return await postManualQuoteToAccounting(id);
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error?.message || "Unable to post quote to accounting." });
  }
});
