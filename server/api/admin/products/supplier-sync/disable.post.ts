import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const productId = Number(body?.product_id);
  const variantId = Number(body?.variant_id || 0) || null;
  if (!productId) throw createError({ statusCode: 400, statusMessage: "Product is required." });

  const s = getAdminSupabase();
  if (variantId) {
    const { data: variant, error: findError } = await s.from("product_variants")
      .select("id,product_id,name,active").eq("id", variantId).eq("product_id", productId).single();
    if (findError || !variant) throw createError({ statusCode: 404, statusMessage: "Variation not found." });
    const { error } = await s.from("product_variants").update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", variantId).eq("product_id", productId);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    return { ok: true, type: "variation", id: variantId, message: "Variation disabled." };
  }

  const { data: product, error: findError } = await s.from("products").select("id,name,active").eq("id", productId).single();
  if (findError || !product) throw createError({ statusCode: 404, statusMessage: "Product not found." });
  const { error } = await s.from("products").update({ active: false }).eq("id", productId);
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { ok: true, type: "product", id: productId, message: "Product disabled." };
});