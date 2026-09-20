import { getAdminSupabase } from "~~/server/utils/adminAuth";

const PRODUCT_SELECT = `
  id, name, slug, blurb, product_code, has_variants,
  price, oldPrice, stock, active, featured, refurbished, images, category_id,
  categories (id, name, slug, parent_id),
  product_variants (id, product_id, name, product_code, price, old_price, stock, active, images)
`;

export default defineEventHandler(async (event) => {
  const productId = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(productId) || productId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid product ID." });
  }

  const supabase = getAdminSupabase();
  const { data: currentProduct, error: currentError } = await supabase
    .from("products")
    .select("id, category_id")
    .eq("id", productId)
    .maybeSingle();

  if (currentError) {
    throw createError({ statusCode: 500, statusMessage: currentError.message || "Unable to load product." });
  }
  if (!currentProduct) {
    throw createError({ statusCode: 404, statusMessage: "Product not found." });
  }

  const { data: manualRows, error: manualError } = await supabase
    .from("product_related_products")
    .select("related_product_id, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (manualError) {
    throw createError({ statusCode: 500, statusMessage: manualError.message || "Unable to load related products." });
  }

  const manualIds = (manualRows || [])
    .map((row) => Number(row.related_product_id))
    .filter((id) => Number.isInteger(id) && id > 0 && id !== productId);

  const results: any[] = [];
  const seen = new Set<number>([productId]);

  if (manualIds.length) {
    const { data: manualProducts, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", manualIds)
      .eq("active", true);

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load manually related products." });
    }

    const byId = new Map((manualProducts || []).map((item: any) => [Number(item.id), item]));
    for (const id of manualIds) {
      const item = byId.get(id);
      if (item && !seen.has(id)) {
        results.push(item);
        seen.add(id);
      }
      if (results.length >= 4) return results;
    }
  }

  const categoryId = Number(currentProduct.category_id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) return results;

  const { data: sameCategory, error: sameError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("category_id", categoryId)
    .neq("id", productId)
    .order("featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(12);

  if (sameError) {
    throw createError({ statusCode: 500, statusMessage: sameError.message || "Unable to load recommended products." });
  }

  for (const item of sameCategory || []) {
    const id = Number(item.id);
    if (!seen.has(id)) {
      results.push(item);
      seen.add(id);
    }
    if (results.length >= 4) return results;
  }

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id, parent_id")
    .eq("active", true);

  if (categoryError) {
    throw createError({ statusCode: 500, statusMessage: categoryError.message || "Unable to load product categories." });
  }

  const currentCategory = (categories || []).find((row: any) => Number(row.id) === categoryId);
  const mainCategoryId = currentCategory?.parent_id == null ? categoryId : Number(currentCategory.parent_id);
  const familyCategoryIds = (categories || [])
    .filter((row: any) => Number(row.id) === mainCategoryId || Number(row.parent_id) === mainCategoryId)
    .map((row: any) => Number(row.id))
    .filter((id: number) => Number.isInteger(id) && id > 0 && id !== categoryId);

  if (!familyCategoryIds.length) return results;

  const { data: familyProducts, error: familyError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .in("category_id", familyCategoryIds)
    .neq("id", productId)
    .order("featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(20);

  if (familyError) {
    throw createError({ statusCode: 500, statusMessage: familyError.message || "Unable to load category recommendations." });
  }

  for (const item of familyProducts || []) {
    const id = Number(item.id);
    if (!seen.has(id)) {
      results.push(item);
      seen.add(id);
    }
    if (results.length >= 4) break;
  }

  return results;
});
