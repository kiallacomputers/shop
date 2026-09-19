import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0); const r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
const missing=(e:any)=>["42P01","PGRST205"].includes(String(e?.code||""));
export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event); const s=getAdminSupabase(); const now=new Date();
  const today=now.toISOString().slice(0,10); const fy=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
  const fyStart=`${fy}-07-01`, fyEnd=`${fy+1}-06-30`;
  const monthStart=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const [invR,billR,prodR,bankR,journalR,linesR,healthR]=await Promise.all([
    s.from('accounting_invoices').select('*').order('invoice_date',{ascending:false}).limit(500),
    s.from('accounting_supplier_bills').select('*,accounting_suppliers(name)').order('bill_date',{ascending:false}).limit(500),
    s.from('products').select('id,name,product_code,stock,buy_price_ex_gst,active'),
    s.from('accounting_bank_transactions').select('*').order('transaction_date',{ascending:false}).limit(1000),
    s.from('accounting_journals').select('*').eq('status','posted').order('journal_date',{ascending:false}).order('id',{ascending:false}).limit(12),
    s.from('accounting_journal_lines').select('debit,credit,accounting_accounts(code,name,account_type),accounting_journals!inner(journal_date,status)').eq('accounting_journals.status','posted').gte('accounting_journals.journal_date',fyStart).lte('accounting_journals.journal_date',fyEnd),
    s.from('accounting_periods').select('id').limit(1)
  ]);
  for(const x of [invR,billR,prodR,journalR,linesR]) if(x.error&&!missing(x.error)) throw createError({statusCode:500,statusMessage:x.error.message});
  if(bankR.error&&!missing(bankR.error)) throw createError({statusCode:500,statusMessage:bankR.error.message});
  const invoices:any[]=invR.data||[], bills:any[]=billR.data||[], products:any[]=prodR.data||[], bank:any[]=bankR.data||[];
  const balance=(x:any)=>Math.max(0,n(x.total)-n(x.paid_amount));
  const ar=invoices.filter(x=>balance(x)>0.005), ap=bills.filter(x=>balance(x)>0.005);
  const overdueInv=ar.filter(x=>x.due_date?String(x.due_date)<today:String(x.invoice_date)<today);
  const overdueBills=ap.filter(x=>x.due_date&&String(x.due_date)<today);
  const inventoryValue=r(products.reduce((a,x)=>a+Math.max(0,n(x.stock))*n(x.buy_price_ex_gst),0));
  const monthly=new Map<string,{month:string,income:number,expenses:number,cogs:number}>(); let fyIncome=0,fyExpense=0,fyCogs=0,monthIncome=0,monthExpense=0;
  for(const x of (linesR.data||[]) as any[]){const a:any=x.accounting_accounts,j:any=x.accounting_journals;if(!a||!j)continue;const type=String(a.account_type||'').toLowerCase(),code=String(a.code||'');const income=['income','revenue'].includes(type);const expense=['expense','cost_of_sales','cost of sales','cogs'].includes(type);if(!income&&!expense)continue;const amt=income?n(x.credit)-n(x.debit):n(x.debit)-n(x.credit);const cogs=expense&&(['cost_of_sales','cost of sales','cogs'].includes(type)||code==='5000'||/cost of goods|cogs/i.test(String(a.name||'')));const key=String(j.journal_date).slice(0,7);const m=monthly.get(key)||{month:key,income:0,expenses:0,cogs:0};if(income){m.income+=amt;fyIncome+=amt;if(String(j.journal_date)>=monthStart)monthIncome+=amt}else if(cogs){m.cogs+=amt;fyCogs+=amt;if(String(j.journal_date)>=monthStart)monthExpense+=amt}else{m.expenses+=amt;fyExpense+=amt;if(String(j.journal_date)>=monthStart)monthExpense+=amt}monthly.set(key,m)}
  const bankUnreconciled=bank.filter(x=>String(x.status||'').toLowerCase()!=='reconciled');
  return {period:{fy_start:fyStart,fy_end:fyEnd,month_start:monthStart,today},summary:{receivables:r(ar.reduce((a,x)=>a+balance(x),0)),payables:r(ap.reduce((a,x)=>a+balance(x),0)),overdue_receivables:r(overdueInv.reduce((a,x)=>a+balance(x),0)),overdue_payables:r(overdueBills.reduce((a,x)=>a+balance(x),0)),inventory_value:inventoryValue,fy_income:r(fyIncome),fy_expenses:r(fyExpense+fyCogs),fy_profit:r(fyIncome-fyExpense-fyCogs),month_income:r(monthIncome),month_expenses:r(monthExpense),month_profit:r(monthIncome-monthExpense),unreconciled_bank:bankUnreconciled.length},monthly:[...monthly.values()].sort((a,b)=>a.month.localeCompare(b.month)).map(x=>({...x,income:r(x.income),expenses:r(x.expenses+x.cogs),profit:r(x.income-x.expenses-x.cogs)})),overdue_invoices:overdueInv.slice(0,5).map(x=>({id:x.id,number:x.invoice_number,customer:x.customer_name||x.customer_email||'Customer',due_date:x.due_date||x.invoice_date,balance:r(balance(x))})),overdue_bills:overdueBills.slice(0,5).map(x=>({id:x.id,number:x.bill_number,supplier:x.accounting_suppliers?.name||'Supplier',due_date:x.due_date,balance:r(balance(x))})),recent_journals:(journalR.data||[]).slice(0,8),bank_available:!bankR.error,periods_available:!healthR.error};
});
