import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const makeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const body = await readBody(event);

  const name = String(body?.name || "").trim().slice(0, 80);
  const markupPercent = Number(body?.markup_percent);
  const sortOrder = Number(body?.sort_order || 0);
  const active = body?.active !== false;

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Pricing level name is required." });
  }
  if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 1000) {
    throw createError({ statusCode: 400, statusMessage: "Markup must be between 0% and 1000%." });
  }

  const key = makeKey(String(body?.key || name));
  if (!key || key === "standard") {
    throw createError({ statusCode: 400, statusMessage: "Please use a different pricing level name/key." });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("customer_pricing_levels")
    .insert({
      key,
      name,
      markup_percent: markupPercent,
      sort_order: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
      active,
      updated_at: new Date().toISOString(),
    })
    .select("key,name,markup_percent,sort_order,active")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    throw createError({
      statusCode: duplicate ? 409 : 500,
      statusMessage: duplicate
        ? "A pricing level with that name/key already exists."
        : error.message,
    });
  }

  return data;
});
