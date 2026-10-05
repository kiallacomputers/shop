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
async function leaderPost(path:string, form:URLSearchParams, cookie:string, referer:string){
  const res=await fetch(`https://partner.leadersystems.com.au/WSLD.asmx/${path}`,{
    method:"POST",
    headers:{
      "content-type":"application/x-www-form-urlencoded",
      "accept":"*/*",
      "cookie":cookie,
      "origin":"https://partner.leadersystems.com.au",
      "referer":referer,
      "user-agent":"Mozilla/5.0 (compatible; KiallaComputersCategoryImporter/1.1)"
    },
    body:form.toString(),
    redirect:"manual",
    signal:AbortSignal.timeout(20000)
  });
  if([302,303,401,403].includes(res.status))
    throw createError({statusCode:422,statusMessage:"Leader session is no longer authenticated. Update LEADER_SESSION_COOKIE."});
  if(!res.ok)
    throw createError({statusCode:502,statusMessage:`Leader ${path} returned HTTP ${res.status}.`});
  const xml=await res.text();
  const m=xml.match(/<string[^>]*>([\s\S]*?)<\/string>/i);
  if(!m) throw createError({statusCode:502,statusMessage:`Unexpected Leader ${path} response.`});
  try { return JSON.parse(xmlDecode(m[1])); }
  catch { throw createError({statusCode:502,statusMessage:`Leader ${path} data could not be decoded.`}); }
}

function norm(v:any){
  return String(v??"").toLowerCase().replace(/&amp;/g,"&").replace(/[^a-z0-9]+/g," ").trim();
}
function firstValue(o:any, keys:string[]){
  for(const k of keys){
    const v=o?.[k];
    if(v!==undefined && v!==null && String(v).trim()!=="") return String(v).trim();
  }
  return "";
}
function flattenCategoryRows(input:any):any[]{
  const out:any[]=[];
  const walk=(v:any)=>{
    if(Array.isArray(v)){ v.forEach(walk); return; }
    if(v && typeof v==="object"){
      out.push(v);
      for(const x of Object.values(v)){
        if(Array.isArray(x) || (x && typeof x==="object")) walk(x);
      }
    }
  };
  walk(input);
  return out;
}
function mapCategories(raw:any){
  const rows=flattenCategoryRows(raw);
  const mapped=rows.map((r:any)=>{
    const name=firstValue(r,["CategoryName","Category","CatName","Name","Description","DisplayName","Text","label","Label"]);
    const code=firstValue(r,["TenciaCode","CategoryCode","CatCode","Code","Value","value","ID","Id","id"]);
    return {name,code,raw:r};
  }).filter((x:any)=>x.name && x.code && x.name!==x.code);

  const seen=new Set<string>();
  return mapped.filter((x:any)=>{
    const key=`${x.code}|${x.name}`;
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });
}
async function getCategoryMap(cookie:string, referer:string){
  // The Leader browser sends FullList=0 to ProductCategory.
  // Try that exact request first; FullList=1 is a safe fallback if Leader
  // only returns the complete mapping in full-list mode.
  for(const full of ["0","1"]){
    const raw=await leaderPost("ProductCategory",new URLSearchParams({FullList:full}),cookie,referer);
    const mapped=mapCategories(raw);
    if(mapped.length) return mapped;
  }
  return [];
}
async function getProducts(categoryCode:string,cookie:string,customerCode:string,referer:string){
  return await leaderPost("GetProducts",new URLSearchParams({
    Prod:"",
    Category:categoryCode,
    SubCategory:"",
    OnlyAvailable:"0",
    Vendor:"",
    VendorTenCode:"",
    CustomerCode:customerCode,
    ExactMatch:"0"
  }),cookie,referer);
}
function resolveCategory(categories:any[], wanted:string){
  const n=norm(wanted);
  if(!n) return null;
  return categories.find((x:any)=>norm(x.name)===n)
      || categories.find((x:any)=>norm(x.code)===n)
      || categories.find((x:any)=>norm(x.name).includes(n) || n.includes(norm(x.name)))
      || null;
}
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const body=await readBody(event);
  const url=String(body?.url||"").trim();
  const override=String(body?.category||"").trim();

  if(!url) throw createError({statusCode:400,statusMessage:"Leader category URL is required."});
  const u=new URL(url);
  if(u.protocol!=="https:"||u.hostname.toLowerCase()!=="partner.leadersystems.com.au"||!u.pathname.toLowerCase().includes("categories"))
    throw createError({statusCode:400,statusMessage:"Enter a Leader categories.html URL."});

  const cookie=String(process.env.LEADER_SESSION_COOKIE||"").trim();
  const customerCode=String(process.env.LEADER_CUSTOMER_CODE||"").trim();
  if(!cookie||!customerCode) throw createError({statusCode:422,statusMessage:"Leader integration is not configured."});

  // ProductCategory is the source of truth for Leader's display-name -> internal-code mapping.
  // Example observed in Leader: "Hard Disk Drives - SSD" -> "HB".
  const categories=await getCategoryMap(cookie,url);

  let detectedName="";
  if(!override){
    const page=await fetch(url,{
      headers:{cookie,"user-agent":"Mozilla/5.0 (compatible; KiallaComputersCategoryImporter/1.1)"},
      redirect:"manual",
      signal:AbortSignal.timeout(12000)
    });
    if([302,303,401,403].includes(page.status))
      throw createError({statusCode:422,statusMessage:"Leader session is no longer authenticated."});
    if(page.ok) detectedName=detectCategory(await page.text());
  }

  const wanted=override||detectedName;
  if(!wanted){
    return {
      needs_category:true,
      categories:categories.map((x:any)=>({name:x.name,code:x.code})).sort((a:any,b:any)=>a.name.localeCompare(b.name)),
      category:"",
      category_code:"",
      subcategories:[],
      count:0,
      products:[]
    };
  }

  const match=resolveCategory(categories,wanted);
  if(!match){
    throw createError({
      statusCode:422,
      statusMessage:`Leader category "${wanted}" was not found in ProductCategory. Choose a category from the Leader category list.`
    });
  }

  const category=match.name;
  const categoryCode=match.code;
  const rows:any[]=await getProducts(categoryCode,cookie,customerCode,url);

  const s=getAdminSupabase();
  const [{data:products},{data:links}]=await Promise.all([
    s.from("products").select("id,name,product_code,gtin,mpn,category_id"),
    s.from("accounting_product_suppliers").select("product_id,supplier_sku")
  ]);

  const byCode=new Map((products||[]).map((p:any)=>[String(p.product_code||"").toLowerCase(),p]));
  const byGtin=new Map((products||[]).filter((p:any)=>p.gtin).map((p:any)=>[String(p.gtin),p]));
  const byMpn=new Map((products||[]).filter((p:any)=>p.mpn).map((p:any)=>[String(p.mpn).toLowerCase(),p]));
  const linkMap=new Map((links||[]).filter((x:any)=>x.supplier_sku).map((x:any)=>[String(x.supplier_sku).toLowerCase(),Number(x.product_id)]));
  const productById=new Map((products||[]).map((p:any)=>[Number(p.id),p]));

  const mapped=rows.map((r:any)=>{
    const gtin=cleanGtin(r.ProductBarcode??r.Barcode??r.BarCode??r.GTIN??r.EAN??r.UPC);
    const sku=String(r.PartNum||"").trim(),mpn=String(r.PartNumManuf||"").trim();
    const existing=productById.get(linkMap.get(sku.toLowerCase())||0)
      ||byCode.get(sku.toLowerCase())
      ||(gtin?byGtin.get(gtin):null)
      ||(mpn?byMpn.get(mpn.toLowerCase()):null);
    const states={
      VIC:Number(r.AvailVic||0),NSW:Number(r.AvailNsw||0),QLD:Number(r.AvailQld||0),
      SA:Number(r.AvailSa||0),WA:Number(r.AvailWa||0)
    };
    return {
      leader_product_id:r.ProductID,
      supplier_sku:sku,
      name:String(r.ProductName||""),
      description:String(r.ProductDescription||""),
      brand:String(r.VendorName||""),
      mpn,gtin,
      buy_price_ex_gst:Number(r.PrEx1??r.Price1??0),
      rrp_inc_gst:Number(r.RRPInc||0),
      leader_category:String(r.Category||category),
      leader_category_code:categoryCode,
      leader_subcategory:String(r.SubCategory||"Uncategorised"),
      stock_by_state:states,
      stock_total:Object.values(states).reduce((a:number,b:any)=>a+Number(b||0),0),
      images:imageUrls(r),
      box_length_mm:Number(r.BoxLength||0),
      box_width_mm:Number(r.BoxWidth||0),
      box_height_mm:Number(r.BoxHeight||0),
      existing_product_id:existing?.id||null,
      existing_name:existing?.name||null,
      status:existing?"existing":"new"
    };
  });

  return {
    needs_category:false,
    category,
    category_code:categoryCode,
    categories:categories.map((x:any)=>({name:x.name,code:x.code})).sort((a:any,b:any)=>a.name.localeCompare(b.name)),
    subcategories:[...new Set(mapped.map((x:any)=>x.leader_subcategory))].sort(),
    count:mapped.length,
    products:mapped
  };
});
