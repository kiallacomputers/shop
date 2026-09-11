import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

type AnyRow = Record<string, any>;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();

  const [productsResult, notificationsResult, processingOrdersResult] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id,name,slug,product_code,stock,active,has_variants,buy_price_ex_gst,price,images,category_id,
        categories(id,name,slug,parent_id),
        product_variants(id,product_id,name,product_code,stock,active,price,images,sort_order)
      `)
      .order("name", { ascending: true }),
    supabase
      .from("customer_back_in_stock_notifications")
      .select("product_id,variant_id,status")
      .eq("status", "waiting")
      .limit(5000),
    supabase
      .from("orders")
      .select("id")
      .eq("status", "processing")
      .limit(5000),
  ]);

  if (productsResult.error) {
    throw createError({ statusCode: 500, statusMessage: productsResult.error.message || "Unable to load inventory." });
  }

  // Back-in-stock was added later than the products table, so do not break inventory
  // if a deployment has not yet run that migration.
  const waitingRows = notificationsResult.error?.code === "42P01"
    ? []
    : notificationsResult.error
      ? (() => { throw createError({ statusCode: 500, statusMessage: notificationsResult.error!.message }); })()
      : (notificationsResult.data || []);

  if (processingOrdersResult.error) {
    throw createError({ statusCode: 500, statusMessage: processingOrdersResult.error.message || "Unable to load open orders." });
  }

  const processingOrderIds = (processingOrdersResult.data || []).map((row: AnyRow) => Number(row.id)).filter(Number.isFinite);
  let orderItems: AnyRow[] = [];
  if (processingOrderIds.length) {
    const { data, error } = await supabase
      .from("order_items")
      .select("order_id,product_id,variant_id,quantity")
      .in("order_id", processingOrderIds)
      .limit(10000);
    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load open order items." });
    }
    orderItems = data || [];
  }

  const waitingByKey = new Map<string, number>();
  for (const row of waitingRows as AnyRow[]) {
    const key = `${Number(row.product_id)}:${row.variant_id ? Number(row.variant_id) : "base"}`;
    waitingByKey.set(key, (waitingByKey.get(key) || 0) + 1);
  }

  const demandByKey = new Map<string, number>();
  for (const row of orderItems) {
    const key = `${Number(row.product_id)}:${row.variant_id ? Number(row.variant_id) : "base"}`;
    demandByKey.set(key, (demandByKey.get(key) || 0) + Math.max(0, Number(row.quantity || 0)));
  }

  const inventory: AnyRow[] = [];
  for (const product of (productsResult.data || []) as AnyRow[]) {
    const baseCost = Number(product.buy_price_ex_gst || 0);
    const variants = Array.isArray(product.product_variants)
      ? product.product_variants.filter((variant: AnyRow) => variant?.active !== false)
      : [];

    if (product.has_variants && variants.length) {
      for (const variant of variants.sort((a: AnyRow, b: AnyRow) => Number(a.sort_order || 0) - Number(b.sort_order || 0))) {
        const stock = Math.max(0, Number(variant.stock || 0));
        const key = `${Number(product.id)}:${Number(variant.id)}`;
        inventory.push({
          key,
          product_id: Number(product.id),
          variant_id: Number(variant.id),
          product_name: product.name,
          variant_name: variant.name,
          slug: product.slug,
          code: variant.product_code || product.product_code || "",
          category: product.categories?.name || "Uncategorised",
          stock,
          active: product.active !== false && variant.active !== false,
          buy_price_ex_gst: baseCost,
          sell_price: Number(variant.price ?? product.price ?? 0),
          stock_value_ex_gst: Math.round(baseCost * stock * 100) / 100,
          waiting_customers: waitingByKey.get(key) || 0,
          open_order_qty: demandByKey.get(key) || 0,
          image: Array.isArray(variant.images) && variant.images[0]
            ? variant.images[0]
            : (Array.isArray(product.images) ? product.images[0] || null : null),
        });
      }
    } else {
      const stock = Math.max(0, Number(product.stock || 0));
      const key = `${Number(product.id)}:base`;
      inventory.push({
        key,
        product_id: Number(product.id),
        variant_id: null,
        product_name: product.name,
        variant_name: null,
        slug: product.slug,
        code: product.product_code || "",
        category: product.categories?.name || "Uncategorised",
        stock,
        active: product.active !== false,
        buy_price_ex_gst: baseCost,
        sell_price: Number(product.price || 0),
        stock_value_ex_gst: Math.round(baseCost * stock * 100) / 100,
        waiting_customers: waitingByKey.get(key) || 0,
        open_order_qty: demandByKey.get(key) || 0,
        image: Array.isArray(product.images) ? product.images[0] || null : null,
      });
    }
  }

  return {
    generated_at: new Date().toISOString(),
    items: inventory,
  };
});
