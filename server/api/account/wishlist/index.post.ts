import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const body = await readBody(event);
  const productId = Number(body?.product_id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "A valid product is required." });
  }

  const supabase = getAdminSupabase();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,active")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product || product.active === false) {
    throw createError({ statusCode: 404, statusMessage: "Product not found." });
  }

  const { error } = await supabase
    .from("customer_wishlist")
    .upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" });

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { saved: true, product_id: productId };
});
