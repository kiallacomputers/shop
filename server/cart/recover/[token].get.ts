import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { enforceRateLimit } from "~~/server/utils/rateLimit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  // Recovery links are intentionally public bearer-token links. Limit repeated
  // lookups from the same client before touching the abandoned-cart table.
  await enforceRateLimit(event, {
    bucket: "cart-recovery",
    max: 30,
    windowSeconds: 15 * 60,
  });

  const token = String(getRouterParam(event, "token") || "").trim();

  if (!UUID_RE.test(token)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Recovery link not found",
    });
  }

  const db = getAdminSupabase();
  const { data, error } = await db
    .from("abandoned_carts")
    .select("id,items,status")
    .eq("recovery_token", token)
    .maybeSingle();

  if (error || !data || ["converted", "expired"].includes(data.status)) {
    throw createError({
      statusCode: 404,
      statusMessage: "This recovery link is no longer available",
    });
  }

  await db
    .from("abandoned_carts")
    .update({
      status: "recovered",
      recovered_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return { items: data.items || [] };
});
