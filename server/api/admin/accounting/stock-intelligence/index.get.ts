import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0); const r=(v:number)=>Math.round(v*100)/100;
const daysBetween=(a:string,b:string)=>Math.max(1,Math.ceil((new Date(b).getTime()-new Date(a).getTime())/86400000));
export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event); const s=getAdminSupabase(); const q=getQuery(event);
  const windowDays=Math.min(365,Math.max(30,Number(q.days||90))); const targetDays=Math.min(365,Math.max(7,Number(q.target_days||60)));
  const today=new Date(); const from=new Date(today); from.setDate(from.getDate()-windowDays); const fromDate=from.toISOString().slice(0,10); const todayDate=today.toISOString().slice(0,10);
  const [pr,mv,map,po]=await Promise.all([
    s.from("products").select("id,name,product_code,stock,buy_price_ex_gst,price,active,category_id,low_stock_level,reorder_level,target_stock_level").eq("active",true),
    s.from("accounting_inventory_movements").select("product_id,quantity,movement_type,movement_date").gte("movement_date",fromDate).lte("movement_date",todayDate),
    s.from("accounting_product_suppliers").select("product_id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary,accounting_suppliers(id,name)"),
    s.from("accounting_purchase_orders").select("id,status,accounting_purchase_order_lines(product_id,quantity)").in("status",["draft","sent","ordered","part_received"])
  ]);
  if(pr.error) throw createError({statusCode:500,statusMessage:pr.error.message});
  if(mv.error && mv.error.code!=="42P01") throw createError({statusCode:500,statusMessage:mv.error.message});
  if(map.error && map.error.code!=="42P01") throw createError({statusCode:500,statusMessage:map.error.message});
  if(po.error && po.error.code!=="42P01") throw createError({statusCode:500,statusMessage:po.error.message});
  const sold=new Map<number,number>(), lastSale=new Map<number,string>();
  for(const x of mv.data||[]){ if(x.movement_type!=="sale") continue; const id=Number(x.product_id); sold.set(id,(sold.get(id)||0)+Math.abs(n(x.quantity))); const d=String(x.movement_date||""); if(d&&(!lastSale.get(id)||d>lastSale.get(id)!)) lastSale.set(id,d); }
  const onOrder=new Map<number,number>(); for(const p of po.data||[]) for(const l of (p as any).accounting_purchase_order_lines||[]) if(l.product_id) onOrder.set(Number(l.product_id),(onOrder.get(Number(l.product_id))||0)+n(l.quantity));
  const mappings=new Map<number,any[]>(); for(const x of map.data||[]){const id=Number(x.product_id); if(!mappings.has(id))mappings.set(id,[]); mappings.get(id)!.push(x)}
  const rows=(pr.data||[]).map((p:any)=>{const id=Number(p.id),qty=n(p.stock),sales=sold.get(id)||0,daily=sales/windowDays,ordered=onOrder.get(id)||0,coverage=daily>0?qty/daily:null; const low=n(p.low_stock_level),reorder=n(p.reorder_level),configuredTarget=n(p.target_stock_level),velocityTarget=Math.ceil(daily*targetDays),target=Math.max(configuredTarget,velocityTarget); const shouldReorder=(qty+ordered)<=reorder; const suggested=shouldReorder?Math.max(0,target-qty-ordered):0; const ms=(mappings.get(id)||[]).sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)), primary=ms[0]||null; const buy=n(primary?.buy_price_ex_gst??p.buy_price_ex_gst); const last=lastSale.get(id)||null; const noSaleDays=last?daysBetween(last,todayDate):null; let health="healthy"; if(qty<=0)health="critical"; else if(qty<=low)health="low"; else if((qty+ordered)<=reorder)health="low"; else if(sales===0&&qty>target&&qty>0)health="dead"; else if(coverage!==null&&coverage>180)health="excess"; else if(coverage!==null&&coverage>90)health="slow"; return {id,name:p.name,sku:p.product_code,stock:qty,low_stock_level:low,reorder_level:reorder,target_stock_level:configuredTarget,on_order:ordered,sold_units:r(sales),daily_velocity:r(daily),stock_cover_days:coverage===null?null:Math.round(coverage),last_sale_date:last,no_sale_days:noSaleDays,buy_price:r(buy),sell_price:r(n(p.price)),stock_value:r(qty*buy),target_stock:target,suggested_order:suggested,suggested_cost:r(suggested*buy),health,supplier_id:primary?.supplier_id||null,supplier_name:primary?.accounting_suppliers?.name||null,supplier_sku:primary?.supplier_sku||p.product_code||null};});
  const sum=(key:string,filter=(x:any)=>true)=>r(rows.filter(filter).reduce((a:any,x:any)=>a+n(x[key]),0));
  return {as_of:todayDate,window_days:windowDays,target_days:targetDays,summary:{inventory_value:sum("stock_value"),recommended_purchase_value:sum("suggested_cost"),low_stock:rows.filter(x=>["critical","low"].includes(x.health)).length,slow_stock:rows.filter(x=>x.health==="slow").length,dead_stock:rows.filter(x=>x.health==="dead").length,excess_stock:rows.filter(x=>x.health==="excess").length,on_order_units:sum("on_order"),dead_stock_value:sum("stock_value",x=>x.health==="dead")},products:rows.sort((a,b)=>b.suggested_cost-a.suggested_cost||a.name.localeCompare(b.name))};
});
