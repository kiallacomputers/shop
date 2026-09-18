import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0); const r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);
  const q=getQuery(event), now=new Date(), fy=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
  const start=String(q.start||`${fy}-07-01`), end=String(q.end||`${fy+1}-06-30`), s=getAdminSupabase();
  const [{data:products,error:pe},{data:moves,error:me}]=await Promise.all([
    s.from("products").select("id,name,product_code,buy_price_ex_gst,price,stock,active").order("name"),
    s.from("accounting_inventory_movements").select("id,product_id,movement_date,movement_type,quantity,unit_cost_ex_gst,total_cost_ex_gst,source_type,source_id,notes,products(name,product_code)").gte("movement_date",start).lte("movement_date",end).order("movement_date",{ascending:false}).order("id",{ascending:false})
  ]);
  if(pe)throw createError({statusCode:500,statusMessage:pe.message}); if(me)throw createError({statusCode:500,statusMessage:me.message});
  const valuation=(products||[]).map((p:any)=>{const qty=n(p.stock),unit=r(n(p.buy_price_ex_gst)),value=r(qty*unit),sell=r(qty*n(p.price));return{id:p.id,name:p.name,sku:p.product_code||"",stock:qty,unit_cost:unit,value,retail_value:sell,potential_margin:r(sell-value),active:p.active!==false}});
  const sales=(moves||[]).filter((x:any)=>x.movement_type==="sale");
  const byProduct=new Map<number,any>();
  for(const x of sales){const id=Number(x.product_id), row=byProduct.get(id)||{product_id:id,name:(x as any).products?.name||`Product ${id}`,sku:(x as any).products?.product_code||"",quantity_sold:0,cogs:0};row.quantity_sold+=Math.abs(n(x.quantity));row.cogs=r(row.cogs+n(x.total_cost_ex_gst));byProduct.set(id,row)}
  return{period:{start,end},summary:{inventory_value:r(valuation.reduce((a:any,x:any)=>a+x.value,0)),retail_value:r(valuation.reduce((a:any,x:any)=>a+x.retail_value,0)),units_on_hand:r(valuation.reduce((a:any,x:any)=>a+x.stock,0)),period_cogs:r(sales.reduce((a:number,x:any)=>a+n(x.total_cost_ex_gst),0))},valuation,profitability:[...byProduct.values()].sort((a,b)=>b.cogs-a.cogs),movements:moves||[]};
});
