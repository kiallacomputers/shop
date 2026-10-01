import { requireRequestUser } from "~~/server/utils/requestUser";
import { getProcessingFeeForUser } from "~~/server/utils/processingFee";

export default defineEventHandler(async (event) => {
  const user: any = await requireRequestUser(event);
  const fee = await getProcessingFeeForUser(String(user.id || ""));
  setHeader(event, "Cache-Control", "no-store");
  return { processingFeeEnabled: fee.enabled, processingFee: fee.amount };
});
