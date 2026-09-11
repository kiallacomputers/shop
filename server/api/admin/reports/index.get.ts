import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

type Row = Record<string, any>;
const REVENUE_STATUSES = new Set(["paid", "processing", "shipping", "delivered"]);
const n = (v: unknown) => Number(v || 0);
const money = (v: number) => Math.round(v * 100) / 100;
const chunks = <T>(a: T[], size = 250) => Array.from({ length: Math.ceil(a.length / size) }, (_, i) => a.slice(i * size, (i + 1) * size));

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event);
  const start = String(q.start || "");
  const end = String(q.end || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    throw createError({ statusCode: 400, statusMessage: "A valid report start and end date are required." });
  }
  const startIso = `${start}T00:00:00.000+10:00`;
  const endDate = new Date(`${end}T00:00:00+10:00`);
  endDate.setDate(endDate.getDate() + 1);
  const endIso = endDate.toISOString();
  const supabase = getAdminSupabase();

  const [ordersR, productsR, assignmentsR, levelsR, profilesR] = await Promise.all([
    supabase.from("orders").select("id,user_id,customer_email,customer_name,total,status,created_at,shipping_cost").gte("created_at", startIso).lt("created_at", endIso).order("created_at", { ascending: false }).limit(10000),
    supabase.from("products").select("id,name,slug,product_code,stock,active,has_variants,buy_price_ex_gst,price,category_id,categories(id,name),product_variants(id,name,product_code,stock,active)").order("name"),
    supabase.from("customer_pricing_assignments").select("user_id,pricing_level_key"),
    supabase.from("customer_pricing_levels").select("key,name"),
    supabase.from("customer_crm_profiles").select("user_id,display_name,business_name,created_at"),
  ]);
  const required = [ordersR, productsR];
  const failed = required.find((r) => r.error);
  if (failed?.error) throw createError({ statusCode: 500, statusMessage: failed.error.message });

  const orders = (ordersR.data || []) as Row[];
  const revenueOrders = orders.filter((o) => REVENUE_STATUSES.has(String(o.status || "").toLowerCase()));
  const orderIds = revenueOrders.map((o) => Number(o.id)).filter(Number.isFinite);
  const items: Row[] = [];
  for (const ids of chunks(orderIds)) {
    if (!ids.length) continue;
    const r = await supabase.from("order_items").select("id,order_id,product_id,variant_id,product_name,variant_name,product_code,quantity,price").in("order_id", ids).limit(10000);
    if (r.error) throw createError({ statusCode: 500, statusMessage: r.error.message });
    items.push(...(r.data || []));
  }

  const products = (productsR.data || []) as Row[];
  const productMap = new Map(products.map((p) => [Number(p.id), p]));
  const orderMap = new Map(revenueOrders.map((o) => [Number(o.id), o]));
  const revenue = revenueOrders.reduce((s, o) => s + n(o.total), 0);
  const gst = revenue / 11;
  const exGst = revenue - gst;
  let cogs = 0;
  const productStats = new Map<string, Row>();
  for (const item of items) {
    const qty = Math.max(0, n(item.quantity));
    const lineRevenue = qty * n(item.price);
    const product = productMap.get(Number(item.product_id));
    const cost = Math.max(0, n(product?.buy_price_ex_gst)) * qty;
    cogs += cost;
    const key = `${item.product_id}:${item.variant_id || "base"}`;
    const cur = productStats.get(key) || { product_id: item.product_id, variant_id: item.variant_id || null, name: item.product_name || product?.name || "Product", variant_name: item.variant_name || null, code: item.product_code || product?.product_code || "", quantity: 0, revenue: 0, cogs: 0, order_ids: new Set<number>() };
    cur.quantity += qty; cur.revenue += lineRevenue; cur.cogs += cost; cur.order_ids.add(Number(item.order_id));
    productStats.set(key, cur);
  }

  const orderRows = orders.map((o) => ({ id: o.id, created_at: o.created_at, customer_name: o.customer_name || "", customer_email: o.customer_email || "", status: o.status, total: money(n(o.total)), shipping_cost: money(n(o.shipping_cost)), revenue_order: REVENUE_STATUSES.has(String(o.status || "").toLowerCase()) }));
  const productRows = [...productStats.values()].map((x) => ({ product_id: x.product_id, variant_id: x.variant_id, name: x.name, variant_name: x.variant_name, code: x.code, quantity: x.quantity, orders: x.order_ids.size, revenue: money(x.revenue), revenue_ex_gst: money(x.revenue / 1.1), estimated_cost_ex_gst: money(x.cogs), estimated_profit_ex_gst: money(x.revenue / 1.1 - x.cogs) })).sort((a,b) => b.revenue - a.revenue);

  const customerStats = new Map<string, Row>();
  for (const o of revenueOrders) {
    const key = String(o.user_id || o.customer_email || `order-${o.id}`).toLowerCase();
    const cur = customerStats.get(key) || { user_id: o.user_id || null, name: o.customer_name || "Customer", email: o.customer_email || "", orders: 0, spend: 0, last_purchase: null };
    cur.orders++; cur.spend += n(o.total); if (!cur.last_purchase || new Date(o.created_at) > new Date(cur.last_purchase)) cur.last_purchase = o.created_at;
    customerStats.set(key, cur);
  }
  const assignmentMap = new Map((assignmentsR.data || []).map((x: any) => [String(x.user_id), String(x.pricing_level_key)]));
  const levelMap = new Map((levelsR.data || []).map((x: any) => [String(x.key), String(x.name)]));
  const profileMap = new Map((profilesR.data || []).map((x: any) => [String(x.user_id), x]));
  const customerRows = [...customerStats.values()].map((x) => {
    const profile = x.user_id ? profileMap.get(String(x.user_id)) : null;
    const levelKey = x.user_id ? (assignmentMap.get(String(x.user_id)) || "standard") : "standard";
    return { ...x, name: profile?.display_name || x.name, business_name: profile?.business_name || "", pricing_level: levelMap.get(levelKey) || levelKey, spend: money(x.spend), average_order: money(x.orders ? x.spend / x.orders : 0) };
  }).sort((a,b) => b.spend - a.spend);

  const inventoryRows: Row[] = [];
  for (const p of products) {
    const variants = Array.isArray(p.product_variants) ? p.product_variants.filter((v: Row) => v.active !== false) : [];
    const cost = Math.max(0, n(p.buy_price_ex_gst));
    if (p.has_variants && variants.length) {
      for (const v of variants) inventoryRows.push({ product_id: p.id, variant_id: v.id, name: p.name, variant_name: v.name, code: v.product_code || p.product_code || "", category: p.categories?.name || "Uncategorised", stock: Math.max(0,n(v.stock)), buy_price_ex_gst: money(cost), stock_value_ex_gst: money(Math.max(0,n(v.stock))*cost), status: n(v.stock)<=0 ? "Out of stock" : n(v.stock)<=5 ? "Low stock" : "In stock" });
    } else inventoryRows.push({ product_id: p.id, variant_id: null, name: p.name, variant_name: null, code: p.product_code || "", category: p.categories?.name || "Uncategorised", stock: Math.max(0,n(p.stock)), buy_price_ex_gst: money(cost), stock_value_ex_gst: money(Math.max(0,n(p.stock))*cost), status: n(p.stock)<=0 ? "Out of stock" : n(p.stock)<=5 ? "Low stock" : "In stock" });
  }

  return {
    range: { start, end },
    summary: { orders: revenueOrders.length, revenue: money(revenue), sales_ex_gst: money(exGst), gst: money(gst), estimated_cogs_ex_gst: money(cogs), estimated_gross_profit_ex_gst: money(exGst - cogs), average_order: money(revenueOrders.length ? revenue / revenueOrders.length : 0) },
    orders: orderRows,
    products: productRows,
    customers: customerRows,
    inventory: inventoryRows,
  };
});
