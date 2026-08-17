import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const cleanSlug = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normaliseImages = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return [];
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" });
  }

  const body = await readBody(event);
  const name = String(body?.name || "").trim();
  const slug = cleanSlug(body?.slug || name);
  const price = Number(body?.price);
  const stock = Number(body?.stock);

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Product name is required" });
  }

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Product slug is required" });
  }

  if (!Number.isFinite(price) || price < 0) {
    throw createError({ statusCode: 400, statusMessage: "Price must be a valid number" });
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw createError({ statusCode: 400, statusMessage: "Stock must be a whole number of 0 or more" });
  }

  const oldPrice = body?.oldPrice === "" || body?.oldPrice == null
    ? null
    : Number(body.oldPrice);

  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0)) {
    throw createError({ statusCode: 400, statusMessage: "Old price must be a valid number" });
  }

  const updates = {
    name,
    slug,
    blurb: String(body?.blurb || "").trim() || null,
    description: body?.description ?? [],
    price,
    oldPrice,
    stock,
    active: body?.active !== false,
    featured: body?.featured === true,
    refurbished: body?.refurbished === true,
    images: normaliseImages(body?.images),
    category_id: body?.category_id || null,
  };

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("ADMIN UPDATE PRODUCT ERROR:", error);

    if (error.code === "23505") {
      throw createError({
        statusCode: 409,
        statusMessage: "A product with this slug already exists",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to update product",
    });
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" });
  }

  return data;
});
