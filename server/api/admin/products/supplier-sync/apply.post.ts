import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { getStandardPricingLevel } from "~~/server/utils/customerPricing";
const money=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const b=await readBody(event), productId=Number(b?.product_id), variantId=Number(b?.variant_id||0)||null, linkId=Number(b?.link_id), newBuy=Number(b?.buy_price_ex_gst), supplierRrp=Number(b?.supplier_rrp||0);
  const recalculate=b?.recalculate===true;
  if(!productId||!linkId||!Number.isFinite(newBuy)||newBuy<0) throw createError({statusCode:400,statusMessage:"Valid product, supplier link and buy price are required."});
  const s=getAdminSupabase();
  const {data:p,error:pe}=await s.from("products").select("id,pricing_level_markup_override_percent").eq("id",productId).single();
  if(pe||!p) throw createError({statusCode:404,statusMessage:"Product not found"});
  const level=await getStandardPricingLevel();
  const sellMarkup=Number(level.markupPercent||0)+Number(p.pricing_level_markup_override_percent||0);
  if(variantId){
    const {data:v,error:ve}=await s.from("product_variants").select("id").eq("id",variantId).eq("product_id",productId).single();
    if(ve||!v) throw createError({statusCode:404,statusMessage:"Variation not found"});
    const u:any={buy_price_ex_gst:money(newBuy),updated_at:new Date().toISOString()};
    if(recalculate){const sellEx=money(newBuy*(1+sellMarkup/100));u.price=Math.max(1,Math.round(sellEx*1.1));if(supplierRrp>0)u.old_price=Math.max(1,Math.round(supplierRrp));}
    const {error}=await s.from("product_variants").update(u).eq("id",variantId).eq("product_id",productId);
    if(error)throw createError({statusCode:500,statusMessage:error.message});
    await s.from("supplier_variant_price_change_reviews").delete().eq("variant_id",variantId);
  }else{
    const u:any={buy_price_ex_gst:money(newBuy)};
    if(recalculate){const sellEx=money(newBuy*(1+sellMarkup/100));u.sell_markup_percent=sellMarkup;u.price=Math.max(1,Math.round(sellEx*1.1));if(supplierRrp>0)u.oldPrice=Math.max(1,Math.round(supplierRrp));}
    const {error}=await s.from("products").update(u).eq("id",productId);if(error)throw createError({statusCode:500,statusMessage:error.message});
    const {error:e2}=await s.from("accounting_product_suppliers").update({buy_price_ex_gst:money(newBuy),updated_at:new Date().toISOString()}).eq("id",linkId);if(e2)throw createError({statusCode:500,statusMessage:e2.message});
    await s.from("supplier_price_change_reviews").delete().eq("product_id",productId).eq("supplier_link_id",linkId);
  }
  return {ok:true,recalculated:recalculate,variant_id:variantId};
});