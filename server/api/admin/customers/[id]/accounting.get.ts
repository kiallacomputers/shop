import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid customer." });
  const s = getAdminSupabase();
  const [{ data: customer, error: ce }, { data: quotes, error: qe }, { data: invoices, error: ie }] = await Promise.all([
    s.from("sales_customers").select("*").eq("id", id).single(),
    s.from("manual_quotes").select("*,manual_quote_items(*)").eq("customer_id", id).order("created_at", { ascending: false }),
    s.from("accounting_invoices").select("*,accounting_invoice_lines(*)").eq("customer_id", id).order("invoice_date", { ascending: false })
  ]);
  if (ce || qe || ie) throw createError({ statusCode: 500, statusMessage: (ce || qe || ie)?.message });
  const rows = invoices || [];
  const outstanding = rows.reduce((n: number, x: any) => n + Number(x.total || 0) - Number(x.paid_amount || 0), 0);
  return { customer, quotes: quotes || [], invoices: rows, totals: { invoiced: rows.reduce((n: number, x: any) => n + Number(x.total || 0), 0), paid: rows.reduce((n: number, x: any) => n + Number(x.paid_amount || 0), 0), outstanding } };
});
