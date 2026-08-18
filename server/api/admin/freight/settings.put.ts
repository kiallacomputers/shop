
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

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("freight_settings")
    .upsert(
      {
        id: 1,
        origin_postcode: postcode,
        enabled: body?.enabled !== false,
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
