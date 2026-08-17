import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();
  const lowStockLimit = 5;

  const [
    productsResult,
    categoriesResult,
    ordersResult,
    recentOrdersResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, stock, active", { count: "exact" }),

    supabase
      .from("categories")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("orders")
      .select("id, total, status", { count: "exact" }),

    supabase
      .from("orders")
      .select("id, customer_email, customer_name, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (productsResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: productsResult.error.message,
    });
  }

  if (categoriesResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: categoriesResult.error.message,
    });
  }

  if (ordersResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: ordersResult.error.message,
    });
  }

  if (recentOrdersResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: recentOrdersResult.error.message,
    });
  }

  const products = productsResult.data ?? [];
  const orders = ordersResult.data ?? [];

  const activeProducts = products.filter((product: any) => product.active !== false);

  const allLowStockProducts = products.filter((product: any) => {
    const stock = Number(product.stock ?? 0);
    return stock >= 0 && stock <= lowStockLimit;
  });

  const lowStockProducts = [...allLowStockProducts]
    .sort((a: any, b: any) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
    .slice(0, 8);

  const paidOrders = orders.filter(
    (order: any) => String(order.status || "").toLowerCase() === "paid",
  );

  const paidRevenue = paidOrders.reduce(
    (sum: number, order: any) => sum + Number(order.total || 0),
    0,
  );

  return {
    stats: {
      products: productsResult.count ?? products.length,
      activeProducts: activeProducts.length,
      lowStock: allLowStockProducts.length,
      categories: categoriesResult.count ?? 0,
      orders: ordersResult.count ?? orders.length,
      paidOrders: paidOrders.length,
      paidRevenue,
    },
    lowStockProducts,
    recentOrders: recentOrdersResult.data ?? [],
  };
});
