import { getAdminSupabase } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.id) throw createError({ statusCode: 401, statusMessage: "Login required." });
  const s = getAdminSupabase();
  const { data: customer } = await s.from("sales_customers").select("*").eq("auth_user_id", user.id).maybeSingle();
  if (!customer) return { customer: null, quotes: [], invoices: [], totals: { invoiced: 0, paid: 0, outstanding: 0 } };
  const [{ data: quotes }, { data: invoices }] = await Promise.all([
    s.from("manual_quotes").select("*,manual_quote_items(*)").eq("customer_id", customer.id).order("created_at", { ascending: false }),
    s.from("accounting_invoices").select("*,accounting_invoice_lines(*)").eq("customer_id", customer.id).order("invoice_date", { ascending: false })
  ]);
  const rows = invoices || [];
  return { customer, quotes: quotes || [], invoices: rows, totals: { invoiced: rows.reduce((n: number, x: any) => n + Number(x.total || 0), 0), paid: rows.reduce((n: number, x: any) => n + Number(x.paid_amount || 0), 0), outstanding: rows.reduce((n: number, x: any) => n + Number(x.total || 0) - Number(x.paid_amount || 0), 0) } };
});
