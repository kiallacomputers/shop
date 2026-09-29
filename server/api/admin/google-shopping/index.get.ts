import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { merchantItemsForProduct } from "~~/server/utils/googleMerchant";
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const s=getAdminSupabase();
  const {data,error}=await s.from("products")
    .select("id,name,slug,product_code,brand,gtin,mpn,seo_description,blurb,description,price,stock,active,refurbished,images,product_variants(id,name,product_code,gtin,mpn,price,stock,active,images)")
    .eq("active",true).order("name");
  if(error) {
    console.error("GOOGLE SHOPPING PRODUCT QUERY ERROR:", error);
    throw createError({statusCode:500,statusMessage:error.message || "Unable to load Google Shopping product data"});
  }
  const site=String(useRuntimeConfig(event).public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/$/,"");
  const products=(data||[]).map((p:any)=>{
    const items=merchantItemsForProduct(p,site);
    const issues=items.flatMap((i:any)=>i.issues.map((x:any)=>({...x,variant_id:i.variant_id,variant_title:i.variant_id?i.title:""})));
    const errors=issues.filter((x:any)=>x.severity==="error").length;
    const warnings=issues.length-errors;
    return {id:p.id,name:p.name,slug:p.slug,product_code:p.product_code,brand:p.brand,has_variants:items.length>1,
      item_count:items.length,issues,status:errors?"not_eligible":warnings?"attention":"ready"};
  });
  const items=(data||[]).flatMap((p:any)=>merchantItemsForProduct(p,site));
  return {
    generated_at:new Date().toISOString(),
    feed_url:`${site}/google-shopping.xml`,
    summary:{
      active_products:products.length, feed_items:items.length,
      ready:products.filter((x:any)=>x.status==="ready").length,
      attention:products.filter((x:any)=>x.status==="attention").length,
      not_eligible:products.filter((x:any)=>x.status==="not_eligible").length,
      missing_brand:products.filter((x:any)=>x.issues.some((i:any)=>i.key==="missing_brand")).length,
      missing_identifier:products.filter((x:any)=>x.issues.some((i:any)=>i.key==="missing_identifier")).length,
      missing_image:products.filter((x:any)=>x.issues.some((i:any)=>i.key==="missing_image")).length,
    }, products
  };
});
