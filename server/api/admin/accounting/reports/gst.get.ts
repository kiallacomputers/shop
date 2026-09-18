import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const n = (v: any) => Number(v || 0);
const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event);
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(Math.floor(now.getMonth() / 3) * 3 + 1).padStart(2, "0")}-01`;
  const defaultEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0).toISOString().slice(0, 10);
  const start = String(q.start || defaultStart);
  const end = String(q.end || defaultEnd);
  const s = getAdminSupabase();

  const [{ data: invoices, error: ie }, { data: bills, error: be }] = await Promise.all([
    s.from("accounting_invoices").select("id,invoice_number,invoice_date,status,subtotal,gst_amount,total").gte("invoice_date", start).lte("invoice_date", end).order("invoice_date"),
    s.from("accounting_supplier_bills").select("id,supplier_invoice_number,bill_date,status,subtotal,gst_amount,total,accounting_suppliers(name)").gte("bill_date", start).lte("bill_date", end).order("bill_date"),
  ]);
  if (ie || be) throw createError({ statusCode: 500, statusMessage: (ie || be)?.message });

  const sales = (invoices || []).filter((x: any) => !["draft", "void", "cancelled"].includes(String(x.status || "").toLowerCase()));
  const purchases = (bills || []).filter((x: any) => !["draft", "void", "cancelled"].includes(String(x.status || "").toLowerCase()));
  const salesTotal = money(sales.reduce((a: number, x: any) => a + n(x.total), 0));
  const gstCollected = money(sales.reduce((a: number, x: any) => a + n(x.gst_amount), 0));
  const purchasesTotal = money(purchases.reduce((a: number, x: any) => a + n(x.total), 0));
  const gstCredits = money(purchases.reduce((a: number, x: any) => a + n(x.gst_amount), 0));

  return {
    period: { start, end, basis: "accrual" },
    summary: {
      g1_total_sales: salesTotal,
      g10_capital_purchases: 0,
      g11_non_capital_purchases: purchasesTotal,
      gst_collected: gstCollected,
      gst_credits: gstCredits,
      estimated_net_gst: money(gstCollected - gstCredits),
      sales_ex_gst: money(salesTotal - gstCollected),
      purchases_ex_gst: money(purchasesTotal - gstCredits),
    },
    sales,
    purchases,
    note: "Management BAS estimate from posted/non-draft accounting invoices and supplier bills. Capital purchases and special GST treatments require tax coding before lodgement.",
  };
});
