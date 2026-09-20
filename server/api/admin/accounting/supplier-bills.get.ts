import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const s = getAdminSupabase();

  const { data, error } = await s
    .from("accounting_supplier_bills")
    .select("*,accounting_suppliers(name),accounting_supplier_bill_lines(*)")
    .order("bill_date", { ascending: false });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const bills: any[] = data || [];
  const billIds = bills.map((b:any) => Number(b.id)).filter(Boolean);
  const poIds = [...new Set(bills.map((b:any) => Number(b.purchase_order_id)).filter(Boolean))];

  const paymentsByBill = new Map<number, any[]>();
  if (billIds.length) {
    const { data: payments, error: pe } = await s
      .from("accounting_supplier_payments")
      .select("id,bill_id,amount,reference,journal_id,created_at")
      .in("bill_id", billIds)
      .order("created_at", { ascending: false });
    if (pe) throw createError({ statusCode: 500, statusMessage: pe.message });
    for (const payment of payments || []) {
      const id = Number(payment.bill_id);
      paymentsByBill.set(id, [...(paymentsByBill.get(id) || []), payment]);
    }
  }

  const poById = new Map<number, any>();
  if (poIds.length) {
    const { data: pos, error: poe } = await s
      .from("accounting_purchase_orders")
      .select("id,po_number,status,order_date,expected_date,total")
      .in("id", poIds);
    if (poe) throw createError({ statusCode: 500, statusMessage: poe.message });
    for (const po of pos || []) poById.set(Number(po.id), po);
  }

  return bills.map((bill:any) => ({
    ...bill,
    purchase_order: bill.purchase_order_id ? poById.get(Number(bill.purchase_order_id)) || null : null,
    payments: paymentsByBill.get(Number(bill.id)) || []
  }));
});
