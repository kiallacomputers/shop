import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { getRequestUser } from "~~/server/utils/requestUser";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const productId = Number(body?.product_id);
  const variantId = body?.variant_id == null || body?.variant_id === "" ? null : Number(body.variant_id);
  if (!Number.isInteger(productId) || productId <= 0 || (variantId != null && (!Number.isInteger(variantId) || variantId <= 0))) {
    throw createError({ statusCode: 400, statusMessage: "Invalid product selection." });
  }

  const supabase = getAdminSupabase();
  const user: any = await getRequestUser(event);
  const userId = user?.id || user?.sub ? String(user.id || user.sub) : null;
  let email = String(user?.email || body?.email || "").trim().toLowerCase();
  let customerName = String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || body?.name || "").trim();

  if (userId) {
    const { data: profile } = await supabase
      .from("customer_crm_profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    customerName = String(profile?.display_name || customerName || "").trim();
  }

  if (!emailRx.test(email)) throw createError({ statusCode: 400, statusMessage: "Enter a valid email address." });

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,name,stock,active,has_variants")
    .eq("id", productId)
    .maybeSingle();
  if (productError || !product || product.active === false) throw createError({ statusCode: 404, statusMessage: "Product not found." });

  let stock = Number(product.stock || 0);
  if (variantId) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id,product_id,stock,active")
      .eq("id", variantId)
      .eq("product_id", productId)
      .maybeSingle();
    if (variantError || !variant || variant.active === false) throw createError({ statusCode: 404, statusMessage: "Product option not found." });
    stock = Number(variant.stock || 0);
  } else if (product.has_variants) {
    throw createError({ statusCode: 400, statusMessage: "Choose the product option you want us to notify you about." });
  }

  if (stock > 0) return { alreadyAvailable: true, message: "This item is already in stock." };

  let existingQuery = supabase
    .from("customer_back_in_stock_notifications")
    .select("id")
    .eq("product_id", productId)
    .eq("status", "waiting")
    .ilike("email", email);
  existingQuery = variantId ? existingQuery.eq("variant_id", variantId) : existingQuery.is("variant_id", null);
  const { data: existing } = await existingQuery.maybeSingle();
  if (existing) return { subscribed: true, duplicate: true, message: "You’re already on the notification list for this item." };

  const { data, error } = await supabase
    .from("customer_back_in_stock_notifications")
    .insert({ user_id: userId, email, customer_name: customerName || null, product_id: productId, variant_id: variantId, status: "waiting" })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { subscribed: true, duplicate: true, message: "You’re already on the notification list for this item." };
    if (error.code === "42P01") throw createError({ statusCode: 503, statusMessage: "Back-in-stock notifications are not configured yet. Run the Supabase migration." });
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to save notification request." });
  }

  return { subscribed: true, id: data.id, message: "We’ll email you when this item is back in stock." };
});
