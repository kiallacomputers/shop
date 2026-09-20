import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid purchase order." });
  const s = getAdminSupabase();
  const { data: po, error } = await s.from("accounting_purchase_orders")
    .select("*,accounting_suppliers(*),accounting_purchase_order_lines(*)").eq("id", id).single();
  if (error || !po) throw createError({ statusCode: 404, statusMessage: "Purchase order not found." });

  const lines:any[] = po.accounting_purchase_order_lines || [];
  const lineIds = lines.map(x => Number(x.id)).filter(Boolean);
  let receiptLines:any[] = [];
  if (lineIds.length) {
    const { data, error: re } = await s.from("accounting_inventory_receipt_lines")
      .select("*,accounting_inventory_receipts(*)").in("purchase_order_line_id", lineIds);
    if (re && re.code !== "42P01") throw createError({ statusCode: 500, statusMessage: re.message });
    receiptLines = data || [];
  }
  const received = new Map<number,number>();
  for (const r of receiptLines) received.set(Number(r.purchase_order_line_id), (received.get(Number(r.purchase_order_line_id)) || 0) + Number(r.quantity || 0));

  const { data: billRows, error: be } = await s.from("accounting_supplier_bills")
    .select("*,accounting_supplier_bill_lines(*)").eq("purchase_order_id", id).limit(1);
  if (be) throw createError({ statusCode: 500, statusMessage: be.message });
  const bill:any = billRows?.[0] || null;
  let payments:any[] = [];
  if (bill?.id) {
    const { data, error: pe } = await s.from("accounting_supplier_payments").select("*").eq("bill_id", bill.id).order("created_at", { ascending:false });
    if (pe) throw createError({ statusCode: 500, statusMessage: pe.message });
    payments = data || [];
  }

  const receiptsById = new Map<number,any>();
  for (const x of receiptLines) if (x.accounting_inventory_receipts?.id) receiptsById.set(Number(x.accounting_inventory_receipts.id), x.accounting_inventory_receipts);
  const receipts = [...receiptsById.values()].sort((a:any,b:any)=>String(b.received_date||'').localeCompare(String(a.received_date||'')));

  return {
    ...po,
    accounting_purchase_order_lines: lines.map(l => ({...l, received_quantity: received.get(Number(l.id)) || 0, remaining_quantity: Math.max(0, Number(l.quantity||0) - (received.get(Number(l.id)) || 0))})),
    receipts,
    receipt_lines: receiptLines,
    bill,
    payments,
  };
});
