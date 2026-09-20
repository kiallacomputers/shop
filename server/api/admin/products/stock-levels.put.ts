import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const whole = (value: unknown) => Number(value);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const rows = Array.isArray(body?.products) ? body.products : [];

  if (!rows.length) throw createError({ statusCode: 400, statusMessage: "No product changes were supplied" });
  if (rows.length > 1000) throw createError({ statusCode: 400, statusMessage: "Too many products in one update" });

  const cleaned = rows.map((row: any) => ({
    id: Number(row?.id),
    low_stock_level: whole(row?.low_stock_level),
    reorder_level: whole(row?.reorder_level),
    target_stock_level: whole(row?.target_stock_level),
  }));

  const seen = new Set<number>();
  for (const row of cleaned) {
    if (!Number.isInteger(row.id) || row.id <= 0) throw createError({ statusCode: 400, statusMessage: "A valid product ID is required" });
    if (seen.has(row.id)) throw createError({ statusCode: 400, statusMessage: `Product ${row.id} was supplied more than once` });
    seen.add(row.id);

    for (const [label, value] of [
      ["Low stock level", row.low_stock_level],
      ["Reorder level", row.reorder_level],
      ["Target stock level", row.target_stock_level],
    ] as const) {
      if (!Number.isInteger(value) || value < 0) {
        throw createError({ statusCode: 400, statusMessage: `${label} must be a whole number of 0 or more` });
      }
    }
    if (row.reorder_level < row.low_stock_level) {
      throw createError({ statusCode: 400, statusMessage: `Product ${row.id}: Reorder level must be equal to or higher than low stock level` });
    }
    if (row.target_stock_level < row.reorder_level) {
      throw createError({ statusCode: 400, statusMessage: `Product ${row.id}: Target stock level must be equal to or higher than reorder level` });
    }
  }

  const supabase = getAdminSupabase();

  // Validate all requested IDs first so a bad ID cannot result in a misleading partial save.
  const ids = cleaned.map((row: any) => row.id);
  const { data: existing, error: existingError } = await supabase.from("products").select("id").in("id", ids);
  if (existingError) throw createError({ statusCode: 500, statusMessage: existingError.message });
  if ((existing || []).length !== ids.length) throw createError({ statusCode: 404, statusMessage: "One or more products could not be found" });

  let updated = 0;
  for (const row of cleaned) {
    const { error } = await supabase
      .from("products")
      .update({
        low_stock_level: row.low_stock_level,
        reorder_level: row.reorder_level,
        target_stock_level: row.target_stock_level,
      })
      .eq("id", row.id);

    if (error) {
      console.error("BULK STOCK LEVEL UPDATE ERROR:", { productId: row.id, error });
      throw createError({
        statusCode: 500,
        statusMessage: `Saved ${updated} product(s), then failed on product ${row.id}: ${error.message}`,
      });
    }
    updated++;
  }

  return { ok: true, updated };
});
