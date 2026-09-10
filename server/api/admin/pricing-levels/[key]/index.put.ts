import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);

  const key = String(getRouterParam(event, "key") || "").trim();
  const body = await readBody(event);
  const name = String(body?.name || "").trim().slice(0, 80);
  const markupPercent = Number(body?.markup_percent);
  const sortOrder = Number(body?.sort_order || 0);
  const active = body?.active !== false;

  if (!key || !name) {
    throw createError({ statusCode: 400, statusMessage: "Pricing level and name are required." });
  }
  if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 1000) {
    throw createError({ statusCode: 400, statusMessage: "Markup must be between 0% and 1000%." });
  }
  if (key === "standard" && !active) {
    throw createError({ statusCode: 400, statusMessage: "The Standard pricing level must remain active." });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("customer_pricing_levels")
    .update({
      name,
      markup_percent: markupPercent,
      sort_order: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)
    .select("key,name,markup_percent,sort_order,active")
    .maybeSingle();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: "Pricing level not found." });
  }

  return data;
});
