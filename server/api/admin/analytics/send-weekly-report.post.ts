import { requireAdmin } from "~~/server/utils/adminAuth";
import { sendWeeklyAnalyticsReport } from "~~/server/utils/weeklyAnalyticsReport";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    return await sendWeeklyAnalyticsReport();
  } catch (error: any) {
    console.error("WEEKLY ANALYTICS REPORT ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Unable to send the weekly traffic report.",
    });
  }
});
