import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const n = (v: any) => Number(v || 0);
const r = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);

  const q = getQuery(event);
  const now = new Date();
  const fy = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const start = String(q.start || `${fy}-07-01`);
  const end = String(q.end || `${fy + 1}-06-30`);
  const s = getAdminSupabase();

  const { data: products, error: productError } = await s
    .from("products")
    .select("id,name,product_code,buy_price_ex_gst,price,stock,active")
    .order("name");

  if (productError) {
    console.error("INVENTORY REPORT PRODUCTS ERROR", productError);
    throw createError({ statusCode: 500, statusMessage: productError.message });
  }

  // Match the actual accounting_inventory_movements schema created by
  // 20260918_inventory_cogs.sql: unit_cost / total_cost / reference / journal_id.
  const { data: moves, error: movementError } = await s
    .from("accounting_inventory_movements")
    .select("id,product_id,order_id,movement_date,movement_type,quantity,unit_cost,total_cost,reference,notes,journal_id,created_at")
    .gte("movement_date", start)
    .lte("movement_date", end)
    .order("movement_date", { ascending: false })
    .order("id", { ascending: false });

  if (movementError) {
    console.error("INVENTORY REPORT MOVEMENTS ERROR", movementError);
    throw createError({ statusCode: 500, statusMessage: movementError.message });
  }

  const productMap = new Map<string, any>();
  for (const p of products || []) productMap.set(String(p.id), p);

  const valuation = (products || []).map((p: any) => {
    const qty = n(p.stock);
    const unit = r(n(p.buy_price_ex_gst));
    const value = r(qty * unit);
    const sell = r(qty * n(p.price));
    return {
      id: p.id,
      name: p.name,
      sku: p.product_code || "",
      stock: qty,
      unit_cost: unit,
      value,
      retail_value: sell,
      potential_margin: r(sell - value),
      active: p.active !== false,
    };
  });

  const enrichedMoves = (moves || []).map((x: any) => {
    const p = productMap.get(String(x.product_id));
    return {
      ...x,
      unit_cost_ex_gst: n(x.unit_cost),
      total_cost_ex_gst: n(x.total_cost),
      source_type: x.order_id ? "order" : null,
      source_id: x.order_id ? String(x.order_id) : null,
      products: p ? { name: p.name, product_code: p.product_code } : null,
    };
  });

  const sales = enrichedMoves.filter((x: any) => x.movement_type === "sale");
  const byProduct = new Map<string, any>();

  for (const x of sales) {
    const id = String(x.product_id || "");
    const p = productMap.get(id);
    const row = byProduct.get(id) || {
      product_id: x.product_id,
      name: p?.name || "Unknown product",
      sku: p?.product_code || "",
      quantity_sold: 0,
      cogs: 0,
    };
    row.quantity_sold += Math.abs(n(x.quantity));
    row.cogs = r(row.cogs + Math.abs(n(x.total_cost)));
    byProduct.set(id, row);
  }

  return {
    period: { start, end },
    summary: {
      inventory_value: r(valuation.reduce((a: number, x: any) => a + x.value, 0)),
      retail_value: r(valuation.reduce((a: number, x: any) => a + x.retail_value, 0)),
      units_on_hand: r(valuation.reduce((a: number, x: any) => a + x.stock, 0)),
      period_cogs: r(sales.reduce((a: number, x: any) => a + Math.abs(n(x.total_cost)), 0)),
      low_stock_products: valuation.filter((x: any) => x.active && n(x.stock) <= 5).length,
      out_of_stock_products: valuation.filter((x: any) => x.active && n(x.stock) <= 0).length,
      potential_margin: r(valuation.reduce((a: number, x: any) => a + x.potential_margin, 0)),
    },
    valuation,
    profitability: [...byProduct.values()].sort((a, b) => b.cogs - a.cogs),
    movements: enrichedMoves,
  };
});
