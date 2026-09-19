import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const s = getAdminSupabase();

  const { data, error } = await s
    .from("accounting_purchase_orders")
    .select("*,accounting_suppliers(name),accounting_purchase_order_lines(*)")
    .order("order_date", { ascending: false });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const rows: any[] = data || [];
  const poIds = rows.map((p:any) => Number(p.id)).filter(Boolean);
  const lineIds = rows.flatMap((p:any) => (p.accounting_purchase_order_lines || []).map((l:any) => Number(l.id))).filter(Boolean);

  const received = new Map<number, number>();
  if (lineIds.length) {
    const { data: r, error: re } = await s
      .from("accounting_inventory_receipt_lines")
      .select("purchase_order_line_id,quantity")
      .in("purchase_order_line_id", lineIds);
    if (re && re.code !== "42P01") throw createError({ statusCode: 500, statusMessage: re.message });
    for (const x of r || []) {
      received.set(Number(x.purchase_order_line_id), (received.get(Number(x.purchase_order_line_id)) || 0) + Number(x.quantity || 0));
    }
  }

  // A supplier bill is the authoritative indication that a PO has already been converted.
  // This also handles older POs whose status was not changed to `billed` after bill creation.
  const bills = new Map<number, any>();
  if (poIds.length) {
    const { data: billRows, error: billError } = await s
      .from("accounting_supplier_bills")
      .select("id,purchase_order_id,bill_number,status")
      .in("purchase_order_id", poIds);
    if (billError) throw createError({ statusCode: 500, statusMessage: billError.message });
    for (const bill of billRows || []) {
      if (bill.purchase_order_id) bills.set(Number(bill.purchase_order_id), bill);
    }
  }

  return rows.map((p:any) => {
    const bill = bills.get(Number(p.id));
    return {
      ...p,
      bill_id: bill?.id || null,
      bill_number: bill?.bill_number || null,
      bill_status: bill?.status || null,
      is_billed: Boolean(bill),
      accounting_purchase_order_lines: (p.accounting_purchase_order_lines || []).map((l:any) => ({
        ...l,
        received_quantity: received.get(Number(l.id)) || 0,
        remaining_quantity: Math.max(0, Number(l.quantity || 0) - (received.get(Number(l.id)) || 0))
      }))
    };
  });
});
