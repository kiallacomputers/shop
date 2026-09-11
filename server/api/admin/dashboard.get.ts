import { getAdminSupabase, getAdminUser } from "~~/server/utils/adminAuth";

type AnyRow = Record<string, any>;

const REVENUE_STATUSES = new Set(["paid", "processing", "shipping", "delivered"]);
const OPEN_ORDER_STATUSES = new Set(["paid", "processing"]);
const LOW_STOCK_LIMIT = 5;

const money2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const melbourneDayKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const chunk = <T>(values: T[], size = 250) => {
  const result: T[][] = [];
  for (let i = 0; i < values.length; i += size) result.push(values.slice(i, i + size));
  return result;
};

export default defineEventHandler(async (event) => {
  const adminContext = await getAdminUser(event);
  if (!adminContext.user) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }
  if (!adminContext.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Administrator access required" });
  }

  const supabase = getAdminSupabase();
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    productsResult,
    categoriesResult,
    ordersResult,
    recentOrdersResult,
    waitingResult,
    quotesResult,
    crmProfilesResult,
    adminsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id,name,slug,product_code,stock,active,has_variants,buy_price_ex_gst,price,images,category_id,
        categories(id,name),
        product_variants(id,product_id,name,product_code,stock,active,price,images,sort_order)
      `)
      .order("name", { ascending: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id,user_id,customer_email,customer_name,total,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("orders")
      .select("id,user_id,customer_email,customer_name,total,status,created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("customer_back_in_stock_notifications")
      .select("product_id,variant_id,user_id,status")
      .eq("status", "waiting")
      .limit(5000),
    adminContext.isSuperAdmin
      ? supabase
          .from("customer_quote_requests")
          .select("id,status,quoted_total,expires_at,created_at,sent_at")
          .order("created_at", { ascending: false })
          .limit(5000)
      : Promise.resolve({ data: [], error: null } as any),
    supabase
      .from("customer_crm_profiles")
      .select("user_id,created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("admin_users").select("id").limit(1000),
  ]);

  for (const result of [productsResult, categoriesResult, ordersResult, recentOrdersResult]) {
    if (result.error) {
      throw createError({ statusCode: 500, statusMessage: result.error.message || "Unable to load dashboard data." });
    }
  }

  const optionalTableMissing = (error: any) => error?.code === "42P01";
  if (waitingResult.error && !optionalTableMissing(waitingResult.error)) {
    throw createError({ statusCode: 500, statusMessage: waitingResult.error.message });
  }
  if ((quotesResult as any).error && !optionalTableMissing((quotesResult as any).error)) {
    throw createError({ statusCode: 500, statusMessage: (quotesResult as any).error.message });
  }
  if (crmProfilesResult.error && !optionalTableMissing(crmProfilesResult.error)) {
    throw createError({ statusCode: 500, statusMessage: crmProfilesResult.error.message });
  }

  const products = (productsResult.data || []) as AnyRow[];
  const orders = (ordersResult.data || []) as AnyRow[];
  const revenueOrders = orders.filter((order) => REVENUE_STATUSES.has(String(order.status || "").toLowerCase()));
  const openOrders = orders.filter((order) => OPEN_ORDER_STATUSES.has(String(order.status || "").toLowerCase()));
  const relevantOrderIds = Array.from(new Set([
    ...revenueOrders.filter((order) => new Date(order.created_at).getTime() >= ninetyDaysAgo.getTime()).map((order) => Number(order.id)),
    ...openOrders.map((order) => Number(order.id)),
  ].filter(Number.isFinite)));

  const orderItems: AnyRow[] = [];
  for (const idChunk of chunk(relevantOrderIds)) {
    if (!idChunk.length) continue;
    const { data, error } = await supabase
      .from("order_items")
      .select("id,order_id,product_id,variant_id,product_name,variant_name,product_code,quantity,price")
      .in("order_id", idChunk)
      .limit(10000);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load order items." });
    orderItems.push(...(data || []));
  }

  const orderById = new Map(orders.map((order) => [Number(order.id), order]));
  const productById = new Map(products.map((product) => [Number(product.id), product]));

  const inventoryItems: AnyRow[] = [];
  for (const product of products) {
    const baseCost = Math.max(0, Number(product.buy_price_ex_gst || 0));
    const variants = Array.isArray(product.product_variants)
      ? product.product_variants.filter((variant: AnyRow) => variant?.active !== false)
      : [];

    if (product.has_variants && variants.length) {
      for (const variant of variants) {
        const stock = Math.max(0, Number(variant.stock || 0));
        inventoryItems.push({
          key: `${Number(product.id)}:${Number(variant.id)}`,
          product_id: Number(product.id),
          variant_id: Number(variant.id),
          name: product.name,
          variant_name: variant.name,
          slug: product.slug,
          code: variant.product_code || product.product_code || "",
          category: product.categories?.name || "Uncategorised",
          stock,
          active: product.active !== false && variant.active !== false,
          buy_price_ex_gst: baseCost,
          stock_value_ex_gst: baseCost * stock,
        });
      }
    } else {
      const stock = Math.max(0, Number(product.stock || 0));
      inventoryItems.push({
        key: `${Number(product.id)}:base`,
        product_id: Number(product.id),
        variant_id: null,
        name: product.name,
        variant_name: null,
        slug: product.slug,
        code: product.product_code || "",
        category: product.categories?.name || "Uncategorised",
        stock,
        active: product.active !== false,
        buy_price_ex_gst: baseCost,
        stock_value_ex_gst: baseCost * stock,
      });
    }
  }

  const waitingRows = optionalTableMissing(waitingResult.error) ? [] : ((waitingResult.data || []) as AnyRow[]);
  const waitingByKey = new Map<string, number>();
  for (const row of waitingRows) {
    const key = `${Number(row.product_id)}:${row.variant_id ? Number(row.variant_id) : "base"}`;
    waitingByKey.set(key, (waitingByKey.get(key) || 0) + 1);
  }

  const openOrderIds = new Set(openOrders.map((order) => Number(order.id)));
  const openDemandByKey = new Map<string, number>();
  const openDemandOrdersByKey = new Map<string, Set<number>>();
  for (const item of orderItems) {
    const orderId = Number(item.order_id);
    if (!openOrderIds.has(orderId)) continue;
    const key = `${Number(item.product_id)}:${item.variant_id ? Number(item.variant_id) : "base"}`;
    openDemandByKey.set(key, (openDemandByKey.get(key) || 0) + Math.max(0, Number(item.quantity || 0)));
    if (!openDemandOrdersByKey.has(key)) openDemandOrdersByKey.set(key, new Set());
    openDemandOrdersByKey.get(key)!.add(orderId);
  }

  for (const item of inventoryItems) {
    item.waiting_customers = waitingByKey.get(item.key) || 0;
    item.open_order_qty = openDemandByKey.get(item.key) || 0;
  }

  const activeInventory = inventoryItems.filter((item) => item.active);
  const lowStockItems = activeInventory.filter((item) => item.stock > 0 && item.stock <= LOW_STOCK_LIMIT);
  const outOfStockItems = activeInventory.filter((item) => item.stock <= 0);
  const stockValueExGst = activeInventory.reduce((sum, item) => sum + Number(item.stock_value_ex_gst || 0), 0);
  const stockUnits = activeInventory.reduce((sum, item) => sum + Number(item.stock || 0), 0);

  const stockRiskOrderIds = new Set<number>();
  for (const item of activeInventory) {
    if (item.stock <= 0 && item.open_order_qty > 0) {
      for (const orderId of openDemandOrdersByKey.get(item.key) || []) stockRiskOrderIds.add(orderId);
    }
  }

  const inventoryAttention = activeInventory
    .filter((item) => item.stock <= LOW_STOCK_LIMIT || item.waiting_customers > 0 || item.open_order_qty > 0)
    .sort((a, b) => {
      const aScore = (a.stock === 0 ? 10000 : 0) + a.waiting_customers * 100 + a.open_order_qty * 50 + Math.max(0, LOW_STOCK_LIMIT - a.stock);
      const bScore = (b.stock === 0 ? 10000 : 0) + b.waiting_customers * 100 + b.open_order_qty * 50 + Math.max(0, LOW_STOCK_LIMIT - b.stock);
      return bScore - aScore || a.stock - b.stock;
    })
    .slice(0, 8)
    .map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      name: item.name,
      variant_name: item.variant_name,
      code: item.code,
      stock: item.stock,
      waiting_customers: item.waiting_customers,
      open_order_qty: item.open_order_qty,
    }));

  const periods = [
    { key: "today", label: "Today", days: 0 },
    { key: "7d", label: "Last 7 Days", days: 7 },
    { key: "30d", label: "Last 30 Days", days: 30 },
    { key: "90d", label: "Last 90 Days", days: 90 },
  ];
  const todayKey = melbourneDayKey(now);

  const periodSales: Record<string, any> = {};
  for (const period of periods) {
    const rows = revenueOrders.filter((order) => {
      if (period.key === "today") return melbourneDayKey(order.created_at) === todayKey;
      return new Date(order.created_at).getTime() >= now.getTime() - period.days * 24 * 60 * 60 * 1000;
    });
    const revenue = rows.reduce((sum, order) => sum + Number(order.total || 0), 0);
    periodSales[period.key] = {
      label: period.label,
      orders: rows.length,
      revenue: money2(revenue),
      gst: money2(revenue / 11),
    };
  }

  const orderCostById = new Map<number, number>();
  const orderProductRevenueExGstById = new Map<number, number>();
  const topProductMap = new Map<string, AnyRow>();

  for (const item of orderItems) {
    const orderId = Number(item.order_id);
    const order = orderById.get(orderId);
    if (!order || !REVENUE_STATUSES.has(String(order.status || "").toLowerCase())) continue;

    const orderDate = new Date(order.created_at).getTime();
    const quantity = Math.max(0, Number(item.quantity || 0));
    const unitPriceIncGst = Math.max(0, Number(item.price || 0));
    const product = productById.get(Number(item.product_id));
    const unitCostExGst = Math.max(0, Number(product?.buy_price_ex_gst || 0));

    orderCostById.set(orderId, (orderCostById.get(orderId) || 0) + unitCostExGst * quantity);
    orderProductRevenueExGstById.set(orderId, (orderProductRevenueExGstById.get(orderId) || 0) + (unitPriceIncGst * quantity) / 1.1);

    if (orderDate >= ninetyDaysAgo.getTime()) {
      const key = `${Number(item.product_id)}:${item.variant_id ? Number(item.variant_id) : "base"}`;
      const current = topProductMap.get(key) || {
        product_id: Number(item.product_id),
        variant_id: item.variant_id ? Number(item.variant_id) : null,
        name: item.product_name || product?.name || `Product #${item.product_id}`,
        variant_name: item.variant_name || null,
        code: item.product_code || product?.product_code || "",
        quantity: 0,
        revenue: 0,
      };
      current.quantity += quantity;
      current.revenue += unitPriceIncGst * quantity;
      topProductMap.set(key, current);
    }
  }

  const profitForOrders = (rows: AnyRow[]) => {
    let productRevenueExGst = 0;
    let costExGst = 0;
    for (const order of rows) {
      const id = Number(order.id);
      productRevenueExGst += orderProductRevenueExGstById.get(id) || 0;
      costExGst += orderCostById.get(id) || 0;
    }
    return money2(productRevenueExGst - costExGst);
  };

  const last30Orders = revenueOrders.filter((order) => new Date(order.created_at).getTime() >= thirtyDaysAgo.getTime());
  const allRevenue = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const thirtyRevenue = last30Orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const chart: AnyRow[] = [];
  for (let offset = 29; offset >= 0; offset--) {
    const dayDate = addDays(now, -offset);
    const key = melbourneDayKey(dayDate);
    const dayOrders = revenueOrders.filter((order) => melbourneDayKey(order.created_at) === key);
    chart.push({
      date: key,
      revenue: money2(dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)),
      orders: dayOrders.length,
    });
  }

  const statusCounts: Record<string, number> = {
    paid: 0,
    processing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  };
  for (const order of orders) {
    const status = String(order.status || "").toLowerCase();
    if (status in statusCounts) statusCounts[status] += 1;
  }

  const quotes = ((quotesResult as any).data || []) as AnyRow[];
  const expiredQuotes = quotes.filter((quote) => quote.expires_at && new Date(quote.expires_at).getTime() < now.getTime() && quote.status === "quoted");
  const quoteStats = adminContext.isSuperAdmin
    ? {
        visible: true,
        awaitingAction: quotes.filter((quote) => ["requested", "reviewing"].includes(String(quote.status))).length,
        sent: quotes.filter((quote) => quote.status === "quoted" && !expiredQuotes.some((expired) => expired.id === quote.id)).length,
        accepted: quotes.filter((quote) => quote.status === "accepted").length,
        expired: expiredQuotes.length,
      }
    : { visible: false, awaitingAction: 0, sent: 0, accepted: 0, expired: 0 };

  let customerUsers: AnyRow[] = [];
  let authUsersLoaded = false;
  try {
    const listed = await (supabase.auth.admin as any).listUsers({ page: 1, perPage: 1000 });
    if (!listed?.error) {
      customerUsers = listed?.data?.users || [];
      authUsersLoaded = true;
    }
  } catch {
    authUsersLoaded = false;
  }

  const adminIds = new Set(((adminsResult.data || []) as AnyRow[]).map((row) => String(row.id)));
  const crmProfiles = optionalTableMissing(crmProfilesResult.error) ? [] : ((crmProfilesResult.data || []) as AnyRow[]);
  const customers = authUsersLoaded
    ? customerUsers.filter((user) => !adminIds.has(String(user.id)))
    : crmProfiles.filter((profile) => !adminIds.has(String(profile.user_id)));
  const newCustomers30d = customers.filter((customer) => {
    const created = customer.created_at;
    return created && new Date(created).getTime() >= thirtyDaysAgo.getTime();
  }).length;

  const topProducts = [...topProductMap.values()]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 8)
    .map((item) => ({ ...item, revenue: money2(item.revenue) }));

  return {
    generated_at: now.toISOString(),
    sales: {
      periods: periodSales,
      allTimeRevenue: money2(allRevenue),
      allTimeOrders: revenueOrders.length,
      last30: {
        revenue: money2(thirtyRevenue),
        gst: money2(thirtyRevenue / 11),
        estimatedGrossProfitExGst: profitForOrders(last30Orders),
      },
      chart,
    },
    orders: {
      total: orders.length,
      statuses: statusCounts,
      newPaid: statusCounts.paid,
      processing: statusCounts.processing,
      shipping: statusCounts.shipping,
      delivered: statusCounts.delivered,
      backorderRisk: stockRiskOrderIds.size,
    },
    inventory: {
      products: products.length,
      activeProducts: products.filter((product) => product.active !== false).length,
      categories: categoriesResult.count ?? 0,
      stockUnits,
      stockValueExGst: money2(stockValueExGst),
      lowStock: lowStockItems.length,
      outOfStock: outOfStockItems.length,
      waitingCustomers: waitingRows.length,
      attention: inventoryAttention,
    },
    quotes: quoteStats,
    customers: {
      total: customers.length,
      new30d: newCustomers30d,
    },
    topProducts,
    recentOrders: recentOrdersResult.data || [],
  };
});
