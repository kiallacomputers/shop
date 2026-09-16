import { requireAdmin } from "~~/server/utils/adminAuth";
import { calculateFreightOptions } from "~~/server/utils/freight";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  return await calculateFreightOptions({
    items: body?.items,
    postcode: body?.postcode,
  });
});
