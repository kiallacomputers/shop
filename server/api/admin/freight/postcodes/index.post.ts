
import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);

  const postcode =
    String(body?.postcode || "").trim();

  const description =
    String(body?.description || "").trim() ||
    null;

  const flatRate = Number(body?.flat_rate);

  if (!/^\d{4}$/.test(postcode)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Postcode must contain exactly 4 digits.",
    });
  }

  if (![11, 16.5].includes(flatRate)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Flat rate must be either $11 or $16.50.",
    });
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("free_delivery_postcodes")
    .upsert(
      {
        postcode,
        description,
        flat_rate: flatRate,
        active: true,
      },
      {
        onConflict: "postcode",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        error.message ||
        "Unable to save free-delivery postcode.",
    });
  }

  return data;
});
