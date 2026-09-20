import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
const n=(v:any)=>Number(v||0);
export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);
  const s=getAdminSupabase();
  const [pr,mp]=await Promise.all([
    s.from("products").select("id,name,product_code,stock,price,buy_price_ex_gst,active,category_id,low_stock_level,reorder_level,target_stock_level").order("name"),
    s.from("accounting_product_suppliers").select("product_id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary,accounting_suppliers(id,name,active)")
  ]);
  if(pr.error) throw createError({statusCode:500,statusMessage:pr.error.message});
  if(mp.error && mp.error.code!=="42P01") throw createError({statusCode:500,statusMessage:mp.error.message});
  const byProduct=new Map<number,any[]>();
  for(const m of mp.data||[]){const id=Number(m.product_id);if(!byProduct.has(id))byProduct.set(id,[]);byProduct.get(id)!.push(m)}
  const rows=(pr.data||[]).map((p:any)=>{
    const maps=byProduct.get(Number(p.id))||[];
    const primary=maps.find((x:any)=>x.is_primary===true)||null;
    const issues:any[]=[];
    if(!String(p.product_code||"").trim())issues.push({key:"sku",label:"Missing product code / SKU",severity:"critical"});
    if(!p.category_id)issues.push({key:"category",label:"No category assigned",severity:"warning"});
    if(!maps.length)issues.push({key:"supplier",label:"No supplier assigned",severity:"critical"});
    else if(!primary)issues.push({key:"primary_supplier",label:"No primary supplier",severity:"warning"});
    const preferred=primary||maps[0]||null;
    if(preferred&&!String(preferred.supplier_sku||"").trim())issues.push({key:"supplier_sku",label:"Missing supplier SKU",severity:"warning"});
    const buy=n(preferred?.buy_price_ex_gst??p.buy_price_ex_gst);
    if(buy<=0)issues.push({key:"buy_price",label:"Missing buy price",severity:"critical"});
    if(n(p.price)<=0)issues.push({key:"sell_price",label:"Missing sell price",severity:"critical"});
    const low=n(p.low_stock_level), reorder=n(p.reorder_level), target=n(p.target_stock_level);
    if(low===0&&reorder===0&&target===0)issues.push({key:"stock_levels",label:"Stock levels not configured",severity:"warning"});
    else {
      if(reorder<low)issues.push({key:"reorder_level",label:"Reorder level is below low-stock level",severity:"critical"});
      if(target<reorder)issues.push({key:"target_level",label:"Target stock is below reorder level",severity:"critical"});
    }
    if(n(p.stock)<0)issues.push({key:"negative_stock",label:"Negative current stock",severity:"critical"});
    return {...p,buy_price:buy,supplier_count:maps.length,primary_supplier_name:primary?.accounting_suppliers?.name||null,primary_supplier_sku:primary?.supplier_sku||null,issues,health:issues.some((x:any)=>x.severity==="critical")?"critical":issues.length?"warning":"healthy"};
  });
  return {summary:{total:rows.length,healthy:rows.filter((x:any)=>x.health==="healthy").length,warning:rows.filter((x:any)=>x.health==="warning").length,critical:rows.filter((x:any)=>x.health==="critical").length,total_issues:rows.reduce((a:number,x:any)=>a+x.issues.length,0)},products:rows};
});
