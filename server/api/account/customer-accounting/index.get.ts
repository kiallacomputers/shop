import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
import { quoteTotals } from "~~/server/utils/manualQuote";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const db = getAdminSupabase();

  const { data: customer, error: customerError } = await db
    .from("sales_customers")
    .select("id,full_name,company_name,email,phone,auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) throw createError({ statusCode: 500, statusMessage: customerError.message });
  if (!customer) return { linked: false, customer: null, manualQuotes: [], invoices: [], balance: 0 };

  const [quotesResult, invoicesResult] = await Promise.all([
    db.from("manual_quotes")
      .select("id,quote_number,status,issue_date,expires_at,public_token,sent_at,accepted_at,customer_responded_at,delivery_amount,discount_amount,manual_quote_items(id,product_name,description,sku,quantity,unit_price,discount_percent,sort_order)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
    db.from("accounting_invoices")
      .select("id,invoice_number,invoice_date,status,subtotal,gst_amount,total,paid_amount,payment_method,payment_reference,accounting_invoice_lines(id,description,sku,quantity,unit_price,line_total,gst_amount,sort_order)")
      .eq("customer_user_id", user.id)
      .order("invoice_date", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  if (quotesResult.error) throw createError({ statusCode: 500, statusMessage: quotesResult.error.message });
  if (invoicesResult.error) throw createError({ statusCode: 500, statusMessage: invoicesResult.error.message });

  const manualQuotes = (quotesResult.data || []).map((quote: any) => ({
    ...quote,
    manual_quote_items: (quote.manual_quote_items || []).sort((a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    totals: quoteTotals(quote),
  }));
  const invoices = invoicesResult.data || [];
  const balance = invoices.reduce((sum: number, invoice: any) => sum + Math.max(0, Number(invoice.total || 0) - Number(invoice.paid_amount || 0)), 0);

  return { linked: true, customer, manualQuotes, invoices, balance };
});
