import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0), r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
const revenueStatuses=new Set(['paid','processing','shipping','delivered']);
const missing=(e:any)=>['42P01','PGRST205'].includes(String(e?.code||''));
export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event); const s=getAdminSupabase(), q=getQuery(event), now=new Date();
  const fy=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
  const start=String(q.start||`${fy}-07-01`), end=String(q.end||`${fy+1}-06-30`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end) throw createError({statusCode:400,statusMessage:'Valid start and end dates are required.'});
  const sd=new Date(start+'T00:00:00'), ed=new Date(end+'T00:00:00'), days=Math.max(1,Math.round((ed.getTime()-sd.getTime())/86400000)+1);
  const prevEnd=new Date(sd); prevEnd.setDate(prevEnd.getDate()-1); const prevStart=new Date(prevEnd); prevStart.setDate(prevStart.getDate()-days+1);
  const iso=(d:Date)=>d.toISOString().slice(0,10), pStart=iso(prevStart), pEnd=iso(prevEnd), today=iso(now);
  async function sales(a:string,b:string){
    const er=new Date(b+'T00:00:00'); er.setDate(er.getDate()+1);
    const or=await s.from('orders').select('id,total,status,created_at').gte('created_at',a+'T00:00:00').lt('created_at',er.toISOString()).limit(10000);
    if(or.error) throw createError({statusCode:500,statusMessage:or.error.message}); const orders=(or.data||[]).filter((x:any)=>revenueStatuses.has(String(x.status||'').toLowerCase()));
    const ids=orders.map((x:any)=>Number(x.id)); let revenue=0,cogs=0,units=0;
    for(let i=0;i<ids.length;i+=250){const part=ids.slice(i,i+250);if(!part.length)continue;const ir=await s.from('order_items').select('order_id,product_id,quantity,price').in('order_id',part);if(ir.error)throw createError({statusCode:500,statusMessage:ir.error.message});for(const x of ir.data||[]){units+=n(x.quantity);revenue+=n(x.quantity)*n(x.price)/1.1}}
    const mr=await s.from('accounting_inventory_movements').select('total_cost,quantity').eq('movement_type','sale').gte('movement_date',a).lte('movement_date',b).limit(20000); if(!mr.error)cogs=(mr.data||[]).reduce((z:any,x:any)=>z+Math.abs(n(x.total_cost)),0);
    return {orders:orders.length,units:r(units),revenue:r(revenue),cogs:r(cogs),gross_profit:r(revenue-cogs),margin:revenue?r((revenue-cogs)/revenue*100):0,average_order:orders.length?r(revenue/orders.length):0};
  }
  const [cur,prev,invR,billR,prodR,bankR,poR,linesR]=await Promise.all([
    sales(start,end),sales(pStart,pEnd),
    s.from('accounting_invoices').select('*').limit(5000), s.from('accounting_supplier_bills').select('*').limit(5000),
    s.from('products').select('id,name,stock,buy_price_ex_gst,active').eq('active',true), s.from('accounting_bank_transactions').select('status,amount,transaction_date').limit(10000),
    s.from('accounting_purchase_orders').select('id,status,total').in('status',['draft','sent','ordered','part_received']).limit(5000),
    s.from('accounting_journal_lines').select('debit,credit,accounting_accounts(code,name,account_type),accounting_journals!inner(journal_date,status)').eq('accounting_journals.status','posted').gte('accounting_journals.journal_date',start).lte('accounting_journals.journal_date',end).limit(20000)
  ]);
  for(const x of [invR,billR,prodR,linesR]) if(x.error&&!missing(x.error)) throw createError({statusCode:500,statusMessage:x.error.message});
  const balance=(x:any)=>Math.max(0,n(x.total)-n(x.paid_amount)), invoices=invR.data||[], bills=billR.data||[], products=prodR.data||[];
  const ar=invoices.filter((x:any)=>balance(x)>.005), ap=bills.filter((x:any)=>balance(x)>.005), overdueAR=ar.filter((x:any)=>String(x.due_date||x.invoice_date||'9999')<today), overdueAP=ap.filter((x:any)=>String(x.due_date||'9999')<today);
  const inventory=r(products.reduce((a:any,x:any)=>a+Math.max(0,n(x.stock))*n(x.buy_price_ex_gst),0));
  let income=0,expenses=0; const monthly=new Map<string,any>();
  for(const x of linesR.data||[]){const a:any=(x as any).accounting_accounts,j:any=(x as any).accounting_journals;if(!a||!j)continue;const t=String(a.account_type||'').toLowerCase(), key=String(j.journal_date).slice(0,7);const m=monthly.get(key)||{month:key,income:0,expenses:0};if(['income','revenue'].includes(t)){const v=n((x as any).credit)-n((x as any).debit);income+=v;m.income+=v}else if(['expense','cost_of_sales','cost of sales','cogs'].includes(t)){const v=n((x as any).debit)-n((x as any).credit);expenses+=v;m.expenses+=v}monthly.set(key,m)}
  const change=(a:number,b:number)=>b? r((a-b)/Math.abs(b)*100):(a?100:0);
  const attention:any[]=[]; const arBal=r(ar.reduce((a:any,x:any)=>a+balance(x),0)), apBal=r(ap.reduce((a:any,x:any)=>a+balance(x),0)), odar=r(overdueAR.reduce((a:any,x:any)=>a+balance(x),0)), odap=r(overdueAP.reduce((a:any,x:any)=>a+balance(x),0));
  if(odar)attention.push({level:'high',label:'Overdue customer invoices',value:odar,to:'/admin/accounting/receivables'}); if(odap)attention.push({level:'high',label:'Overdue supplier bills',value:odap,to:'/admin/accounting/payables'});
  const unreconciled=(bankR.error?[]:bankR.data||[]).filter((x:any)=>String(x.status||'').toLowerCase()!=='reconciled').length;if(unreconciled)attention.push({level:'medium',label:'Bank transactions to reconcile',count:unreconciled,to:'/admin/accounting/bank-reconciliation'});
  return {period:{start,end,previous_start:pStart,previous_end:pEnd},sales:{...cur,revenue_change_pct:change(cur.revenue,prev.revenue),profit_change_pct:change(cur.gross_profit,prev.gross_profit),orders_change_pct:change(cur.orders,prev.orders)},previous_sales:prev,accounting:{income:r(income),expenses:r(expenses),net_profit:r(income-expenses)},position:{receivables:arBal,overdue_receivables:odar,payables:apBal,overdue_payables:odap,inventory_value:inventory,unreconciled_bank:unreconciled,open_purchase_orders:poR.error?0:(poR.data||[]).length},monthly:[...monthly.values()].sort((a,b)=>a.month.localeCompare(b.month)).map(x=>({...x,income:r(x.income),expenses:r(x.expenses),profit:r(x.income-x.expenses)})),attention};
});
