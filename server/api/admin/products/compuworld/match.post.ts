import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

type Item = {sku?:string;mpn?:string;gtin?:string};
const norm=(v:unknown)=>String(v??"").trim().toUpperCase().replace(/\\s+/g,"");
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const body=await readBody(event);
  if(!Array.isArray(body?.items)||body.items.length>500)throw createError({statusCode:400,statusMessage:"Expected up to 500 supplier products"});
  const db=getAdminSupabase();
  async function all(table:string,columns:string){
    const records:any[]=[];
    for(let start=0;start<100000;start+=1000){
      const {data,error}=await db.from(table).select(columns).range(start,start+999);
      if(error)throw createError({statusCode:500,statusMessage:`Could not check existing ${table}`});
      records.push(...(data||[]));
      if((data||[]).length<1000)break;
    }
    return records;
  }
  const [products,variants]=await Promise.all([
    all("products","id,name,product_code,mpn,gtin,active"),
    all("product_variants","id,product_id,name,product_code,active")
  ]);
  const byCode=new Map<string,any[]>(),byMpn=new Map<string,any[]>(),byGtin=new Map<string,any[]>();
  function add(map:Map<string,any[]>,value:unknown,item:any){const key=norm(value);if(key)map.set(key,[...(map.get(key)||[]),item])}
  for(const p of products){add(byCode,p.product_code,p);add(byMpn,p.mpn,p);add(byGtin,p.gtin,p)}
  for(const v of variants)add(byCode,v.product_code,v);
  return {matches:(body.items as Item[]).map(item=>{
    const sku=norm(item?.sku),mpn=norm(item?.mpn),gtin=norm(item?.gtin);
    if(!sku&&!mpn&&!gtin)return {status:"review",reason:"No matching identifiers supplied"};
    const hits=[...(sku?byCode.get(sku)||[]:[]),...(mpn?byMpn.get(mpn)||[]:[]),...(gtin?byGtin.get(gtin)||[]:[])];
    const unique=[...new Map(hits.map(x=>[`${"product_id" in x?"v":"p"}:${x.id}`,x])).values()];
    if(unique.length>1)return {status:"review",reason:"Multiple existing products or variations match"};
    if(unique.length===1)return {status:"existing",reason:"Matching product or variation exists",name:unique[0].name};
    return {status:"new",reason:"No matching product found"};
  })};
});
