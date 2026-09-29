import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { merchantItemsForProduct, merchantXml } from "~~/server/utils/googleMerchant";

export default defineEventHandler(async (event) => {
  const supabase=getAdminSupabase();
  const {data,error}=await supabase.from("products")
    .select("id,name,slug,product_code,brand,gtin,mpn,seo_description,blurb,description,price,stock,active,refurbished,images,weight_kg,product_variants(id,name,product_code,gtin,mpn,price,stock,active,images)")
    .eq("active",true).order("name");
  if(error) throw createError({statusCode:500,statusMessage:error.message});
  const site=String(useRuntimeConfig(event).public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/$/,"");
  const items=(data||[]).flatMap((p:any)=>merchantItemsForProduct(p,site));
  setHeader(event,"content-type","application/xml; charset=utf-8");
  setHeader(event,"cache-control","public, max-age=900");
  return merchantXml(items);
});
