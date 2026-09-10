import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const supabase = getAdminSupabase();

  const { data: saved, error } = await supabase
    .from("customer_wishlist")
    .select("product_id,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const ids = (saved || []).map((row: any) => Number(row.product_id)).filter(Number.isFinite);
  if (!ids.length) return { productIds: [], products: [] };

  const { data: products, error: productError } = await supabase
    .from("products")
    .select(`id,name,slug,product_code,has_variants,blurb,price,oldPrice,stock,active,featured,refurbished,images,category_id,categories(name),product_variants(id,product_id,name,product_code,price,old_price,stock,active,images)`)
    .in("id", ids)
    .or("active.eq.true,active.is.null");

  if (productError) throw createError({ statusCode: 500, statusMessage: productError.message });

  const productMap = new Map((products || []).map((p: any) => [Number(p.id), p]));
  return {
    productIds: ids,
    products: ids.map((id) => productMap.get(id)).filter(Boolean),
  };
});
