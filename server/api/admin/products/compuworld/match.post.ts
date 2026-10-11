import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

type Candidate = {sku?:string;mpn?:string;gtin?:string};
const norm = (value:unknown) => String(value??'').trim().toUpperCase().replace(/[\s-]/g,'');
const money = (value:unknown) => value == null ? null : Number(value);

export default defineEventHandler(async event => {
  await requireAdmin(event);
  const body = await readBody(event);
  if (!Array.isArray(body?.items) || body.items.length > 500)
    throw createError({statusCode:400,statusMessage:'Expected up to 500 products'});
  const db = getAdminSupabase();
  async function readAll(table:string, columns:string) {
    const result:any[]=[];
    for(let offset=0;offset<100000;offset+=1000) {
      const {data,error}=await db.from(table).select(columns).range(offset,offset+999);
      if(error) throw createError({statusCode:500,statusMessage:`Unable to read ${table}: ${error.message}`});
      result.push(...(data||[]));
      if((data||[]).length<1000) break;
    }
    return result;
  }
  const [products,variants,links,suppliers]=await Promise.all([
    readAll('products','*'),readAll('product_variants','*'),
    readAll('accounting_product_suppliers','product_id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary'),
    readAll('accounting_suppliers','id,name')
  ]);
  const supplierNames = new Map(suppliers.map(s=>[Number(s.id),String(s.name)]));
  const compuworldIds = new Set(suppliers.filter(s=>/compuworld/i.test(s.name)).map(s=>Number(s.id)));
  const supplierLinks = new Map<number,any[]>();
  for(const link of links) supplierLinks.set(Number(link.product_id),[...(supplierLinks.get(Number(link.product_id))||[]),link]);
  const codeIndex=new Map<string,any[]>(),mpnIndex=new Map<string,any[]>(),gtinIndex=new Map<string,any[]>(),compuworldIndex=new Map<string,any[]>();
  function index(map:Map<string,any[]>,key:unknown,record:any){const k=norm(key);if(k)map.set(k,[...(map.get(k)||[]),record]);}
  for(const product of products) {
    const record={...product,kind:'product',productId:Number(product.id)};
    index(codeIndex,product.product_code,record);
    index(mpnIndex,product.mpn||product.manufacturer_part_number,record);
    index(gtinIndex,product.gtin||product.barcode,record);
  }
  for(const variant of variants) {
    const record={...variant,kind:'variant',productId:Number(variant.product_id)};
    index(codeIndex,variant.product_code,record);
    index(mpnIndex,variant.mpn||variant.manufacturer_part_number,record);
    index(gtinIndex,variant.gtin||variant.barcode,record);
  }
  for(const link of links) if(compuworldIds.has(Number(link.supplier_id))) {
    const p=products.find(p=>Number(p.id)===Number(link.product_id));
    if(p)index(compuworldIndex,link.supplier_sku,{...p,kind:'product',productId:Number(p.id)});
  }
  return {matches:(body.items as Candidate[]).map(item=>{
    const sku=norm(item?.sku),mpn=norm(item?.mpn),gtin=norm(item?.gtin);
    if(!sku&&!mpn&&!gtin) return {status:'review',reason:'No identifiers to compare'};
    // Supplier SKU is only trusted when already linked to Compuworld. Different suppliers use different SKUs.
    const linked=sku?(compuworldIndex.get(sku)||[]):[];
    const strong=[...(mpn?mpnIndex.get(mpn)||[]:[]),...(gtin?gtinIndex.get(gtin)||[]:[])];
    const candidates=[...linked,...strong];
    const unique=[...new Map(candidates.map(r=>[`${r.kind}:${r.id}`,r])).values()];
    if(unique.length>1)return {status:'review',reason:'Multiple product/variation matches; verify manually'};
    if(unique.length===0) {
      // Matching shop SKU alone is not enough to establish that two suppliers sell the same item.
      if(sku&&(codeIndex.get(sku)||[]).length)return {status:'review',reason:'Shop product code matches, but supplier identity is unverified'};
      return {status:'new',reason:'No existing product found'};
    }
    const matched=unique[0];
    const related=supplierLinks.get(matched.productId)||[];
    const names=[...new Set(related.map(l=>supplierNames.get(Number(l.supplier_id))).filter(Boolean))];
    const leader=related.find(l=>/leader/i.test(supplierNames.get(Number(l.supplier_id))||''));
    const compuworld=related.find(l=>compuworldIds.has(Number(l.supplier_id)));
    return {
      status:'existing',reason:linked.length?'Previously linked to Compuworld':'Matched manufacturer part number or barcode',
      name:matched.name,productId:matched.productId,variantId:matched.kind==='variant'?Number(matched.id):null,
      supplierNames:names,leaderBuyPrice:leader?money(leader.buy_price_ex_gst):null,
      alreadyLinkedCompuworld:Boolean(compuworld),
      active:matched.active!==false
    };
  })};
});
