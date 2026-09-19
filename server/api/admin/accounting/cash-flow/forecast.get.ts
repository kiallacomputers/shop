import {getAdminSupabase,requireSuperAdmin} from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0), r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
const iso=(d:Date)=>d.toISOString().slice(0,10); const add=(d:Date,days:number)=>new Date(d.getTime()+days*86400000);
const parse=(x:any)=>new Date(String(x)+'T00:00:00');
function expand(x:any,end:Date){const out:any[]=[];let d=parse(x.start_date),stop=x.end_date?parse(x.end_date):end;if(stop>end)stop=end;let guard=0;while(d<=stop&&guard++<400){out.push({date:iso(d),type:'manual',label:x.name,amount:x.direction==='inflow'?n(x.amount):-n(x.amount),source_id:x.id});if(x.frequency==='once')break;if(x.frequency==='weekly')d=add(d,7);else if(x.frequency==='fortnightly')d=add(d,14);else if(x.frequency==='monthly'){const z=new Date(d);z.setMonth(z.getMonth()+1);d=z}else if(x.frequency==='quarterly'){const z=new Date(d);z.setMonth(z.getMonth()+3);d=z}else if(x.frequency==='yearly'){const z=new Date(d);z.setFullYear(z.getFullYear()+1);d=z}else break}return out}
export default defineEventHandler(async e=>{await requireSuperAdmin(e);const s=getAdminSupabase(),q=getQuery(e),days=Math.min(365,Math.max(30,Number(q.days||90))),today=new Date(),todayS=iso(today),end=add(today,days),endS=iso(end);
 const [invR,billR,poR,bankAccR,bankTxR,itemR]=await Promise.all([
  s.from('accounting_invoices').select('*').lte('invoice_date',endS),
  s.from('accounting_supplier_bills').select('*,accounting_suppliers(name)').lte('bill_date',endS),
  s.from('accounting_purchase_orders').select('*,accounting_suppliers(name)').in('status',['sent','ordered','partially_received']).lte('order_date',endS),
  s.from('accounting_bank_accounts').select('*').eq('active',true),
  s.from('accounting_bank_transactions').select('*').lte('transaction_date',todayS),
  s.from('accounting_cash_flow_items').select('*').eq('active',true).lte('start_date',endS)
 ]);
 for(const z of [invR,billR,poR,bankAccR,bankTxR,itemR])if(z.error)throw createError({statusCode:500,statusMessage:z.error.message});
 const events:any[]=[];const bal=(x:any)=>Math.max(0,n(x.total)-n(x.paid_amount));
 for(const x of invR.data||[]){const b=bal(x);if(b>.005){let d=String(x.due_date||x.invoice_date);if(d<todayS)d=todayS;if(d<=endS)events.push({date:d,type:'receivable',label:`Invoice ${x.invoice_number||x.id} · ${x.customer_name||x.customer_email||'Customer'}`,amount:b,source_id:x.id,overdue:String(x.due_date||x.invoice_date)<todayS})}}
 for(const x of billR.data||[]){const b=bal(x);if(b>.005){let d=String(x.due_date||x.bill_date);if(d<todayS)d=todayS;if(d<=endS)events.push({date:d,type:'payable',label:`Bill ${x.bill_number||x.id} · ${x.accounting_suppliers?.name||'Supplier'}`,amount:-b,source_id:x.id,overdue:String(x.due_date||x.bill_date)<todayS})}}
 const billedPO=new Set((billR.data||[]).map((x:any)=>Number(x.purchase_order_id)).filter(Boolean));for(const x of poR.data||[]){if(billedPO.has(Number(x.id)))continue;let d=String(x.expected_date||x.order_date);if(d<todayS)d=todayS;if(d<=endS)events.push({date:d,type:'purchase_order',label:`PO ${x.po_number||x.id} · ${x.accounting_suppliers?.name||'Supplier'}`,amount:-n(x.total),source_id:x.id})}
 for(const x of itemR.data||[])events.push(...expand(x,end).filter((z:any)=>z.date>=todayS));
 const txBy=new Map<number,number>();for(const x of bankTxR.data||[])txBy.set(Number(x.bank_account_id),(txBy.get(Number(x.bank_account_id))||0)+n(x.amount));const banks=(bankAccR.data||[]).map((x:any)=>({...x,current_balance:r(n(x.opening_balance)+(txBy.get(Number(x.id))||0))}));const opening=r(banks.reduce((a:any,x:any)=>a+n(x.current_balance),0));
 events.sort((a,b)=>a.date.localeCompare(b.date)||b.amount-a.amount);let running=opening;const rows=events.map(x=>{running+=n(x.amount);return{...x,amount:r(x.amount),projected_balance:r(running)}});
 const buckets:any[]=[];for(let i=0;i<Math.ceil(days/7);i++){const st=add(today,i*7),en=add(st,6);let inflow=0,outflow=0;for(const x of events){const d=parse(x.date);if(d>=st&&d<=en){if(x.amount>=0)inflow+=x.amount;else outflow+=Math.abs(x.amount)}}buckets.push({start:iso(st),end:iso(en),inflow:r(inflow),outflow:r(outflow),net:r(inflow-outflow)})}
 return{period:{today:todayS,end:endS,days},opening_balance:opening,banks,summary:{expected_in:r(events.filter(x=>x.amount>0).reduce((a,x)=>a+x.amount,0)),expected_out:r(events.filter(x=>x.amount<0).reduce((a,x)=>a+Math.abs(x.amount),0)),projected_balance:r(running),lowest_balance:r(rows.reduce((m,x)=>Math.min(m,x.projected_balance),opening)),overdue_in:r(events.filter(x=>x.overdue&&x.amount>0).reduce((a,x)=>a+x.amount,0)),overdue_out:r(events.filter(x=>x.overdue&&x.amount<0).reduce((a,x)=>a+Math.abs(x.amount),0))},events:rows,buckets};
});
