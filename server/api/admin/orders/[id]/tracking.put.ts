import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Order ID is required." });
  }

  const body = await readBody(event);
  const trackingNumber = String(body?.tracking_number || "").trim();

  if (trackingNumber.length > 80) {
    throw createError({ statusCode: 400, statusMessage: "Tracking number is too long." });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({
      tracking_number: trackingNumber || null,
      carrier: trackingNumber ? "Australia Post" : null,
      tracking_status: trackingNumber ? "Tracking number saved" : null,
      tracking_last_checked_at: null,
      tracking_events: trackingNumber ? [] : null,
    })
    .eq("id", id)
    .select("id, tracking_number, carrier, tracking_status, tracking_last_checked_at, tracking_events")
    .single();

  if (error) {
    console.error("SAVE ORDER TRACKING ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to save tracking number.",
    });
  }

  return data;
});
