import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const cleanSlug = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normaliseImages = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundToNearestFive = (value: number) => {
  if (value <= 0) return 0;
  return Math.max(5, Math.round(value / 5) * 5);
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Product ID is required" });

  const body = await readBody(event);
  const name = String(body?.name || "").trim();
  const slug = cleanSlug(body?.slug || name);
  const buyPriceExGst = Number(body?.buy_price_ex_gst);
  const sellMarkupPercent = Number(body?.sell_markup_percent);
  const rrpMarkupPercent = Number(body?.rrp_markup_percent);
  const stock = Number(body?.stock);
  const weightKg = Number(body?.weight_kg);
  const lengthCm = Number(body?.length_cm);
  const widthCm = Number(body?.width_cm);
  const heightCm = Number(body?.height_cm);

  if (!name) throw createError({ statusCode: 400, statusMessage: "Product name is required" });
  if (!slug) throw createError({ statusCode: 400, statusMessage: "Product slug is required" });

  for (const [label, value] of [
    ["Buy price ex GST", buyPriceExGst],
    ["Sell markup", sellMarkupPercent],
    ["RRP markup", rrpMarkupPercent],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      throw createError({ statusCode: 400, statusMessage: `${label} must be a valid number of 0 or more` });
    }
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw createError({ statusCode: 400, statusMessage: "Stock must be a whole number of 0 or more" });
  }

  for (const [label, value] of [
    ["Weight", weightKg], ["Length", lengthCm], ["Width", widthCm], ["Height", heightCm],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw createError({ statusCode: 400, statusMessage: `${label} must be greater than 0` });
    }
  }

  const sellExGst = roundMoney(buyPriceExGst * (1 + sellMarkupPercent / 100));
  const rrpExGst = roundMoney(buyPriceExGst * (1 + rrpMarkupPercent / 100));
  const price = roundToNearestFive(sellExGst * 1.1);
  const oldPrice = roundToNearestFive(rrpExGst * 1.1);

  const updates = {
    name,
    slug,
    blurb: String(body?.blurb || "").trim() || null,
    description: body?.description ?? [],
    buy_price_ex_gst: roundMoney(buyPriceExGst),
    sell_markup_percent: sellMarkupPercent,
    rrp_markup_percent: rrpMarkupPercent,
    price,
    oldPrice,
    stock,
    weight_kg: weightKg,
    length_cm: lengthCm,
    width_cm: widthCm,
    height_cm: heightCm,
    active: body?.active !== false,
    featured: body?.featured === true,
    refurbished: body?.refurbished === true,
    images: normaliseImages(body?.images),
    category_id: body?.category_id || null,
  };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("products").update(updates).eq("id", id).select("*").maybeSingle();

  if (error) {
    console.error("ADMIN UPDATE PRODUCT ERROR:", error);
    if (error.code === "23505") {
      throw createError({ statusCode: 409, statusMessage: "A product with this slug already exists" });
    }
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to update product" });
  }

  if (!data) throw createError({ statusCode: 404, statusMessage: "Product not found" });
  return data;
});
