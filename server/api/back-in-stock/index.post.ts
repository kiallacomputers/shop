import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const body = await readBody(event);
  const productId = Number(body?.product_id);
  const variantId = body?.variant_id == null || body?.variant_id === "" ? null : Number(body.variant_id);

  if (!Number.isInteger(productId) || productId <= 0 || (variantId != null && (!Number.isInteger(variantId) || variantId <= 0))) {
    throw createError({ statusCode: 400, statusMessage: "Invalid product selection." });
  }

  const supabase = getAdminSupabase();
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) throw createError({ statusCode: 400, statusMessage: "Your account does not have an email address." });

  const [{ data: product, error: productError }, { data: wishlistItem }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,stock,active,has_variants")
      .eq("id", productId)
      .maybeSingle(),
    supabase
      .from("customer_wishlist")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle(),
  ]);

  if (productError || !product || product.active === false) {
    throw createError({ statusCode: 404, statusMessage: "Product not found." });
  }

  if (!wishlistItem) {
    throw createError({
      statusCode: 400,
      statusMessage: "Add this product to your wishlist before enabling a back-in-stock notification.",
    });
  }

  let stock = Number(product.stock || 0);
  if (variantId) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id,product_id,stock,active")
      .eq("id", variantId)
      .eq("product_id", productId)
      .maybeSingle();
    if (variantError || !variant || variant.active === false) {
      throw createError({ statusCode: 404, statusMessage: "Product option not found." });
    }
    stock = Number(variant.stock || 0);
  } else if (product.has_variants) {
    throw createError({ statusCode: 400, statusMessage: "Choose the product option you want us to notify you about." });
  }

  if (stock > 0) return { alreadyAvailable: true, message: "This item is already in stock." };

  const { data: profile } = await supabase
    .from("customer_crm_profiles")
    .select("display_name,back_in_stock_updates")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.back_in_stock_updates === false) {
    throw createError({
      statusCode: 400,
      statusMessage: "Back-in-stock emails are turned off in My Account. Enable them first to receive this notification.",
    });
  }

  const customerName = String(
    profile?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || "",
  ).trim();

  let existingQuery = supabase
    .from("customer_back_in_stock_notifications")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .eq("status", "waiting");
  existingQuery = variantId ? existingQuery.eq("variant_id", variantId) : existingQuery.is("variant_id", null);
  const { data: existing } = await existingQuery.maybeSingle();
  if (existing) {
    return {
      subscribed: true,
      duplicate: true,
      message: "This wishlist item is already set to notify you when it is back in stock.",
    };
  }

  const { data, error } = await supabase
    .from("customer_back_in_stock_notifications")
    .insert({
      user_id: user.id,
      email,
      customer_name: customerName || null,
      product_id: productId,
      variant_id: variantId,
      status: "waiting",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        subscribed: true,
        duplicate: true,
        message: "This wishlist item is already set to notify you when it is back in stock.",
      };
    }
    if (error.code === "42P01") {
      throw createError({ statusCode: 503, statusMessage: "Back-in-stock notifications are not configured yet. Run the Supabase migration." });
    }
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to save notification request." });
  }

  return {
    subscribed: true,
    id: data.id,
    message: "Saved. We’ll only email you while this product remains in your wishlist.",
  };
});
