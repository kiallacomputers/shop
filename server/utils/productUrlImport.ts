import { createHash } from "node:crypto";

const text = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const decode = (s: string) => s
  .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'")
  .replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&nbsp;/gi," ");
const strip = (s: string) => text(decode(s.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ")));
const meta = (html:string, key:string) => {
  const esc=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const patterns=[
    new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']*)["'][^>]*>`,"i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${esc}["'][^>]*>`,"i"),
  ];
  for(const r of patterns){const m=html.match(r);if(m?.[1])return decode(m[1]).trim()}
  return "";
};
const money = (v:unknown) => {
  const m=String(v??"").replace(/,/g,"").match(/-?\$?\s*(\d+(?:\.\d{1,2})?)/);
  return m ? Number(m[1]) : null;
};
const absoluteUrl=(value:string,base:string)=>{try{return new URL(value,base).toString()}catch{return ""}};
const labelValue=(html:string,labels:string[])=>{
  for(const label of labels){
    const e=label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const patterns=[
      new RegExp(`<t[dh][^>]*>\\s*${e}\\s*<\\/t[dh]>\\s*<t[dh][^>]*>([\\s\\S]*?)<\\/t[dh]>`,"i"),
      new RegExp(`<[^>]+>\\s*${e}\\s*<\\/[^>]+>\\s*<[^>]+>([\\s\\S]*?)<\\/[^>]+>`,"i"),
      new RegExp(`${e}\\s*[:\\-]\\s*([^<\\n\\r]{1,160})`,"i"),
    ];
    for(const r of patterns){const m=html.match(r);if(m?.[1]){const v=strip(m[1]);if(v)return v}}
  }
  return "";
};
const jsonLdProducts=(html:string)=>{
  const out:any[]=[];
  for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{
      const raw=JSON.parse(m[1].trim());
      const walk=(x:any)=>{if(!x)return;if(Array.isArray(x))return x.forEach(walk);if(typeof x==="object"){if(x["@type"]==="Product"||(Array.isArray(x["@type"])&&x["@type"].includes("Product")))out.push(x);if(x["@graph"])walk(x["@graph"])}};
      walk(raw);
    }catch{}
  }
  return out;
};
const imageList=(html:string,base:string,product:any)=>{
  const raw:any[]=[];
  if(product?.image) raw.push(...(Array.isArray(product.image)?product.image:[product.image]));
  for(const k of ["og:image","twitter:image"]){const v=meta(html,k);if(v)raw.push(v)}
  for(const m of html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi)) raw.push(m[1]);
  return [...new Set(raw.map(x=>absoluteUrl(typeof x==="string"?x:x?.url||"",base)).filter(x=>/^https?:\/\//i.test(x)))].slice(0,12);
};

export function allowedSupplierHost(host:string){
  const configured=String(process.env.SUPPLIER_IMPORT_ALLOWED_HOSTS||"partner.leadersystems.com.au")
    .split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  const h=host.toLowerCase();
  return configured.some(x=>h===x||h.endsWith("."+x));
}
export function allowedPublicVendorHost(host:string){
  const blocked=["localhost","127.0.0.1","0.0.0.0","::1"];
  const h=host.toLowerCase();
  if(blocked.includes(h)||h.endsWith(".local"))return false;
  return !/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
}
export async function fetchHtml(url:string,opts:{supplier?:boolean}={}){
  const u=new URL(url);
  if(u.protocol!=="https:")throw createError({statusCode:400,statusMessage:"Only HTTPS product URLs are allowed"});
  if(opts.supplier&&!allowedSupplierHost(u.hostname))throw createError({statusCode:400,statusMessage:`Supplier host ${u.hostname} is not allowed`});
  if(!opts.supplier&&!allowedPublicVendorHost(u.hostname))throw createError({statusCode:400,statusMessage:"That vendor host is not allowed"});
  const headers:any={"user-agent":"Mozilla/5.0 (compatible; KiallaComputersProductImporter/1.0)","accept":"text/html,application/xhtml+xml"};
  if(opts.supplier&&u.hostname==="partner.leadersystems.com.au"&&process.env.LEADER_SESSION_COOKIE)headers.cookie=process.env.LEADER_SESSION_COOKIE;
  const res=await fetch(u.toString(),{headers,redirect:"follow",signal:AbortSignal.timeout(15000)});
  if(!res.ok)throw createError({statusCode:502,statusMessage:`Product page returned HTTP ${res.status}`});
  const ct=res.headers.get("content-type")||"";
  if(!ct.includes("text/html"))throw createError({statusCode:400,statusMessage:"The URL did not return an HTML product page"});
  const html=(await res.text()).slice(0,4_000_000);
  return {html,url:res.url};
}
export function extractProduct(html:string,url:string){
  const product=jsonLdProducts(html)[0]||{};
  const offers=Array.isArray(product.offers)?product.offers[0]:product.offers||{};
  const brand=typeof product.brand==="string"?product.brand:product.brand?.name;
  const title=text(product.name)||meta(html,"og:title")||meta(html,"twitter:title")||strip((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||"");
  const description=text(product.description)||meta(html,"og:description")||meta(html,"description");
  const sku=text(product.sku)||labelValue(html,["Supplier SKU","SKU","Product Code","Item Code","Part Number"]);
  const mpn=text(product.mpn)||labelValue(html,["Manufacturer Part Number","Manufacturer Part No","MPN","Mfr Part Number","Part Number"]);
  const gtin=text(product.gtin13||product.gtin14||product.gtin12||product.gtin8||product.gtin)||labelValue(html,["GTIN","EAN","UPC","Barcode"]);
  const detectedBrand=text(brand)||labelValue(html,["Manufacturer","Brand","Vendor"]);
  const price=money(offers.price)||money(labelValue(html,["Your Price","Dealer Price","Buy Price","Price ex GST","Ex GST","Price"]));
  const stock=text(offers.availability).split("/").pop()||labelValue(html,["Availability","Stock","Stock Status"]);
  const canonical=(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)||[])[1]||url;
  const vendorUrl=labelValue(html,["Manufacturer URL","Vendor URL","Product Website"]);
  const resolvedVendor=absoluteUrl(vendorUrl,url);
  let safeVendorUrl="";
  if(resolvedVendor){
    try{
      const sourceHost=new URL(url).hostname.toLowerCase();
      const vendorHost=new URL(resolvedVendor).hostname.toLowerCase();
      if(vendorHost!==sourceHost) safeVendorUrl=resolvedVendor;
    }catch{}
  }
  return {
    source_url:url,canonical_url:absoluteUrl(canonical,url),name:title,description,brand:detectedBrand,
    supplier_sku:sku,mpn,gtin,price_ex_gst:price,stock,images:imageList(html,url,product),
    vendor_url:safeVendorUrl,
  };
}
export const slugify=(v:string)=>text(v).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
