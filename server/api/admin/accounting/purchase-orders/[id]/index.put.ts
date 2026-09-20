import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { purchaseTotals } from "~~/server/utils/accountingPurchases";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid purchase order." });

  const body = await readBody(event);
  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!Number(body.supplier_id) || !lines.length)
    throw createError({ statusCode: 400, statusMessage: "Supplier and at least one line are required." });

  const s = getAdminSupabase();
  const { data: current, error: currentError } = await s.from("accounting_purchase_orders").select("id,po_number,status").eq("id", id).single();
  if (currentError || !current) throw createError({ statusCode: 404, statusMessage: "Purchase order not found." });
  if (String(current.status).toLowerCase() !== "draft")
    throw createError({ statusCode: 409, statusMessage: "Only draft purchase orders can be edited." });

  const totals = purchaseTotals(lines);
  const { data: po, error } = await s.from("accounting_purchase_orders").update({
    supplier_id: Number(body.supplier_id), expected_date: body.expected_date || null,
    supplier_reference: body.supplier_reference || null, notes: body.notes || null, ...totals,
  }).eq("id", id).eq("status", "draft").select().single();
  if (error || !po) throw createError({ statusCode: 400, statusMessage: error?.message || "Unable to update purchase order." });

  const { error: deleteError } = await s.from("accounting_purchase_order_lines").delete().eq("purchase_order_id", id);
  if (deleteError) throw createError({ statusCode: 500, statusMessage: deleteError.message });

  const rows = lines.map((x:any,n:number) => {
    const ex = Math.round(Number(x.quantity) * Number(x.unit_cost_ex_gst) * 100) / 100;
    return { purchase_order_id:id, product_id:x.product_id || null, description:String(x.description || "Item"), sku:x.sku || null,
      quantity:Number(x.quantity), unit_cost_ex_gst:Number(x.unit_cost_ex_gst), gst_amount:Math.round(ex*.1*100)/100,
      line_total:Math.round(ex*1.1*100)/100, sort_order:n };
  });
  const { error: lineError } = await s.from("accounting_purchase_order_lines").insert(rows);
  if (lineError) throw createError({ statusCode: 500, statusMessage: lineError.message });
  return po;
});
