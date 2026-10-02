import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const n = (v: any) => Number(v || 0);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const productId = Number(getRouterParam(event, "id"));
  const variantId = Number(getQuery(event).variant_id || 0) || null;
  if (!productId) throw createError({ statusCode: 400, statusMessage: "Product is required." });

  const s = getAdminSupabase();
  const { data: product, error } = await s.from("products")
    .select("id,name,product_code,stock,buy_price_ex_gst,landed_cost_ex_gst,price,low_stock_level,reorder_level,target_stock_level,product_variants(id,name,product_code,stock,price,active)")
    .eq("id", productId).single();
  if (error || !product) throw createError({ statusCode: 404, statusMessage: "Product not found." });

  const variant = variantId ? (product.product_variants || []).find((x: any) => Number(x.id) === variantId) : null;
  if (variantId && !variant) throw createError({ statusCode: 404, statusMessage: "Product variant not found." });

  const [supplierResult, moveResult, poLineResult] = await Promise.all([
    s.from("accounting_product_suppliers")
      .select("id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary,accounting_suppliers(id,name)")
      .eq("product_id", productId).order("is_primary", { ascending: false }).order("id"),
    s.from("accounting_inventory_movements")
      .select("id,movement_date,movement_type,quantity,unit_cost,total_cost,reference,notes,order_id,created_at")
      .eq("product_id", productId).order("movement_date", { ascending: false }).order("id", { ascending: false }).limit(100),
    s.from("accounting_purchase_order_lines")
      .select("id,purchase_order_id,quantity,unit_cost_ex_gst,gst_amount,line_total,description,sku,accounting_purchase_orders(id,po_number,status,order_date,expected_date,accounting_suppliers(id,name))")
      .eq("product_id", productId).order("id", { ascending: false }).limit(50),
  ]);

  if (supplierResult.error) throw createError({ statusCode: 500, statusMessage: supplierResult.error.message });
  if (moveResult.error) throw createError({ statusCode: 500, statusMessage: moveResult.error.message });
  if (poLineResult.error) throw createError({ statusCode: 500, statusMessage: poLineResult.error.message });

  const purchaseHistory = (poLineResult.data || []).map((x: any) => ({
    id: x.id,
    purchase_order_id: x.purchase_order_id,
    po_number: x.accounting_purchase_orders?.po_number || `PO-${x.purchase_order_id}`,
    status: x.accounting_purchase_orders?.status || "",
    order_date: x.accounting_purchase_orders?.order_date || null,
    expected_date: x.accounting_purchase_orders?.expected_date || null,
    supplier: x.accounting_purchase_orders?.accounting_suppliers?.name || "—",
    quantity: n(x.quantity),
    unit_cost_ex_gst: n(x.unit_cost_ex_gst),
    line_total: n(x.line_total),
  }));

  const onOrder = purchaseHistory
    .filter((x: any) => ["approved", "sent", "ordered", "part_received"].includes(String(x.status).toLowerCase()))
    .reduce((a: number, x: any) => a + n(x.quantity), 0);

  const stock = n(variant ? variant.stock : product.stock);
  const landed = n(product.landed_cost_ex_gst ?? product.buy_price_ex_gst);

  return {
    product: {
      id: product.id,
      variant_id: variantId,
      name: product.name,
      variant_name: variant?.name || null,
      sku: variant?.product_code || product.product_code || "",
      stock,
      buy_price_ex_gst: n(product.buy_price_ex_gst),
      landed_cost_ex_gst: landed,
      sell_price: n(variant?.price ?? product.price),
      low_stock_level: n(product.low_stock_level),
      reorder_level: n(product.reorder_level),
      target_stock_level: n(product.target_stock_level),
      stock_value_ex_gst: Math.round(stock * landed * 100) / 100,
      on_order: onOrder,
    },
    suppliers: supplierResult.data || [],
    movements: moveResult.data || [],
    purchases: purchaseHistory,
  };
});
