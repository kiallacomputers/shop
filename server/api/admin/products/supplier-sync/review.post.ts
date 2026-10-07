import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const b=await readBody(event), productId=Number(b?.product_id), linkId=Number(b?.link_id), supplierBuy=Number(b?.supplier_buy), ignored=b?.ignored===true;
  if(!productId||!linkId||!Number.isFinite(supplierBuy)) throw createError({statusCode:400,statusMessage:"Valid product, supplier link and supplier price are required."});
  const s=getAdminSupabase();
  if(!ignored){
    const {error}=await s.from("supplier_price_change_reviews").delete().eq("product_id",productId).eq("supplier_link_id",linkId);
    if(error) throw createError({statusCode:500,statusMessage:error.message});
    return {ok:true,ignored:false};
  }
  const {error}=await s.from("supplier_price_change_reviews").upsert({product_id:productId,supplier_link_id:linkId,supplier_buy_price:supplierBuy,status:"ignored",updated_at:new Date().toISOString()},{onConflict:"product_id,supplier_link_id"});
  if(error) throw createError({statusCode:500,statusMessage:error.message});
  return {ok:true,ignored:true};
});
