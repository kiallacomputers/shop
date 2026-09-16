import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { calculateBaseCustomerPrice, calculateVariantCustomerPrice, getPricingLevelForUser, getStandardPricingLevel } from "~~/server/utils/customerPricing";

export async function manualQuotePricingMap(q:any) {
  const items=(q?.manual_quote_items||[]).filter((i:any)=>i.product_id);
  const ids=[...new Set(items.map((i:any)=>Number(i.product_id)).filter(Boolean))];
  const result=new Map<string,{standardPrice:number,currentPrice:number}>();
  if(!ids.length)return result;
  const supabase=getAdminSupabase();
  const [{data:products},standard]=await Promise.all([
    supabase.from("products").select("id,buy_price_ex_gst,price").in("id",ids),
    getStandardPricingLevel()
  ]);
  const level=await getPricingLevelForUser(q?.sales_customers?.user_id||null);
  const variants=[...new Set(items.map((i:any)=>Number(i.variant_id)).filter(Boolean))];
  const {data:variantRows}=variants.length?await supabase.from("product_variants").select("id,product_id,price").in("id",variants):{data:[] as any[]};
  for(const item of items){
    const p:any=(products||[]).find((x:any)=>Number(x.id)===Number(item.product_id)); if(!p)continue;
    const currentBase=calculateBaseCustomerPrice(p.buy_price_ex_gst,level.markupPercent,p.price,standard.markupPercent);
    const standardBase=calculateBaseCustomerPrice(p.buy_price_ex_gst,standard.markupPercent,p.price,standard.markupPercent);
    let current=currentBase,std=standardBase;
    if(item.variant_id){
      const v:any=(variantRows||[]).find((x:any)=>Number(x.id)===Number(item.variant_id));
      if(v){current=calculateVariantCustomerPrice({baseCustomerPrice:currentBase,storedBasePrice:p.price,variantPrice:v.price});std=calculateVariantCustomerPrice({baseCustomerPrice:standardBase,storedBasePrice:p.price,variantPrice:v.price});}
    }
    result.set(String(item.id),{standardPrice:std,currentPrice:current});
  }
  return result;
}
