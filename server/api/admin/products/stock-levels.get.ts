import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();

  const [{ data: products, error: productError }, { data: categories, error: categoryError }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,product_code,stock,active,category_id,low_stock_level,reorder_level,target_stock_level")
      .order("name"),
    supabase
      .from("categories")
      .select("id,name,parent_id,sort_order")
      .order("sort_order")
      .order("name"),
  ]);

  if (productError) {
    console.error("BULK STOCK LEVEL PRODUCTS ERROR:", productError);
    throw createError({ statusCode: 500, statusMessage: productError.message || "Unable to load products" });
  }
  if (categoryError) {
    console.error("BULK STOCK LEVEL CATEGORIES ERROR:", categoryError);
    throw createError({ statusCode: 500, statusMessage: categoryError.message || "Unable to load categories" });
  }

  const categoryMap = new Map((categories || []).map((c: any) => [String(c.id), c.name]));
  return {
    products: (products || []).map((p: any) => ({
      ...p,
      stock: Number(p.stock || 0),
      low_stock_level: Number(p.low_stock_level || 0),
      reorder_level: Number(p.reorder_level || 0),
      target_stock_level: Number(p.target_stock_level || 0),
      category_name: categoryMap.get(String(p.category_id || "")) || "",
    })),
    categories: categories || [],
  };
});
