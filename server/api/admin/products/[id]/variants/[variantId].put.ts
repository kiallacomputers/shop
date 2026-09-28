import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { processBackInStockNotifications } from "~~/server/utils/backInStockNotifications";
import { getSiteOrigin } from "~~/server/utils/siteUrl";

const validGtin = (value: string) => !value || /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const productId = Number(getRouterParam(event, "id"));
  const variantId = Number(getRouterParam(event, "variantId"));
  const body = await readBody(event);

  const name = String(body?.name || "").trim();
  const productCode = String(body?.product_code || "").trim();
  const gtin = String(body?.gtin || "").replace(/\s+/g, "").trim();
  const mpn = String(body?.mpn || "").trim();
  const price = body?.price == null || body?.price === "" ? null : Number(body.price);
  const oldPrice = body?.old_price == null || body?.old_price === "" ? null : Number(body.old_price);
  const stock = Number(body?.stock);

  if (!name || !productCode) throw createError({ statusCode: 400, statusMessage: "Variant name and product code are required" });
  if ((price !== null && (!Number.isFinite(price) || price < 0)) || !Number.isInteger(stock) || stock < 0) {
    throw createError({ statusCode: 400, statusMessage: "Enter a valid price and stock level" });
  }
  if (!validGtin(gtin)) throw createError({ statusCode: 400, statusMessage: "GTIN must contain 8, 12, 13 or 14 digits" });

  const supabase = getAdminSupabase();
  const { data: baseCode } = await supabase.from("products").select("id").ilike("product_code", productCode).limit(1).maybeSingle();
  if (baseCode) throw createError({ statusCode: 409, statusMessage: "That product code is already used by a product" });

  const { data, error } = await supabase.from("product_variants").update({
    name,
    product_code: productCode,
    gtin: gtin || null,
    mpn: mpn || null,
    price,
    old_price: Number.isFinite(oldPrice as number) ? oldPrice : null,
    stock,
    active: body?.active !== false,
    images: Array.isArray(body?.images) ? body.images : [],
    sort_order: Number(body?.sort_order) || 0,
    updated_at: new Date().toISOString(),
  }).eq("id", variantId).eq("product_id", productId).select("*").single();

  if (error) {
    if (error.code === "23505") throw createError({ statusCode: 409, statusMessage: "That product code is already in use" });
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  if (Number(data?.stock || 0) > 0) {
    try { await processBackInStockNotifications({ productId, variantId, origin: getSiteOrigin(event) }); }
    catch (notifyError) { console.error("BACK IN STOCK PROCESSING ERROR:", notifyError); }
  }
  return data;
});
