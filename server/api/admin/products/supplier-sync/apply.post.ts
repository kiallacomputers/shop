import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { getStandardPricingLevel } from "~~/server/utils/customerPricing";
const money=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const b=await readBody(event), productId=Number(b?.product_id), linkId=Number(b?.link_id), newBuy=Number(b?.buy_price_ex_gst);
  const recalculate=b?.recalculate===true;
  if(!productId||!linkId||!Number.isFinite(newBuy)||newBuy<0) throw createError({statusCode:400,statusMessage:"Valid product, supplier link and buy price are required."});
  const s=getAdminSupabase();
  const {data:p,error:pe}=await s.from("products").select("id,rrp_markup_percent,pricing_level_markup_override_percent").eq("id",productId).single();
  if(pe||!p) throw createError({statusCode:404,statusMessage:"Product not found"});
  const productUpdate:any={buy_price_ex_gst:money(newBuy)};
  if(recalculate){
    const level=await getStandardPricingLevel();
    const sellMarkup=Number(level.markupPercent||0)+Number(p.pricing_level_markup_override_percent||0);
    const sellEx=money(newBuy*(1+sellMarkup/100)), rrpEx=money(newBuy*(1+Number(p.rrp_markup_percent||0)/100));
    productUpdate.sell_markup_percent=sellMarkup;
    productUpdate.price=Math.max(1,Math.round(sellEx*1.1));
    productUpdate.oldPrice=Math.max(1,Math.round(rrpEx*1.1));
  }
  const {error:e1}=await s.from("products").update(productUpdate).eq("id",productId);
  if(e1) throw createError({statusCode:500,statusMessage:e1.message});
  const {error:e2}=await s.from("accounting_product_suppliers").update({buy_price_ex_gst:money(newBuy),updated_at:new Date().toISOString()}).eq("id",linkId);
  if(e2) throw createError({statusCode:500,statusMessage:e2.message});
  return {ok:true,recalculated:recalculate};
});