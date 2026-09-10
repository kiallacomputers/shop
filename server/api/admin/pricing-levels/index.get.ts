import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const supabase = getAdminSupabase();

  const { data: levels, error } = await supabase
    .from("customer_pricing_levels")
    .select("key,name,markup_percent,sort_order,active,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load pricing levels.",
    });
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("customer_pricing_assignments")
    .select("pricing_level_key");

  if (assignmentError) {
    throw createError({
      statusCode: 500,
      statusMessage: assignmentError.message || "Unable to load pricing assignments.",
    });
  }

  const counts = new Map<string, number>();
  for (const row of assignments || []) {
    const key = String(row.pricing_level_key || "");
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return (levels || []).map((level: any) => ({
    key: String(level.key),
    name: String(level.name),
    markup_percent: Number(level.markup_percent),
    sort_order: Number(level.sort_order || 0),
    active: level.active !== false,
    assigned_customers: counts.get(String(level.key)) || 0,
    is_standard: String(level.key) === "standard",
  }));
});
