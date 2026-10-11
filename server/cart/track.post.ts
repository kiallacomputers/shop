import { requireRequestUser } from "~~/server/utils/requestUser";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { enforceRateLimit } from "~~/server/utils/rateLimit";
import {
  calculateBaseCustomerPrice,
  calculateVariantCustomerPrice,
  effectivePricingMarkupPercent,
  getPricingLevelForUser,
  getStandardPricingLevel,
} from "~~/server/utils/customerPricing";

const money = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;
const MAX_CART_LINES = 100;
const MAX_QUANTITY = 999;

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    bucket: "cart-track",
    max: 120,
    windowSeconds: 600,
  });

  const user: any = await requireRequestUser(event);
  const body: any = await readBody(event);
  const rawItems = Array.isArray(body?.items) ? body.items.slice(0, MAX_CART_LINES) : [];
  const db = getAdminSupabase();

  // Only identifiers and quantities are accepted from the browser. Names,
  // prices, images, product codes and add-on details are rebuilt below from
  // trusted database records.
  const requestedItems = rawItems.map((item: any) => ({
    id: Number(item?.id),
    variantId:
      item?.variantId == null || item?.variantId === ""
        ? null
        : Number(item.variantId),
    quantity: Number(item?.quantity),
    addonOptionIds: Array.isArray(item?.addonOptionIds)
      ? [...new Set(item.addonOptionIds.map((id: any) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0))]
      : Array.isArray(item?.selectedAddons)
        ? [...new Set(item.selectedAddons.map((addon: any) => Number(addon?.id)).filter((id: number) => Number.isInteger(id) && id > 0))]
        : [],
  }));

  if (requestedItems.some((item: any) =>
    !Number.isInteger(item.id) || item.id <= 0 ||
    (item.variantId !== null && (!Number.isInteger(item.variantId) || item.variantId <= 0)) ||
    !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > MAX_QUANTITY
  )) {
    throw createError({ statusCode: 400, statusMessage: "Invalid cart item" });
  }

  const now = new Date().toISOString();
  const { data: openRows, error: openError } = await db
    .from("abandoned_carts")
    .select("id,status")
    .eq("user_id", user.id)
    .in("status", ["active", "abandoned", "recovered"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (openError) {
    console.error("ABANDONED CART LOOKUP ERROR:", openError);
    throw createError({ statusCode: 500, statusMessage: "Unable to find cart recovery record" });
  }

  const open = openRows?.[0] || null;

  if (!requestedItems.length) {
    if (open?.id) {
      const { error } = await db.from("abandoned_carts").update({ status: "expired", updated_at: now }).eq("id", open.id);
      if (error) {
        console.error("ABANDONED CART EXPIRE ERROR:", error);
        throw createError({ statusCode: 500, statusMessage: "Unable to expire cart recovery record" });
      }
    }
    return { ok: true, empty: true };
  }

  const productIds = [...new Set(requestedItems.map((item: any) => item.id))];
  const variantIds = [...new Set(requestedItems.map((item: any) => item.variantId).filter((id: any) => Number.isInteger(id)))];
  const addonIds = [...new Set(requestedItems.flatMap((item: any) => item.addonOptionIds))];

  const [productResult, variantResult, addonResult, pricingLevel, standardPricingLevel] = await Promise.all([
    db.from("products")
      .select("id,name,slug,product_code,price,buy_price_ex_gst,pricing_level_markup_override_percent,active,has_variants,images")
      .in("id", productIds),
    variantIds.length
      ? db.from("product_variants").select("id,product_id,name,product_code,price,active,images").in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
    addonIds.length
      ? db.from("product_addon_options")
          .select("id,name,price,active,group_id,product_addon_groups!inner(id,product_id,name,active)")
          .in("id", addonIds)
      : Promise.resolve({ data: [], error: null }),
    getPricingLevelForUser(String(user.id)),
    getStandardPricingLevel(),
  ]);

  if (productResult.error) {
    console.error("ABANDONED CART PRODUCT LOOKUP ERROR:", productResult.error);
    throw createError({ statusCode: 500, statusMessage: "Unable to validate cart products" });
  }
  if (variantResult.error) {
    console.error("ABANDONED CART VARIANT LOOKUP ERROR:", variantResult.error);
    throw createError({ statusCode: 500, statusMessage: "Unable to validate cart options" });
  }
  if (addonResult.error) {
    console.error("ABANDONED CART ADD-ON LOOKUP ERROR:", addonResult.error);
    throw createError({ statusCode: 500, statusMessage: "Unable to validate cart add-ons" });
  }

  const productMap = new Map((productResult.data || []).map((row: any) => [Number(row.id), row]));
  const variantMap = new Map((variantResult.data || []).map((row: any) => [Number(row.id), row]));
  const addonMap = new Map((addonResult.data || []).map((row: any) => [Number(row.id), row]));

  const items = requestedItems.map((requested: any) => {
    const product: any = productMap.get(requested.id);
    if (!product || product.active === false) {
      throw createError({ statusCode: 400, statusMessage: "A product in your cart is no longer available" });
    }

    const variant: any = requested.variantId ? variantMap.get(requested.variantId) : null;
    if (product.has_variants && (!variant || Number(variant.product_id) !== Number(product.id) || variant.active === false)) {
      throw createError({ statusCode: 400, statusMessage: `Please choose a valid option for ${product.name}` });
    }
    if (!product.has_variants && requested.variantId) {
      throw createError({ statusCode: 400, statusMessage: `Invalid option for ${product.name}` });
    }

    const selectedAddons = requested.addonOptionIds.map((id: number) => addonMap.get(id));
    if (selectedAddons.some((option: any) =>
      !option || option.active === false || option.product_addon_groups?.active === false ||
      Number(option.product_addon_groups?.product_id) !== Number(product.id)
    )) {
      throw createError({ statusCode: 400, statusMessage: `Invalid add-on selection for ${product.name}` });
    }

    const baseCustomerPrice = calculateBaseCustomerPrice(
      product.buy_price_ex_gst,
      effectivePricingMarkupPercent(pricingLevel.markupPercent, product.pricing_level_markup_override_percent),
      product.price,
      effectivePricingMarkupPercent(standardPricingLevel.markupPercent, product.pricing_level_markup_override_percent),
    );
    const productPrice = variant
      ? calculateVariantCustomerPrice({ baseCustomerPrice, storedBasePrice: product.price, variantPrice: variant.price })
      : baseCustomerPrice;
    const addonTotal = selectedAddons.reduce((sum: number, option: any) => sum + Number(option.price || 0), 0);
    const price = money(productPrice + addonTotal);

    if (!Number.isFinite(price) || price <= 0) {
      throw createError({ statusCode: 400, statusMessage: `Invalid price for ${product.name}` });
    }

    const addonSnapshot = selectedAddons.map((option: any) => ({
      id: Number(option.id),
      name: String(option.name || ""),
      price: money(option.price),
      group_id: Number(option.group_id),
      groupName: String(option.product_addon_groups?.name || ""),
    }));
    const addonKey = addonSnapshot.map((addon: any) => addon.id).sort((a: number, b: number) => a - b).join(",");

    return {
      id: Number(product.id),
      cartKey: `${product.id}:${variant?.id ?? "base"}:${addonKey || "no-addons"}`,
      variantId: variant ? Number(variant.id) : null,
      variantName: variant?.name || null,
      productCode: variant?.product_code || product.product_code || null,
      name: String(product.name || ""),
      slug: String(product.slug || ""),
      price,
      image: variant?.images?.length ? variant.images : product.images || null,
      selectedAddons: addonSnapshot,
      quantity: requested.quantity,
    };
  });

  const cartValue = money(items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0));
  const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const payload = {
    customer_email: user.email || null,
    customer_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    items,
    cart_value: cartValue,
    item_count: itemCount,
    status: "active",
    last_activity_at: now,
    abandoned_at: null,
    updated_at: now,
  };

  if (open?.id) {
    const { error } = await db.from("abandoned_carts").update(payload).eq("id", open.id);
    if (error) {
      console.error("ABANDONED CART UPDATE ERROR:", error);
      throw createError({ statusCode: 500, statusMessage: "Unable to update cart recovery record" });
    }
    console.info("ABANDONED CART UPDATED:", { id: open.id, userId: user.id, itemCount, cartValue });
    return { ok: true, id: open.id, action: "updated" };
  }

  const { data, error } = await db.from("abandoned_carts").insert({ user_id: user.id, ...payload }).select("id").single();
  if (error) {
    console.error("ABANDONED CART INSERT ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Unable to create cart recovery record" });
  }

  console.info("ABANDONED CART CREATED:", { id: data.id, userId: user.id, itemCount, cartValue });
  return { ok: true, id: data.id, action: "created" };
});
