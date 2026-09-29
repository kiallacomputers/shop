import { firstProductImage, plainDescriptionText, seoDescription } from "~~/server/utils/productSeo";

const clean = (v:unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const xml = (v:unknown) => clean(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const money = (v:unknown) => `${Math.max(0, Number(v || 0)).toFixed(2)} AUD`;
const absUrl = (site:string, value:unknown) => {
  const v=clean(value); if(!v) return "";
  if(/^https?:\/\//i.test(v)) return v;
  return `${site.replace(/\/$/,"")}/${v.replace(/^\//,"")}`;
};
const allImages=(value:unknown)=>{
  if(Array.isArray(value)) return value.map(clean).filter(Boolean);
  if(typeof value==="string"){ try{const p=JSON.parse(value);if(Array.isArray(p))return p.map(clean).filter(Boolean)}catch{} }
  return [];
};
const availability=(p:any,v?:any)=>{
  const stock=Number(v?.stock ?? p?.stock ?? 0);
  if(stock>0) return "in_stock";
  return "out_of_stock";
};
const condition=(p:any)=>p?.refurbished ? "refurbished" : "new";

export const merchantHealthIssues=(p:any,v?:any)=>{
  const issues:any[]=[];
  const code=clean(v?.product_code || p?.product_code);
  const title=clean(v?.name ? `${p?.name || ""} - ${v.name}` : p?.name);
  const desc=clean(seoDescription(p,5000) || plainDescriptionText(p?.description));
  const image=clean(firstProductImage(v?.images) || firstProductImage(p?.images));
  const price=Number(v?.price ?? p?.price ?? 0);
  const brand=clean(p?.brand);
  const gtin=clean(v?.gtin || (!v ? p?.gtin : ""));
  const mpn=clean(v?.mpn || (!v ? p?.mpn : ""));
  const shippingWeight=Number(p?.weight_kg || 0);
  if(!code) issues.push(["missing_id","Missing SKU / ID","error"]);
  if(!title) issues.push(["missing_title","Missing title","error"]);
  if(!clean(p?.slug)) issues.push(["missing_link","Missing product URL","error"]);
  if(!desc) issues.push(["missing_description","Missing description","error"]);
  if(!image) issues.push(["missing_image","Missing image","error"]);
  if(!(price>0)) issues.push(["invalid_price","Missing or zero public price","error"]);
  if(!brand) issues.push(["missing_brand","Missing brand","warning"]);
  if(!gtin && !mpn) issues.push(["missing_identifier","Missing GTIN / MPN","warning"]);
  if(!(shippingWeight>0)) issues.push(["missing_shipping_weight","Missing shipping weight","error"]);
  if(v && !clean(p?.product_code)) issues.push(["missing_item_group","Missing parent SKU for item_group_id","warning"]);
  return issues.map(([key,label,severity])=>({key,label,severity}));
};

export const merchantItemsForProduct=(p:any,site:string)=>{
  const variants=Array.isArray(p?.product_variants) ? p.product_variants.filter((v:any)=>v?.active!==false) : [];
  const rows=variants.length ? variants : [null];
  return rows.map((v:any)=>{
    const images=allImages(p.images);
    const primary=clean(firstProductImage(v?.images) || firstProductImage(images));
    const extras=images.filter(x=>x!==primary).slice(0,10);
    const id=clean(v?.product_code || p.product_code || `${p.id}${v?`-${v.id}`:""}`);
    const title=clean(v?.name ? `${p.name} - ${v.name}` : p.name);
    const gtin=clean(v?.gtin || (!v ? p.gtin : ""));
    const mpn=clean(v?.mpn || (!v ? p.mpn : ""));
    const price=Number(v?.price ?? p.price ?? 0);
    const shippingWeightKg=Number(p?.weight_kg || 0);
    const item:any={
      id,title,description:seoDescription(p,5000),link:`${site}/product/${encodeURIComponent(clean(p.slug))}`,
      image_link:absUrl(site,primary),additional_image_link:extras.map(x=>absUrl(site,x)),
      availability:availability(p,v),price:money(price),condition:condition(p),brand:clean(p.brand),
      gtin,mpn,item_group_id:v?clean(p.product_code || p.id):"",
      shipping_weight:shippingWeightKg>0 ? `${shippingWeightKg.toFixed(3)} kg` : "",
      issues:merchantHealthIssues(p,v),product_id:p.id,variant_id:v?.id || null,
    };
    return item;
  });
};

export const merchantXml=(items:any[])=>`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>
<title>Kialla Computers Product Feed</title>
<link>https://shop.kiallacomputers.com.au</link>
<description>Kialla Computers products for Google Merchant Center</description>
${items.map(i=>`<item>
<g:id>${xml(i.id)}</g:id><g:title>${xml(i.title)}</g:title><g:description>${xml(i.description)}</g:description>
<g:link>${xml(i.link)}</g:link><g:image_link>${xml(i.image_link)}</g:image_link>
${i.additional_image_link.map((x:string)=>`<g:additional_image_link>${xml(x)}</g:additional_image_link>`).join("")}
<g:availability>${xml(i.availability)}</g:availability><g:price>${xml(i.price)}</g:price><g:condition>${xml(i.condition)}</g:condition>
${i.brand?`<g:brand>${xml(i.brand)}</g:brand>`:""}${i.gtin?`<g:gtin>${xml(i.gtin)}</g:gtin>`:""}${i.mpn?`<g:mpn>${xml(i.mpn)}</g:mpn>`:""}
${i.item_group_id?`<g:item_group_id>${xml(i.item_group_id)}</g:item_group_id>`:""}${i.shipping_weight?`<g:shipping_weight>${xml(i.shipping_weight)}</g:shipping_weight>`:""}
</item>`).join("\n")}
</channel></rss>`;
