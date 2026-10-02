import { requireAdmin } from "~~/server/utils/adminAuth";

function xmlDecode(v:string){
  return v.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
}
function extractProductCode(rawUrl:string){
  const u=new URL(rawUrl);
  // Leader product URLs include the visible product code in the page after load,
  // but the opaque URL itself is not reliably reversible. Allow an explicit code
  // from the client and retain URL parsing fallbacks for future URL formats.
  for(const key of ["Prod","prod","product","Product","sku","SKU","part","PartNum"]){
    const v=u.searchParams.get(key); if(v) return v.trim();
  }
  return "";
}
function leaderImages(partNum:string, partNumManuf:string){
  // Leader commonly serves product images by part/manufacturer code, but filenames
  // are not guaranteed. We leave image discovery to vendor data unless confirmed.
  return [];
}
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const body=await readBody(event);
  const url=String(body?.url||"").trim();
  const suppliedCode=String(body?.product_code||"").trim();
  if(!url) throw createError({statusCode:400,statusMessage:"Supplier product URL is required"});

  const u=new URL(url);
  if(u.protocol!=="https:"||u.hostname.toLowerCase()!=="partner.leadersystems.com.au")
    throw createError({statusCode:400,statusMessage:"This importer currently supports Leader Dealershop product URLs."});

  const productCode=suppliedCode||extractProductCode(url);
  if(!productCode)
    throw createError({statusCode:422,statusMessage:"Leader product code is required. Enter the Leader product code shown on the product page (for example MNL-32BR50C-B)."});

  const cookie=String(process.env.LEADER_SESSION_COOKIE||"").trim();
  const customerCode=String(process.env.LEADER_CUSTOMER_CODE||"").trim();
  if(!cookie||!customerCode)
    throw createError({statusCode:422,statusMessage:"Leader integration is not configured. Set LEADER_SESSION_COOKIE and LEADER_CUSTOMER_CODE in the server environment."});

  const form=new URLSearchParams({
    Prod:productCode,
    Category:"",
    SubCategory:"",
    OnlyAvailable:"",
    Vendor:"",
    VendorTenCode:"",
    CustomerCode:customerCode,
    ExactMatch:"0"
  });

  const res=await fetch("https://partner.leadersystems.com.au/WSLD.asmx/GetProducts",{
    method:"POST",
    headers:{
      "content-type":"application/x-www-form-urlencoded",
      "accept":"*/*",
      "cookie":cookie,
      "origin":"https://partner.leadersystems.com.au",
      "referer":url,
      "user-agent":"Mozilla/5.0 (compatible; KiallaComputersProductImporter/2.0)"
    },
    body:form.toString(),
    redirect:"manual",
    signal:AbortSignal.timeout(15000)
  });

  if(res.status===401||res.status===403||res.status===302||res.status===303)
    throw createError({statusCode:422,statusMessage:"Leader session is no longer authenticated. Update LEADER_SESSION_COOKIE and redeploy."});
  if(!res.ok)
    throw createError({statusCode:502,statusMessage:`Leader GetProducts returned HTTP ${res.status}.`});

  const xml=await res.text();
  const m=xml.match(/<string[^>]*>([\s\S]*?)<\/string>/i);
  if(!m) throw createError({statusCode:502,statusMessage:"Leader returned an unexpected GetProducts response."});

  let rows:any[];
  try{ rows=JSON.parse(xmlDecode(m[1])); }
  catch{ throw createError({statusCode:502,statusMessage:"Leader product data could not be decoded."}); }

  const row=rows.find((x:any)=>String(x.PartNum||"").toLowerCase()===productCode.toLowerCase())||rows[0];
  if(!row) throw createError({statusCode:404,statusMessage:`Leader could not find product ${productCode}.`});

  const stockByState={
    NSW:Number(row.AvailNsw||0), QLD:Number(row.AvailQld||0), VIC:Number(row.AvailVic||0),
    WA:Number(row.AvailWa||0), SA:Number(row.AvailSa||0)
  };
  const totalStock=Object.values(stockByState).reduce((a:number,b:any)=>a+Number(b||0),0);
  const vendorUrl=String(row.VendorURL||"").trim();

  return {
    authenticated:true,
    source:"leader-getproducts",
    source_url:url,
    supplier_sku:String(row.PartNum||productCode),
    product_id:row.ProductID,
    name:String(row.ProductName||""),
    description:String(row.ProductDescription||""),
    brand:String(row.VendorName||""),
    mpn:String(row.PartNumManuf||""),
    gtin:"",
    price_ex_gst:Number(row.PrEx1 ?? row.Price1 ?? 0),
    price_inc_gst:Number(row.PrInc1 ?? row.PriceInc1 ?? 0),
    rrp_ex_gst:Number(row.RRPEx||0),
    rrp_inc_gst:Number(row.RRPInc||0),
    category:String(row.Category||""),
    subcategory:String(row.SubCategory||""),
    stock:String(totalStock),
    stock_total:totalStock,
    stock_by_state:stockByState,
    box_length_mm:Number(row.BoxLength||0),
    box_width_mm:Number(row.BoxWidth||0),
    box_height_mm:Number(row.BoxHeight||0),
    vendor_url:vendorUrl,
    images:leaderImages(String(row.PartNum||""),String(row.PartNumManuf||"")),
    raw_summary:{vendor_id:row.VendorID,vendor_code:row.VendTenCode,created:row.CreateTS}
  };
});
