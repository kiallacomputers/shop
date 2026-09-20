import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireAdmin(event); const productId=Number(getRouterParam(event,"id")); const body=await readBody(event);
  const name=String(body?.name||"").trim(), productCode=String(body?.product_code||"").trim();
  const price=Number(body?.price), oldPrice=body?.old_price==null||body?.old_price===""?null:Number(body.old_price), stock=Number(body?.stock);
  if(!name||!productCode) throw createError({statusCode:400,statusMessage:"Variant name and product code are required"});
  if(!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0) throw createError({statusCode:400,statusMessage:"Enter a valid price and stock level"});
  const supabase=getAdminSupabase();
  const {data:baseCode}=await supabase.from("products").select("id").ilike("product_code",productCode).limit(1).maybeSingle();
  if(baseCode) throw createError({statusCode:409,statusMessage:"That product code is already used by a product"});
  const {data,error}=await supabase.from("product_variants").insert({product_id:productId,name,product_code:productCode,price,old_price:Number.isFinite(oldPrice as number)?oldPrice:null,stock,active:body?.active!==false,images:Array.isArray(body?.images)?body.images:[],sort_order:Number(body?.sort_order)||0}).select("*").single();
  if(error){if(error.code==="23505") throw createError({statusCode:409,statusMessage:"That product code is already in use"}); throw createError({statusCode:500,statusMessage:error.message});} return data;
});
