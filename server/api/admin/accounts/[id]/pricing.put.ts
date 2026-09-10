import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const userId = String(getRouterParam(event, "id") || "").trim();
  const body = await readBody(event);
  const pricingLevelKey = String(body?.pricing_level_key || "").trim();

  if (!userId || !pricingLevelKey) {
    throw createError({ statusCode: 400, statusMessage: "User and pricing level are required." });
  }

  const supabase = getAdminSupabase();
  const { data: level, error: levelError } = await supabase
    .from("customer_pricing_levels")
    .select("key,name,markup_percent,active")
    .eq("key", pricingLevelKey)
    .eq("active", true)
    .maybeSingle();

  if (levelError) throw createError({ statusCode: 500, statusMessage: levelError.message });
  if (!level) throw createError({ statusCode: 400, statusMessage: "Invalid pricing level." });

  const { error } = await supabase
    .from("customer_pricing_assignments")
    .upsert(
      { user_id: userId, pricing_level_key: pricingLevelKey, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  return {
    success: true,
    pricing_level_key: level.key,
    pricing_level_name: level.name,
    markup_percent: Number(level.markup_percent),
  };
});
