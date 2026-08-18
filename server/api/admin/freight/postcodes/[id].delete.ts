
import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Postcode record ID is required.",
    });
  }

  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("free_delivery_postcodes")
    .delete()
    .eq("id", id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        error.message ||
        "Unable to remove free-delivery postcode.",
    });
  }

  return {
    success: true,
  };
});
