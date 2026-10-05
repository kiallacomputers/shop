import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const xmlDecode=(v:string)=>v.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
const cleanGtin=(v:any)=>{const x=String(v??"").trim().replace(/\s+/g,"");return /^\d{8,14}$/.test(x)?x:""};
const imageUrls=(r:any)=>{const base="https://partner.leadersystems.com.au/Images/";return [...new Set([r?.Image1||(r?.PartNum?`${r.PartNum}.jpg`:""),r?.Image2,r?.Image3,r?.Image4].map((x:any)=>String(x||"").trim()).filter(Boolean))].map((x:any)=>/^https?:\/\//i.test(x)?x:base+encodeURIComponent(x).replace(/%2F/gi,"/"));};
function stripHtml(v:string){return v.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/\s+/g," ").trim()}
function detectCategory(html:string){
  const patterns=[
    /(?:CategoryName|Category|categoryName)\s*[:=]\s*["']([^"']{2,100})["']/i,
    /<input[^>]+(?:id|name)=["'](?:Category|CategoryName)["'][^>]+value=["']([^"']+)["']/i,
    /<option[^>]+selected[^>]*>([^<]{2,100})<\/option>/i,
    /<h1[^>]*>([\s\S]{2,150}?)<\/h1>/i,
    /<h2[^>]*>([\s\S]{2,150}?)<\/h2>/i
  ];
  for(const re of patterns){const m=html.match(re);if(m){const v=stripHtml(m[1]).replace(/^Products?\s*[-–:]\s*/i,"").trim();if(v&&!/leader|dealer|categories/i.test(v))return v;}}
  return "";
}
async function getProducts(category:string,cookie:string,customerCode:string,referer:string){
  const form=new URLSearchParams({Prod:"",Category:category,SubCategory:"",OnlyAvailable:"",Vendor:"",VendorTenCode:"",CustomerCode:customerCode,ExactMatch:"0"});
  const res=await fetch("https://partner.leadersystems.com.au/WSLD.asmx/GetProducts",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","accept":"*/*","cookie":cookie,"origin":"https://partner.leadersystems.com.au","referer":referer,"user-agent":"Mozilla/5.0 (compatible; KiallaComputersCategoryImporter/1.0)"},body:form.toString(),redirect:"manual",signal:AbortSignal.timeout(15000)});
  if([302,303,401,403].includes(res.status))throw createError({statusCode:422,statusMessage:"Leader session is no longer authenticated. Update LEADER_SESSION_COOKIE."});
  if(!res.ok)throw createError({statusCode:502,statusMessage:`Leader GetProducts returned HTTP ${res.status}.`});
  const xml=await res.text(),m=xml.match(/<string[^>]*>([\s\S]*?)<\/string>/i);if(!m)throw createError({statusCode:502,statusMessage:"Unexpected Leader GetProducts response."});
  try{return JSON.parse(xmlDecode(m[1]))}catch{throw createError({statusCode:502,statusMessage:"Leader category data could not be decoded."})}
}
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);const body=await readBody(event);const url=String(body?.url||"").trim(),override=String(body?.category||"").trim();
  if(!url)throw createError({statusCode:400,statusMessage:"Leader category URL is required."});
  const u=new URL(url);if(u.protocol!=="https:"||u.hostname.toLowerCase()!=="partner.leadersystems.com.au"||!u.pathname.toLowerCase().includes("categories"))throw createError({statusCode:400,statusMessage:"Enter a Leader categories.html URL."});
  const cookie=String(process.env.LEADER_SESSION_COOKIE||"").trim(),customerCode=String(process.env.LEADER_CUSTOMER_CODE||"").trim();if(!cookie||!customerCode)throw createError({statusCode:422,statusMessage:"Leader integration is not configured."});
  let category=override;
  if(!category){const page=await fetch(url,{headers:{cookie,"user-agent":"Mozilla/5.0 (compatible; KiallaComputersCategoryImporter/1.0)"},redirect:"manual",signal:AbortSignal.timeout(12000)});if([302,303,401,403].includes(page.status))throw createError({statusCode:422,statusMessage:"Leader session is no longer authenticated."});if(!page.ok)throw createError({statusCode:502,statusMessage:`Leader category page returned HTTP ${page.status}.`});category=detectCategory(await page.text());}
  if(!category)throw createError({statusCode:422,statusMessage:"The category name could not be detected from this Leader page. Enter the Leader category name in the Category Override field and fetch again."});
  const rows:any[]=await getProducts(category,cookie,customerCode,url);
  const s=getAdminSupabase();
  const [{data:products},{data:links}]=await Promise.all([s.from("products").select("id,name,product_code,gtin,mpn,category_id"),s.from("accounting_product_suppliers").select("product_id,supplier_sku")]);
  const byCode=new Map((products||[]).map((p:any)=>[String(p.product_code||"").toLowerCase(),p])),byGtin=new Map((products||[]).filter((p:any)=>p.gtin).map((p:any)=>[String(p.gtin),p])),byMpn=new Map((products||[]).filter((p:any)=>p.mpn).map((p:any)=>[String(p.mpn).toLowerCase(),p]));
  const linkMap=new Map((links||[]).filter((x:any)=>x.supplier_sku).map((x:any)=>[String(x.supplier_sku).toLowerCase(),Number(x.product_id)]));const productById=new Map((products||[]).map((p:any)=>[Number(p.id),p]));
  const mapped=rows.map((r:any)=>{const gtin=cleanGtin(r.ProductBarcode??r.Barcode??r.BarCode??r.GTIN??r.EAN??r.UPC),sku=String(r.PartNum||"").trim(),mpn=String(r.PartNumManuf||"").trim();const existing=productById.get(linkMap.get(sku.toLowerCase())||0)||byCode.get(sku.toLowerCase())||(gtin?byGtin.get(gtin):null)||(mpn?byMpn.get(mpn.toLowerCase()):null);const states={VIC:Number(r.AvailVic||0),NSW:Number(r.AvailNsw||0),QLD:Number(r.AvailQld||0),SA:Number(r.AvailSa||0),WA:Number(r.AvailWa||0)};return {leader_product_id:r.ProductID,supplier_sku:sku,name:String(r.ProductName||""),description:String(r.ProductDescription||""),brand:String(r.VendorName||""),mpn,gtin,buy_price_ex_gst:Number(r.PrEx1??r.Price1??0),rrp_inc_gst:Number(r.RRPInc||0),leader_category:String(r.Category||category),leader_subcategory:String(r.SubCategory||"Uncategorised"),stock_by_state:states,stock_total:Object.values(states).reduce((a:number,b:any)=>a+Number(b||0),0),images:imageUrls(r),box_length_mm:Number(r.BoxLength||0),box_width_mm:Number(r.BoxWidth||0),box_height_mm:Number(r.BoxHeight||0),existing_product_id:existing?.id||null,existing_name:existing?.name||null,status:existing?"existing":"new"};});
  return {category,subcategories:[...new Set(mapped.map((x:any)=>x.leader_subcategory))].sort(),count:mapped.length,products:mapped};
});
