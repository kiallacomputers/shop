import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const query = getQuery(event);
  let q = getAdminSupabase()
    .from("accounting_supplier_payments")
    .select("*,accounting_supplier_bills(bill_number,supplier_id,accounting_suppliers(name))")
    .order("created_at", { ascending: false });
  if (query.bill_id) q = q.eq("bill_id", Number(query.bill_id));
  const { data, error } = await q;
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data || [];
});
