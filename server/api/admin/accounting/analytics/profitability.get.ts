import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

type Row = Record<string, any>;
const REVENUE_STATUSES = new Set(["paid", "processing", "shipping", "delivered"]);
const n = (v: any) => Number(v || 0);
const r = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const chunks = <T>(a: T[], size = 250) => Array.from({ length: Math.ceil(a.length / size) }, (_, i) => a.slice(i * size, (i + 1) * size));

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event);
  const now = new Date();
  const fy = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const start = String(q.start || `${fy}-07-01`);
  const end = String(q.end || `${fy + 1}-06-30`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) throw createError({ statusCode: 400, statusMessage: "Valid start and end dates are required." });

  const s = getAdminSupabase();
  const startIso = `${start}T00:00:00.000+10:00`;
  const endDate = new Date(`${end}T00:00:00+10:00`); endDate.setDate(endDate.getDate() + 1);
  const endIso = endDate.toISOString();

  const [ordersR, productsR, movesR] = await Promise.all([
    s.from("orders").select("id,user_id,customer_name,customer_email,total,status,created_at").gte("created_at", startIso).lt("created_at", endIso).limit(10000),
    s.from("products").select("id,name,product_code,buy_price_ex_gst,price,stock,active,category_id,categories(id,name)").order("name"),
    s.from("accounting_inventory_movements").select("id,product_id,order_id,movement_date,movement_type,quantity,unit_cost,total_cost").eq("movement_type", "sale").gte("movement_date", start).lte("movement_date", end).limit(20000),
  ]);
  if (ordersR.error) throw createError({ statusCode: 500, statusMessage: ordersR.error.message });
  if (productsR.error) throw createError({ statusCode: 500, statusMessage: productsR.error.message });
  // Older installations may not yet have movement history. Analytics still works using product buy price as fallback.
  const movements = movesR.error ? [] : (movesR.data || []);
  const orders = (ordersR.data || []).filter((o: any) => REVENUE_STATUSES.has(String(o.status || "").toLowerCase()));
  const orderIds = orders.map((o: any) => Number(o.id)).filter(Number.isFinite);
  const items: Row[] = [];
  for (const ids of chunks(orderIds)) {
    if (!ids.length) continue;
    const ir = await s.from("order_items").select("id,order_id,product_id,variant_id,product_name,variant_name,product_code,quantity,price").in("order_id", ids).limit(10000);
    if (ir.error) throw createError({ statusCode: 500, statusMessage: ir.error.message });
    items.push(...(ir.data || []));
  }

  const products = productsR.data || [];
  const productMap = new Map(products.map((p: any) => [Number(p.id), p]));
  const orderMap = new Map(orders.map((o: any) => [Number(o.id), o]));
  const movementCost = new Map<string, number>();
  for (const m of movements) if (m.order_id && m.product_id) movementCost.set(`${Number(m.order_id)}:${Number(m.product_id)}`, Math.abs(n(m.total_cost)));

  const prod = new Map<string, Row>();
  const cats = new Map<string, Row>();
  const customers = new Map<string, Row>();
  const months = new Map<string, Row>();
  let revenueInc = 0, revenueEx = 0, cogs = 0, units = 0;

  for (const item of items) {
    const order = orderMap.get(Number(item.order_id)); if (!order) continue;
    const p: any = productMap.get(Number(item.product_id));
    const qty = Math.max(0, n(item.quantity));
    const inc = r(qty * n(item.price));
    const ex = r(inc / 1.1);
    const historical = movementCost.get(`${Number(item.order_id)}:${Number(item.product_id)}`);
    const cost = r(historical !== undefined ? historical : qty * n(p?.buy_price_ex_gst));
    const profit = r(ex - cost);
    const category = p?.categories?.name || "Uncategorised";
    const pkey = `${item.product_id || item.product_name}:${item.variant_id || "base"}`;
    const pr = prod.get(pkey) || { product_id:item.product_id, name:item.product_name || p?.name || "Product", variant:item.variant_name || "", sku:item.product_code || p?.product_code || "", category, quantity:0, orders:new Set<number>(), revenue_ex_gst:0, cogs:0, profit:0 };
    pr.quantity += qty; pr.orders.add(Number(item.order_id)); pr.revenue_ex_gst += ex; pr.cogs += cost; pr.profit += profit; prod.set(pkey, pr);
    const cr = cats.get(category) || { category, quantity:0, revenue_ex_gst:0, cogs:0, profit:0 }; cr.quantity += qty; cr.revenue_ex_gst += ex; cr.cogs += cost; cr.profit += profit; cats.set(category, cr);
    const ckey = String(order.user_id || order.customer_email || order.customer_name || `order-${order.id}`).toLowerCase();
    const cu = customers.get(ckey) || { user_id:order.user_id || null, name:order.customer_name || "Customer", email:order.customer_email || "", orders:new Set<number>(), revenue_ex_gst:0, cogs:0, profit:0 };
    cu.orders.add(Number(order.id)); cu.revenue_ex_gst += ex; cu.cogs += cost; cu.profit += profit; customers.set(ckey, cu);
    const month = String(order.created_at).slice(0,7); const mo = months.get(month) || { month, revenue_ex_gst:0, cogs:0, profit:0 }; mo.revenue_ex_gst += ex; mo.cogs += cost; mo.profit += profit; months.set(month, mo);
    revenueInc += inc; revenueEx += ex; cogs += cost; units += qty;
  }

  const finish = (x: Row) => ({ ...x, orders: x.orders instanceof Set ? x.orders.size : x.orders, revenue_ex_gst:r(x.revenue_ex_gst), cogs:r(x.cogs), profit:r(x.profit), margin_pct:x.revenue_ex_gst ? r((x.profit/x.revenue_ex_gst)*100) : 0 });
  const productRows = [...prod.values()].map(finish).sort((a,b)=>b.profit-a.profit);
  const categoryRows = [...cats.values()].map(finish).sort((a,b)=>b.profit-a.profit);
  const customerRows = [...customers.values()].map(finish).sort((a,b)=>b.profit-a.profit);
  const monthlyRows = [...months.values()].map(finish).sort((a,b)=>String(a.month).localeCompare(String(b.month)));

  const marginAlerts = products.map((p:any)=>{
    const sellEx = r(n(p.price)/1.1), cost = r(n(p.buy_price_ex_gst)), profit=r(sellEx-cost), margin=sellEx?r(profit/sellEx*100):0;
    return { id:p.id, name:p.name, sku:p.product_code||"", category:p.categories?.name||"Uncategorised", buy_price_ex_gst:cost, sell_price_inc_gst:r(n(p.price)), sell_price_ex_gst:sellEx, profit_ex_gst:profit, margin_pct:margin, stock:n(p.stock), active:p.active!==false };
  }).filter((x:any)=>x.active && x.sell_price_inc_gst>0).sort((a:any,b:any)=>a.margin_pct-b.margin_pct);

  return { period:{start,end}, summary:{orders:orders.length,units:r(units),revenue_inc_gst:r(revenueInc),revenue_ex_gst:r(revenueEx),cogs:r(cogs),gross_profit:r(revenueEx-cogs),gross_margin_pct:revenueEx?r(((revenueEx-cogs)/revenueEx)*100):0,average_order_ex_gst:orders.length?r(revenueEx/orders.length):0}, products:productRows, categories:categoryRows, customers:customerRows, monthly:monthlyRows, margin_alerts:marginAlerts };
});
