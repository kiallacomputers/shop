import { getAdminSupabase } from "~~/server/utils/adminAuth";
import {
  calculateBaseCustomerPrice,
  calculateVariantCustomerPrice,
  getPricingLevelForUser,
  getStandardPricingLevel,
} from "~~/server/utils/customerPricing";
import { sendBackInStockEmail } from "~~/server/utils/backInStockEmail";

const absoluteImage = (value: unknown, origin: string) => {
  const image = String(value || "").trim();
  if (!image) return null;
  try { return new URL(image, origin).toString(); } catch { return null; }
};

export async function processBackInStockNotifications({
  productId,
  variantId = null,
  origin,
}: {
  productId: number;
  variantId?: number | null;
  origin: string;
}) {
  const supabase = getAdminSupabase();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,name,slug,product_code,buy_price_ex_gst,price,stock,active,images")
    .eq("id", productId)
    .maybeSingle();
  if (productError || !product || product.active === false) return { sent: 0, waiting: 0 };

  let variant: any = null;
  let currentStock = Number(product.stock || 0);
  if (variantId) {
    const { data, error } = await supabase
      .from("product_variants")
      .select("id,product_id,name,product_code,price,stock,active,images")
      .eq("id", variantId)
      .eq("product_id", productId)
      .maybeSingle();
    if (error || !data || data.active === false) return { sent: 0, waiting: 0 };
    variant = data;
    currentStock = Number(variant.stock || 0);
  }

  if (!(currentStock > 0)) return { sent: 0, waiting: 0 };

  let query = supabase
    .from("customer_back_in_stock_notifications")
    .select("id,user_id,email,customer_name,product_id,variant_id,status")
    .eq("product_id", productId)
    .eq("status", "waiting");
  query = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null);
  const { data: notifications, error } = await query;
  if (error) {
    if (error.code === "42P01") return { sent: 0, waiting: 0 };
    throw error;
  }

  const rows = notifications || [];
  const userIds = [...new Set(rows.map((row: any) => row.user_id ? String(row.user_id) : null).filter(Boolean))];

  // Back-in-stock emails are intentionally limited to signed-in customers who
  // still have this product in their wishlist and have not disabled the
  // notification preference in My Account.
  const wishlistUsers = new Set<string>();
  const optedOutUsers = new Set<string>();
  if (userIds.length) {
    const [{ data: wishlistRows }, { data: profileRows }] = await Promise.all([
      supabase
        .from("customer_wishlist")
        .select("user_id")
        .eq("product_id", productId)
        .in("user_id", userIds),
      supabase
        .from("customer_crm_profiles")
        .select("user_id,back_in_stock_updates")
        .in("user_id", userIds),
    ]);
    for (const item of wishlistRows || []) wishlistUsers.add(String(item.user_id));
    for (const profile of profileRows || []) {
      if (profile.back_in_stock_updates === false) optedOutUsers.add(String(profile.user_id));
    }
  }

  const standard = await getStandardPricingLevel();
  let sent = 0;
  let eligible = 0;
  for (const row of rows) {
    const rowUserId = row.user_id ? String(row.user_id) : null;
    if (!rowUserId || !wishlistUsers.has(rowUserId) || optedOutUsers.has(rowUserId)) continue;
    eligible += 1;
    try {
      const level = await getPricingLevelForUser(rowUserId);
      const basePrice = calculateBaseCustomerPrice(
        product.buy_price_ex_gst,
        level.markupPercent,
        product.price,
        standard.markupPercent,
      );
      const finalPrice = variant
        ? calculateVariantCustomerPrice({
            baseCustomerPrice: basePrice,
            storedBasePrice: product.price,
            variantPrice: variant.price,
          })
        : basePrice;

      const productUrl = new URL(`/product/${encodeURIComponent(product.slug)}`, origin).toString();
      const images = Array.isArray(variant?.images) && variant.images.length ? variant.images : product.images;
      await sendBackInStockEmail({
        email: String(row.email),
        customerName: row.customer_name,
        productName: String(product.name),
        variantName: variant?.name || null,
        productCode: variant?.product_code || product.product_code || null,
        price: finalPrice,
        pricingLevelName: level.name,
        productUrl,
        imageUrl: absoluteImage(Array.isArray(images) ? images[0] : null, origin),
      });

      await supabase
        .from("customer_back_in_stock_notifications")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      sent += 1;
    } catch (emailError: any) {
      console.error("BACK IN STOCK EMAIL ERROR:", emailError);
      await supabase
        .from("customer_back_in_stock_notifications")
        .update({ last_error: String(emailError?.message || emailError).slice(0, 1000), updated_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  }

  return { sent, waiting: rows.length, eligible };
}
