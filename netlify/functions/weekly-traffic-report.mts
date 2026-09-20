import { sendWeeklyAnalyticsReport } from "../../server/utils/weeklyAnalyticsReport";

export default async () => {
  try {
    const result = await sendWeeklyAnalyticsReport();
    console.log("Weekly traffic report sent:", result);
    return new Response("Weekly traffic report sent.", { status: 200 });
  } catch (error: any) {
    console.error("Weekly traffic report failed:", error);
    return new Response(error?.message || "Weekly traffic report failed.", {
      status: 500,
    });
  }
};

// Sunday 22:00 UTC = Monday 08:00 AEST / 09:00 AEDT in Victoria.
export const config = {
  schedule: "0 22 * * 0",
};
