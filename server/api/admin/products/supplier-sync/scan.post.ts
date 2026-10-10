import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const decodeXml=(v:string)=>v.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
async function leaderProduct(code:string){
  const cookie=String(process.env.LEADER_SESSION_COOKIE||"").trim();
  const customerCode=String(process.env.LEADER_CUSTOMER_CODE||"").trim();
  if(!cookie||!customerCode) throw createError({statusCode:422,statusMessage:"Leader integration is not configured."});
  const form=new URLSearchParams({Prod:code,Category:"",SubCategory:"",OnlyAvailable:"",Vendor:"",VendorTenCode:"",CustomerCode:customerCode,ExactMatch:"0"});
  const res=await fetch("https://partner.leadersystems.com.au/WSLD.asmx/GetProducts",{method:"POST",headers:{
    "content-type":"application/x-www-form-urlencoded","accept":"*/*","cookie":cookie,
    "origin":"https://partner.leadersystems.com.au","referer":"https://partner.leadersystems.com.au/",
    "user-agent":"Mozilla/5.0 (compatible; KiallaComputersSupplierSync/1.0)"
  },body:form.toString(),signal:AbortSignal.timeout(8000)});
  if([302,303,401,403].includes(res.status)) throw createError({statusCode:422,statusMessage:"Leader session is no longer authenticated. Update LEADER_SESSION_COOKIE."});
  if(!res.ok) throw new Error(`Leader HTTP ${res.status}`);
  const xml=await res.text(), m=xml.match(/<string[^>]*>([\s\S]*?)<\/string>/i);
  if(!m) throw new Error("Unexpected Leader response");
  const rows=JSON.parse(decodeXml(m[1]));
  const row=rows.find((x:any)=>String(x.PartNum||"").toLowerCase()===code.toLowerCase())||rows[0];
  if(!row) return null;
  const byState={NSW:Number(row.AvailNsw||0),QLD:Number(row.AvailQld||0),VIC:Number(row.AvailVic||0),WA:Number(row.AvailWa||0),SA:Number(row.AvailSa||0)};
  return {buy:Number(row.PrEx1??row.Price1??0),rrp:Number(row.RRPInc||0),stock:Object.values(byState).reduce((a:number,b:any)=>a+Number(b||0),0),byState,name:String(row.ProductName||"")};
}
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const body=await readBody(event);
  const ids=Array.isArray(body?.product_ids)?body.product_ids.map(Number).filter(Boolean):[];
  const s=getAdminSupabase();
  // Load supplier links first, then suppliers/products separately. This avoids
  // PostgREST relationship/foreign-key ambiguity causing the whole scan to 500.
  let q=s.from("accounting_product_suppliers")
    .select("id,product_id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary")
    .eq("is_primary",true);
  if(ids.length) q=q.in("product_id",ids);
  const {data:linkRows,error:linkError}=await q;
  if(linkError) throw createError({statusCode:500,statusMessage:`Unable to load product supplier links: ${linkError.message}`});

  const rawLinks=linkRows||[];
  const supplierIds=[...new Set(rawLinks.map((x:any)=>Number(x.supplier_id)).filter(Boolean))];
  const productIds=[...new Set(rawLinks.map((x:any)=>Number(x.product_id)).filter(Boolean))];

  const supplierMap=new Map<number,any>();
  if(supplierIds.length){
    const {data:suppliers,error:supplierError}=await s.from("accounting_suppliers").select("id,name").in("id",supplierIds);
    if(supplierError) throw createError({statusCode:500,statusMessage:`Unable to load suppliers: ${supplierError.message}`});
    for(const row of suppliers||[]) supplierMap.set(Number(row.id),row);
  }

  const productMap=new Map<number,any>();
  if(productIds.length){
    // Only request columns needed by this screen. Keeping this list conservative
    // also makes the sync compatible with older product-table migrations.
    const {data:products,error:productError}=await s.from("products")
      .select("id,name,product_code,buy_price_ex_gst,price,oldPrice,has_variants,active")
      .in("id",productIds);
    if(productError) throw createError({statusCode:500,statusMessage:`Unable to load products: ${productError.message}`});
    for(const row of products||[]) productMap.set(Number(row.id),row);
  }

  const variantMap=new Map<number,any[]>();
  if(productIds.length){
    const {data:variants,error:variantError}=await s.from("product_variants").select("id,product_id,name,product_code,buy_price_ex_gst,price,old_price,active").in("product_id",productIds).eq("active",true);
    if(variantError) throw createError({statusCode:500,statusMessage:`Unable to load product variations: ${variantError.message}`});
    for(const v of variants||[]){const a=variantMap.get(Number(v.product_id))||[];a.push(v);variantMap.set(Number(v.product_id),a);}
  }
  const links=rawLinks
    .map((x:any)=>({...x,accounting_suppliers:supplierMap.get(Number(x.supplier_id)),products:productMap.get(Number(x.product_id))}))
    .filter((x:any)=>/leader/i.test(String(x.accounting_suppliers?.name||""))&&String(x.supplier_sku||"").trim());

  const reviewMap=new Map<number,any>();
  if(productIds.length){
    const {data:reviews,error:reviewError}=await s.from("supplier_price_change_reviews").select("product_id,supplier_link_id,supplier_buy_price,status").in("product_id",productIds).eq("status","ignored");
    if(reviewError) throw createError({statusCode:500,statusMessage:`Unable to load price review decisions: ${reviewError.message}`});
    for(const row of reviews||[]) reviewMap.set(Number(row.product_id),row);
  }

  // Netlify functions have a finite request window. Scan a small page at a time
  // and query that page concurrently rather than waiting for every Leader request
  // sequentially. The UI automatically requests the next page.
  const requestedOffset=Math.max(0,Number(body?.offset)||0);
  const requestedLimit=Math.min(6,Math.max(1,Number(body?.limit)||6));
  const syncItems:any[]=[];for(const link of links){const p:any=link.products;if(!p || p.active===false)continue;if(!p.has_variants && !(variantMap.get(Number(link.product_id))||[]).length)syncItems.push({link,p,variant:null,sku:String(link.supplier_sku)});for(const v of variantMap.get(Number(link.product_id))||[]){if(String(v.product_code||"").trim())syncItems.push({link,p,variant:v,sku:String(v.product_code).trim()});}}
  const batch=syncItems.slice(requestedOffset,requestedOffset+requestedLimit);

  const results=await Promise.all(batch.map(async(item:any)=>{
    const link:any=item.link;
    const p:any=item.p;
    const v:any=item.variant;
    try{
      const remote=await leaderProduct(String(item.sku));
      if(!remote) return {row_key:v?`v:${v.id}`:`p:${link.product_id}`,product_id:link.product_id,variant_id:v?.id||null,link_id:link.id,name:v?`${p?.name} — ${v.name}`:p?.name,sku:item.sku,status:"not_found"};
      // Persist supplier warehouse availability separately from Kialla physical stock.
      // A successful Leader lookup refreshes all five warehouses, including zeros.
      const stockPayload={leader_stock_vic:Math.max(0,Number(remote.byState.VIC||0)),leader_stock_nsw:Math.max(0,Number(remote.byState.NSW||0)),leader_stock_qld:Math.max(0,Number(remote.byState.QLD||0)),leader_stock_sa:Math.max(0,Number(remote.byState.SA||0)),leader_stock_wa:Math.max(0,Number(remote.byState.WA||0)),leader_stock_updated_at:new Date().toISOString()};
      const stockSave=v?await s.from("product_variants").update(stockPayload).eq("id",v.id):await s.from("products").update(stockPayload).eq("id",link.product_id);const stockSaveError=stockSave.error;
      if(stockSaveError) throw new Error(`Unable to save Leader warehouse stock: ${stockSaveError.message}`);

      const currentBuy=Number(v?.buy_price_ex_gst??(v?0:(link.buy_price_ex_gst??p?.buy_price_ex_gst??0))), currentSell=Number(v?.price??p?.price??0), currentRrp=Number(v?.old_price??p?.oldPrice??0);
      const newBuy=remote.buy, delta=Math.round((newBuy-currentBuy)*100)/100, deltaPct=currentBuy>0?Math.round((delta/currentBuy)*10000)/100:0;
      const sellEx=currentSell/1.1, proposedMargin=sellEx>0?Math.round(((sellEx-newBuy)/sellEx)*10000)/100:0;
      const review=reviewMap.get(Number(link.product_id));
      const ignored=Boolean(review&&Number(review.supplier_link_id)===Number(link.id)&&Math.abs(Number(review.supplier_buy_price)-newBuy)<0.005);
      return {row_key:v?`v:${v.id}`:`p:${link.product_id}`,product_id:link.product_id,variant_id:v?.id||null,name:v?`${p?.name} — ${v.name}`:p?.name,variant_name:v?.name||null,sku:item.sku,link_id:link.id,current_buy:currentBuy,current_rrp:currentRrp,supplier_buy:newBuy,delta,delta_percent:deltaPct,current_sell:currentSell,supplier_rrp:remote.rrp,supplier_stock:remote.stock,stock_by_state:remote.byState,proposed_margin:proposedMargin,changed:Math.abs(delta)>=0.01,ignored,status:"ok"};
    }catch(e:any){
      return {row_key:v?`v:${v.id}`:`p:${link.product_id}`,product_id:link.product_id,variant_id:v?.id||null,link_id:link.id,name:v?`${p?.name} — ${v.name}`:p?.name,sku:item.sku,status:"error",error:e?.statusMessage||e?.message||"Sync failed"};
    }
  }));

  const nextOffset=requestedOffset+batch.length;
  return {
    total:syncItems.length,
    offset:requestedOffset,
    processed:batch.length,
    next_offset:nextOffset<syncItems.length?nextOffset:null,
    checked:results.length,
    changed:results.filter((x:any)=>x.changed).length,
    results
  };
});