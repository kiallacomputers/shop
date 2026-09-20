import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

type Issue = { key:string; severity:"error"|"warning"|"info"; title:string; detail:string; count:number; amount?:number; route?:string };
const missing = (e:any) => ["42P01","PGRST205"].includes(String(e?.code||""));
const n = (v:any) => Number(v || 0);

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const s = getAdminSupabase();
  const issues:Issue[]=[];

  // 1. Unbalanced posted journals (the most important integrity check).
  const {data:lines,error:le}=await s.from("accounting_journal_lines")
    .select("journal_id,debit,credit,accounting_journals!inner(id,status,journal_date,reference)")
    .eq("accounting_journals.status","posted");
  if(le) throw createError({statusCode:500,statusMessage:le.message});
  const totals=new Map<string,{d:number,c:number}>();
  for(const x of (lines||[]) as any[]){ const k=String(x.journal_id); const t=totals.get(k)||{d:0,c:0}; t.d+=n(x.debit);t.c+=n(x.credit);totals.set(k,t); }
  const unbalanced=[...totals.values()].filter(x=>Math.abs(x.d-x.c)>0.005);
  if(unbalanced.length) issues.push({key:"unbalanced",severity:"error",title:"Unbalanced posted journals",detail:"Posted journals where total debits do not equal total credits.",count:unbalanced.length,route:"/admin/accounting/journals"});

  // 2. Unposted journals.
  const {data:journals,error:je}=await s.from("accounting_journals").select("id,status,journal_date");
  if(je) throw createError({statusCode:500,statusMessage:je.message});
  const unposted=(journals||[]).filter((x:any)=>String(x.status||"").toLowerCase()!=="posted");
  if(unposted.length) issues.push({key:"unposted",severity:"warning",title:"Unposted journals",detail:"Draft or otherwise unposted journals are excluded from financial statements.",count:unposted.length,route:"/admin/accounting/journals"});

  // 3. Negative stock.
  const {data:products,error:pe}=await s.from("products").select("id,name,stock").lt("stock",0);
  if(pe && !missing(pe)) throw createError({statusCode:500,statusMessage:pe.message});
  if((products||[]).length) issues.push({key:"negative_stock",severity:"error",title:"Negative inventory",detail:"Products with stock below zero need investigation.",count:(products||[]).length,route:"/admin/accounting/inventory"});

  // 4. Inventory movements without journals where a financial posting is expected.
  const {data:moves,error:me}=await s.from("accounting_inventory_movements").select("id,movement_type,journal_id,total_cost");
  if(!me){
    const bad=(moves||[]).filter((x:any)=>["sale","purchase","adjustment_in","adjustment_out"].includes(String(x.movement_type)) && n(x.total_cost)>0 && !x.journal_id);
    if(bad.length) issues.push({key:"inventory_no_journal",severity:"warning",title:"Inventory movements without journals",detail:"Cost-bearing inventory movements that are not linked to an accounting journal.",count:bad.length,amount:bad.reduce((a:any,x:any)=>a+n(x.total_cost),0),route:"/admin/accounting/inventory"});
  } else if(!missing(me)) throw createError({statusCode:500,statusMessage:me.message});

  // 5. Unreconciled bank transactions.
  const {data:bank,error:be}=await s.from("accounting_bank_transactions").select("id,status,amount");
  if(!be){
    const open=(bank||[]).filter((x:any)=>String(x.status||"").toLowerCase()!=="reconciled");
    if(open.length) issues.push({key:"unreconciled_bank",severity:"warning",title:"Unreconciled bank transactions",detail:"Imported bank transactions still waiting for reconciliation.",count:open.length,route:"/admin/accounting/bank-reconciliation"});
  } else if(!missing(be)) throw createError({statusCode:500,statusMessage:be.message});

  // 6. Customer invoices with impossible paid balances.
  const {data:inv,error:ie}=await s.from("accounting_invoices").select("id,total,paid_amount,status");
  if(!ie){
    const over=(inv||[]).filter((x:any)=>n(x.paid_amount)>n(x.total)+0.005 || n(x.paid_amount)<-0.005);
    if(over.length) issues.push({key:"invoice_paid_mismatch",severity:"error",title:"Invoice payment balance problems",detail:"Invoices where paid amount is negative or greater than invoice total.",count:over.length,route:"/admin/accounting/invoices"});
  } else if(!missing(ie)) throw createError({statusCode:500,statusMessage:ie.message});

  // 7. Supplier bills with impossible paid balances.
  const {data:bills,error:se}=await s.from("accounting_supplier_bills").select("id,total,paid_amount,status");
  if(!se){
    const over=(bills||[]).filter((x:any)=>n(x.paid_amount)>n(x.total)+0.005 || n(x.paid_amount)<-0.005);
    if(over.length) issues.push({key:"bill_paid_mismatch",severity:"error",title:"Supplier bill payment balance problems",detail:"Bills where paid amount is negative or greater than bill total.",count:over.length,route:"/admin/accounting/payables"});
  } else if(!missing(se)) throw createError({statusCode:500,statusMessage:se.message});

  // 8. Entries inside closed periods that were posted after the close timestamp.
  const {data:periods,error:pre}=await s.from("accounting_periods").select("id,start_date,end_date,status,closed_at").eq("status","closed");
  if(!pre){
    let late=0;
    for(const p of (periods||[]) as any[]){
      if(!p.closed_at) continue;
      const {data,error}=await s.from("accounting_journals").select("id,journal_date,created_at").gte("journal_date",p.start_date).lte("journal_date",p.end_date).gt("created_at",p.closed_at);
      if(!error) late+=(data||[]).length;
    }
    if(late) issues.push({key:"closed_period_posting",severity:"error",title:"Postings after period close",detail:"Journals were created inside a period after that period had already been closed.",count:late,route:"/admin/accounting/period-close"});
  } else if(!missing(pre)) throw createError({statusCode:500,statusMessage:pre.message});

  const errors=issues.filter(x=>x.severity==="error").reduce((a,x)=>a+x.count,0);
  const warnings=issues.filter(x=>x.severity==="warning").reduce((a,x)=>a+x.count,0);
  const status=errors>0?"action_required":warnings>0?"warning":"healthy";
  return {status,errors,warnings,checks_run:8,issues,checked_at:new Date().toISOString()};
});
