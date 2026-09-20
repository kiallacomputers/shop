import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event), from=String(q.from||""), to=String(q.to||"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to) throw createError({statusCode:400,statusMessage:"Valid From and To dates are required."});
  const s=getAdminSupabase();
  const [journals, bank, invoices, bills] = await Promise.all([
    s.from("accounting_journals").select("id,status,journal_date").gte("journal_date",from).lte("journal_date",to),
    s.from("accounting_bank_transactions").select("id,status,transaction_date").gte("transaction_date",from).lte("transaction_date",to),
    s.from("accounting_invoices").select("id,status,total,paid_amount,invoice_date").lte("invoice_date",to),
    s.from("accounting_supplier_bills").select("id,status,total,paid_amount,bill_date").lte("bill_date",to),
  ]);
  for(const r of [journals,bank,invoices,bills]) if(r.error && !["42P01","PGRST205"].includes((r.error as any).code)) throw createError({statusCode:500,statusMessage:r.error.message});
  const j=(journals.data||[]) as any[], bt=(bank.data||[]) as any[], inv=(invoices.data||[]) as any[], sb=(bills.data||[]) as any[];
  const unposted=j.filter(x=>String(x.status||"").toLowerCase()!=="posted").length;
  const unreconciled=bt.filter(x=>String(x.status||"").toLowerCase()!=="reconciled").length;
  const receivables=inv.filter(x=>Number(x.total||0)-Number(x.paid_amount||0)>0.005).reduce((a,x)=>a+Number(x.total||0)-Number(x.paid_amount||0),0);
  const payables=sb.filter(x=>Number(x.total||0)-Number(x.paid_amount||0)>0.005).reduce((a,x)=>a+Number(x.total||0)-Number(x.paid_amount||0),0);
  return {from,to,unposted_journals:unposted,unreconciled_bank_transactions:unreconciled,outstanding_receivables:Math.round(receivables*100)/100,outstanding_payables:Math.round(payables*100)/100,can_close:unposted===0};
});
