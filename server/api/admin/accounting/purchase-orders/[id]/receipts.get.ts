import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid purchase order." });

  const s = getAdminSupabase();
  const { data: receipts, error } = await s
    .from("accounting_inventory_receipts")
    .select("id,purchase_order_id,received_date,supplier_reference,notes,created_at")
    .eq("purchase_order_id", id)
    .order("received_date", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const receiptIds = (receipts || []).map((x:any) => Number(x.id)).filter(Boolean);
  let lines:any[] = [];
  if (receiptIds.length) {
    const { data, error: lineError } = await s
      .from("accounting_inventory_receipt_lines")
      .select("id,receipt_id,purchase_order_line_id,product_id,quantity,unit_cost")
      .in("receipt_id", receiptIds)
      .order("id", { ascending: true });
    if (lineError) throw createError({ statusCode: 500, statusMessage: lineError.message });
    lines = data || [];
  }

  return (receipts || []).map((receipt:any) => ({
    ...receipt,
    lines: lines.filter((line:any) => Number(line.receipt_id) === Number(receipt.id))
  }));
});
