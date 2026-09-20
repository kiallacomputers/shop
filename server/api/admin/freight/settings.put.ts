
import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const postcode =
    String(body?.origin_postcode || "").trim();

  if (!/^\d{4}$/.test(postcode)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Origin postcode must be a 4-digit Australian postcode.",
    });
  }

  const pickupEnabled = body?.pickup_enabled === true;
  const pickupPostcode = String(body?.pickup_postcode || "").trim();
  const pickupState = String(body?.pickup_state || "").trim().toUpperCase();
  const pickupAddressLine1 = String(body?.pickup_address_line_1 || "").trim();
  const pickupSuburb = String(body?.pickup_suburb || "").trim();

  if (pickupEnabled) {
    if (!pickupAddressLine1 || !pickupSuburb || !pickupState || !/^\d{4}$/.test(pickupPostcode)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Pickup address, suburb, state and a valid 4-digit postcode are required when store pickup is enabled.",
      });
    }
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("freight_settings")
    .upsert(
      {
        id: 1,
        origin_postcode: postcode,
        enabled: body?.enabled !== false,
        pickup_enabled: pickupEnabled,
        pickup_name: String(body?.pickup_name || "Pickup in Store").trim() || "Pickup in Store",
        pickup_address_line_1: pickupAddressLine1 || null,
        pickup_address_line_2: String(body?.pickup_address_line_2 || "").trim() || null,
        pickup_suburb: pickupSuburb || null,
        pickup_state: pickupState || null,
        pickup_postcode: pickupPostcode || null,
        pickup_instructions: String(body?.pickup_instructions || "").trim() || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        error.message ||
        "Unable to save freight settings.",
    });
  }

  return data;
});
