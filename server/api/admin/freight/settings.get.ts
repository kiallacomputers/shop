
import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("freight_settings")
    .select("id, origin_postcode, enabled, pickup_enabled, pickup_name, pickup_address_line_1, pickup_address_line_2, pickup_suburb, pickup_state, pickup_postcode, pickup_instructions, updated_at")
    .eq("id", 1)
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        error.message ||
        "Unable to load freight settings.",
    });
  }

  return data;
});
