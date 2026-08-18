
import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("freight_settings")
    .select("id, origin_postcode, enabled, updated_at")
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
