import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { createPostedJournal } from "~~/server/utils/accounting";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

async function systemAccount(key: string) {
  const { data, error } = await getAdminSupabase()
    .from("accounting_accounts")
    .select("id,code,name")
    .eq("system_key", key)
    .single();
  if (error || !data) throw new Error(`Accounting system account '${key}' is missing.`);
  return data;
}

export async function postManualQuoteToAccounting(quoteId: number) {
  const s = getAdminSupabase();
  const reference = `manual-quote:${quoteId}`;

  const { data: existing, error: existingError } = await s
    .from("accounting_invoices")
    .select("id,invoice_number,journal_id,status,total")
    .eq("payment_reference", reference)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { invoice: existing, alreadyPosted: true };

  const { data: quote, error: quoteError } = await s
    .from("manual_quotes")
    .select("id,quote_number,customer_id,issue_date,delivery_method,delivery_amount,discount_amount,manual_quote_items(*),sales_customers(full_name,company_name,email,auth_user_id)")
    .eq("id", quoteId)
    .single();
  if (quoteError || !quote) throw quoteError || new Error("Manual quote not found.");

  const customer: any = Array.isArray(quote.sales_customers) ? quote.sales_customers[0] : quote.sales_customers;
  const items = Array.isArray(quote.manual_quote_items) ? quote.manual_quote_items : [];
  if (!items.length) throw new Error("The quote has no line items.");

  const itemRows = items.map((item: any, index: number) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || 0) * (1 - Number(item.discount_percent || 0) / 100);
    const lineTotal = round(quantity * unitPrice);
    return {
      description: item.product_name || item.description || "Quote item",
      sku: item.sku || null,
      product_id: item.product_id || null,
      quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      gst_amount: round(lineTotal / 11),
      sort_order: index,
    };
  });

  const delivery = round(Number(quote.delivery_amount || 0));
  const discount = round(Number(quote.discount_amount || 0));
  if (delivery > 0) itemRows.push({ description: quote.delivery_method === "pickup" ? "Store Pickup" : "Delivery", sku: null, product_id: null, quantity: 1, unit_price: delivery, line_total: delivery, gst_amount: round(delivery / 11), sort_order: itemRows.length });
  if (discount > 0) itemRows.push({ description: "Quote Discount", sku: null, product_id: null, quantity: 1, unit_price: -discount, line_total: -discount, gst_amount: round(-discount / 11), sort_order: itemRows.length });

  const total = round(itemRows.reduce((sum, row) => sum + row.line_total, 0));
  if (total <= 0) throw new Error("The quote total must be greater than zero.");
  const gst = round(total / 11);
  const subtotal = round(total - gst);

  const [receivables, sales, gstCollected] = await Promise.all([
    systemAccount("accounts_receivable"),
    systemAccount("sales_revenue"),
    systemAccount("gst_collected"),
  ]);

  const journal = await createPostedJournal({
    journal_date: String(quote.issue_date || new Date().toISOString()).slice(0, 10),
    reference: quote.quote_number || reference,
    description: `Manual quote ${quote.quote_number || quoteId}`,
    source_type: "manual_quote",
    source_id: String(quoteId),
    lines: [
      { account_id: receivables.id, debit: total, credit: 0, description: "Accounts receivable" },
      { account_id: sales.id, debit: 0, credit: subtotal, description: "Sales revenue ex GST" },
      { account_id: gstCollected.id, debit: 0, credit: gst, description: "GST collected" },
    ],
  });

  const { data: invoice, error: invoiceError } = await s
    .from("accounting_invoices")
    .insert({
      order_id: null,
      customer_user_id: customer?.auth_user_id || null,
      customer_name: customer?.company_name ? `${customer.full_name} - ${customer.company_name}` : customer?.full_name || "Manual quote customer",
      customer_email: customer?.email || null,
      invoice_date: String(quote.issue_date || new Date().toISOString()).slice(0, 10),
      status: "unpaid",
      subtotal,
      gst_amount: gst,
      total,
      paid_amount: 0,
      payment_method: null,
      payment_reference: reference,
      journal_id: journal.id,
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    await s.from("accounting_journals").delete().eq("id", journal.id);
    throw invoiceError || new Error("Accounting invoice creation failed.");
  }

  const lines = itemRows.map((row: any) => ({ invoice_id: invoice.id, ...row }));
  const { error: linesError } = await s.from("accounting_invoice_lines").insert(lines);
  if (linesError) {
    await s.from("accounting_invoices").delete().eq("id", invoice.id);
    await s.from("accounting_journals").delete().eq("id", journal.id);
    throw linesError;
  }

  return { invoice, alreadyPosted: false };
}
