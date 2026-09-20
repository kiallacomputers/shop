import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);
  const s=getAdminSupabase();
  const {data:moves,error}=await s
    .from("accounting_inventory_movements")
    .select("id,product_id,movement_date,movement_type,quantity,unit_cost,total_cost,reference,notes,journal_id,created_at")
    .in("movement_type",["stocktake_in","stocktake_out"])
    .order("movement_date",{ascending:false})
    .order("id",{ascending:false})
    .limit(100);
  if(error) throw createError({statusCode:500,statusMessage:error.message});
  const ids=[...new Set((moves||[]).map((x:any)=>x.product_id).filter(Boolean))];
  let products:any[]=[];
  if(ids.length){
    const result=await s.from("products").select("id,name,product_code").in("id",ids);
    if(result.error) throw createError({statusCode:500,statusMessage:result.error.message});
    products=result.data||[];
  }
  const names=new Map(products.map((p:any)=>[String(p.id),p]));
  return (moves||[]).map((x:any)=>({...x,product_name:names.get(String(x.product_id))?.name||`Product ${x.product_id}`,sku:names.get(String(x.product_id))?.product_code||""}));
});
