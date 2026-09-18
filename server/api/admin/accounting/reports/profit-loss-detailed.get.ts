import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0); const r2=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
const monthKey=(d:string)=>String(d||'').slice(0,7);
export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event); const q=getQuery(event); const now=new Date();
  const start=String(q.start||`${now.getFullYear()}-07-01`), end=String(q.end||now.toISOString().slice(0,10)); const s=getAdminSupabase();
  const {data,error}=await s.from('accounting_journal_lines').select('id,description,debit,credit,accounting_accounts(id,code,name,account_type),accounting_journals!inner(id,journal_date,status,reference,description,source_type,source_id)').eq('accounting_journals.status','posted').gte('accounting_journals.journal_date',start).lte('accounting_journals.journal_date',end).order('id');
  if(error) throw createError({statusCode:500,statusMessage:error.message});
  const map=new Map<string,any>(); const months=new Map<string,{income:number,cogs:number,operating_expenses:number}>(); const transactions:any[]=[];
  for(const line of data||[]){ const a:any=(line as any).accounting_accounts; const j:any=(line as any).accounting_journals; if(!a||!j)continue; const type=String(a.account_type||'').toLowerCase(); const code=String(a.code||'');
    const isIncome=['income','revenue'].includes(type); const isExpense=['expense','cost_of_sales','cost of sales','cogs'].includes(type); if(!isIncome&&!isExpense)continue;
    const raw=isIncome?n((line as any).credit)-n((line as any).debit):n((line as any).debit)-n((line as any).credit);
    const isCogs=isExpense && (['cost_of_sales','cost of sales','cogs'].includes(type)||code==='5000'||/cost of goods|cogs/i.test(String(a.name||'')));
    const group=isIncome?'income':isCogs?'cogs':'operating_expenses'; const key=String(a.id); const row=map.get(key)||{id:a.id,code:a.code,name:a.name,account_type:type,group,amount:0}; row.amount+=raw; map.set(key,row);
    const mk=monthKey(j.journal_date); const m=months.get(mk)||{income:0,cogs:0,operating_expenses:0}; m[group]+=raw; months.set(mk,m);
    transactions.push({id:(line as any).id,date:j.journal_date,reference:j.reference,description:(line as any).description||j.description,account_code:a.code,account_name:a.name,group,amount:r2(raw),journal_id:j.id,source_type:j.source_type,source_id:j.source_id});
  }
  const rows=[...map.values()].map(x=>({...x,amount:r2(x.amount)})).sort((a,b)=>String(a.code).localeCompare(String(b.code)));
  const income=r2(rows.filter(x=>x.group==='income').reduce((s,x)=>s+x.amount,0)); const cogs=r2(rows.filter(x=>x.group==='cogs').reduce((s,x)=>s+x.amount,0)); const grossProfit=r2(income-cogs); const operatingExpenses=r2(rows.filter(x=>x.group==='operating_expenses').reduce((s,x)=>s+x.amount,0)); const netProfit=r2(grossProfit-operatingExpenses);
  const monthly=[...months.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([month,m])=>({month,income:r2(m.income),cogs:r2(m.cogs),gross_profit:r2(m.income-m.cogs),operating_expenses:r2(m.operating_expenses),net_profit:r2(m.income-m.cogs-m.operating_expenses)}));
  return {period:{start,end},summary:{income,cogs,gross_profit:grossProfit,operating_expenses:operatingExpenses,net_profit:netProfit,gross_margin_percent:income?r2(grossProfit/income*100):0},rows,monthly,transactions:transactions.sort((a,b)=>String(b.date).localeCompare(String(a.date)))};
});
