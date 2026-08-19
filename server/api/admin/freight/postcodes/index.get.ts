
import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("free_delivery_postcodes")
    .select("id, postcode, description, flat_rate, active, created_at")
    .order("postcode", {
      ascending: true,
    });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        error.message ||
        "Unable to load free-delivery postcodes.",
    });
  }

  return data ?? [];
});
