import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0);
export default defineEventHandler(async(event)=>{
  await requireAdmin(event); const s=getAdminSupabase();
  const [pr,map]=await Promise.all([
    s.from("products").select("id,name,product_code,stock,price,buy_price_ex_gst,active,category_id,low_stock_level,reorder_level,target_stock_level").order("name"),
    s.from("accounting_product_suppliers").select("product_id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary,accounting_suppliers(id,name,active)")
  ]);
  if(pr.error) throw createError({statusCode:500,statusMessage:pr.error.message});
  if(map.error) throw createError({statusCode:500,statusMessage:map.error.message});
  const mappings=new Map<number,any[]>(); for(const x of map.data||[]){const id=Number(x.product_id);if(!mappings.has(id))mappings.set(id,[]);mappings.get(id)!.push(x)}
  const products=(pr.data||[]).map((p:any)=>{
    const suppliers=mappings.get(Number(p.id))||[], primary=suppliers.find(x=>x.is_primary) || null;
    const issues:any[]=[];
    if(!String(p.product_code||"").trim()) issues.push({key:"sku",label:"Missing product code / SKU",severity:"critical"});
    if(!p.category_id) issues.push({key:"category",label:"No category",severity:"warning"});
    if(!suppliers.length) issues.push({key:"supplier",label:"No supplier assigned",severity:"critical"});
    else {
      if(!primary) issues.push({key:"primary_supplier",label:"No primary supplier",severity:"warning"});
      const chosen=primary||suppliers[0];
      if(!String(chosen?.supplier_sku||"").trim()) issues.push({key:"supplier_sku",label:"Missing supplier SKU",severity:"warning"});
      if(n(chosen?.buy_price_ex_gst)<=0 && n(p.buy_price_ex_gst)<=0) issues.push({key:"buy_price",label:"Missing buy price",severity:"critical"});
    }
    const low=n(p.low_stock_level), reorder=n(p.reorder_level), target=n(p.target_stock_level);
    if(target<=0) issues.push({key:"target",label:"Target stock level not set",severity:"warning"});
    if(reorder<low) issues.push({key:"levels",label:"Reorder level is below low-stock level",severity:"critical"});
    if(target<reorder) issues.push({key:"levels",label:"Target stock level is below reorder level",severity:"critical"});
    if(n(p.price)<=0) issues.push({key:"sell_price",label:"Missing sell price",severity:"critical"});
    return {id:p.id,name:p.name,sku:p.product_code||"",active:p.active!==false,stock:n(p.stock),low_stock_level:low,reorder_level:reorder,target_stock_level:target,sell_price:n(p.price),supplier_count:suppliers.length,primary_supplier:primary?.accounting_suppliers?.name||null,supplier_sku:primary?.supplier_sku||null,buy_price:n(primary?.buy_price_ex_gst??p.buy_price_ex_gst),issues,health:issues.some(x=>x.severity==="critical")?"critical":issues.length?"warning":"healthy"};
  });
  return {summary:{total:products.length,healthy:products.filter(x=>x.health==="healthy").length,warning:products.filter(x=>x.health==="warning").length,critical:products.filter(x=>x.health==="critical").length,issues:products.reduce((a,x)=>a+x.issues.length,0)},products};
});