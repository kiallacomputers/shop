import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const productId = Number(getRouterParam(event, "id"));
  const variantId = Number(getRouterParam(event, "variantId"));
  const body = await readBody(event);
  if (!Number.isInteger(productId) || !Number.isInteger(variantId) || typeof body?.active !== "boolean") throw createError({ statusCode: 400, statusMessage: "Invalid variation or status" });
  const db = getAdminSupabase();
  const { data, error } = await db.from("product_variants").update({ active: body.active, updated_at: new Date().toISOString() }).eq("id", variantId).eq("product_id", productId).select("id,active").single();
  if (error || !data) throw createError({ statusCode: 500, statusMessage: error?.message || "Variation not found" });
  return data;
});
