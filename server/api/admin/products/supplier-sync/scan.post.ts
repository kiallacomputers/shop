import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const decodeXml=(v:string)=>v.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
async function leaderProduct(code:string){
  const cookie=String(process.env.LEADER_SESSION_COOKIE||"").trim(), customerCode=String(process.env.LEADER_CUSTOMER_CODE||"").trim();
  if(!cookie||!customerCode) throw createError({statusCode:422,statusMessage:"Leader integration is not configured."});
  const form=new URLSearchParams({Prod:code,Category:"",SubCategory:"",OnlyAvailable:"",Vendor:"",VendorTenCode:"",CustomerCode:customerCode,ExactMatch:"0"});
  const res=await fetch("https://partner.leadersystems.com.au/WSLD.asmx/GetProducts",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","accept":"*/*","cookie":cookie,"origin":"https://partner.leadersystems.com.au","referer":"https://partner.leadersystems.com.au/","user-agent":"Mozilla/5.0 (compatible; KiallaComputersSupplierSync/1.0)"},body:form.toString(),signal:AbortSignal.timeout(8000)});
  if([302,303,401,403].includes(res.status)) throw createError({statusCode:422,statusMessage:"Leader session is no longer authenticated. Update LEADER_SESSION_COOKIE."});
  if(!res.ok) throw new Error(`Leader HTTP ${res.status}`);
  const xml=await res.text(),m=xml.match(/<string[^>]*>([\s\S]*?)<\/string>/i); if(!m) throw new Error("Unexpected Leader response");
  const rows=JSON.parse(decodeXml(m[1])),row=rows.find((x:any)=>String(x.PartNum||"").toLowerCase()===code.toLowerCase())||rows[0]; if(!row)return null;
  const byState={NSW:Number(row.AvailNsw||0),QLD:Number(row.AvailQld||0),VIC:Number(row.AvailVic||0),WA:Number(row.AvailWa||0),SA:Number(row.AvailSa||0)};
  return {buy:Number(row.PrEx1??row.Price1??0),rrp:Number(row.RRPInc||0),stock:Object.values(byState).reduce((a:number,b:any)=>a+Number(b||0),0),byState};
}
const n=(v:any)=>Math.max(0,Number(v||0));
export default defineEventHandler(async(event)=>{
  const user:any=await requireAdmin(event), body=await readBody(event), s=getAdminSupabase();
  const ids=Array.isArray(body?.product_ids)?body.product_ids.map(Number).filter(Boolean):[];
  let q=s.from("accounting_product_suppliers").select("id,product_id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary").eq("is_primary",true); if(ids.length)q=q.in("product_id",ids);
  const {data:linkRows,error:linkError}=await q; if(linkError)throw createError({statusCode:500,statusMessage:`Unable to load product supplier links: ${linkError.message}`});
  const rawLinks=linkRows||[],supplierIds=[...new Set(rawLinks.map((x:any)=>Number(x.supplier_id)).filter(Boolean))],productIds=[...new Set(rawLinks.map((x:any)=>Number(x.product_id)).filter(Boolean))];
  const supplierMap=new Map<number,any>(),productMap=new Map<number,any>();
  if(supplierIds.length){const {data,error}=await s.from("accounting_suppliers").select("id,name").in("id",supplierIds);if(error)throw createError({statusCode:500,statusMessage:error.message});for(const x of data||[])supplierMap.set(Number(x.id),x)}
  if(productIds.length){const {data,error}=await s.from("products").select("id,name,product_code,buy_price_ex_gst,price,leader_stock_vic,leader_stock_nsw,leader_stock_qld,leader_stock_sa,leader_stock_wa").in("id",productIds);if(error)throw createError({statusCode:500,statusMessage:error.message});for(const x of data||[])productMap.set(Number(x.id),x)}
  const links=rawLinks.map((x:any)=>({...x,accounting_suppliers:supplierMap.get(Number(x.supplier_id)),products:productMap.get(Number(x.product_id))})).filter((x:any)=>/leader/i.test(String(x.accounting_suppliers?.name||""))&&String(x.supplier_sku||"").trim());
  const offset=Math.max(0,Number(body?.offset)||0),limit=Math.min(6,Math.max(1,Number(body?.limit)||6)),batch=links.slice(offset,offset+limit);
  let runId=Number(body?.run_id)||0;
  if(!runId){const {data,error}=await s.from("supplier_sync_runs").insert({supplier_name:"Leader Systems",status:"running",total_products:links.length,started_by:user?.id||user?.sub||null}).select("id").single();if(error)throw createError({statusCode:500,statusMessage:`Unable to create sync history: ${error.message}. Run the supplied SQL migration first.`});runId=Number(data.id)}
  const results=await Promise.all(batch.map(async(link:any)=>{const p:any=link.products;try{
    const remote=await leaderProduct(String(link.supplier_sku));if(!remote)return {product_id:link.product_id,link_id:link.id,name:p?.name,sku:link.supplier_sku,status:"not_found",error:"Product not found at Leader"};
    const oldState={VIC:n(p?.leader_stock_vic),NSW:n(p?.leader_stock_nsw),QLD:n(p?.leader_stock_qld),SA:n(p?.leader_stock_sa),WA:n(p?.leader_stock_wa)},newState=remote.byState;
    const stockChanged=Object.keys(oldState).some(k=>Number((oldState as any)[k])!==Number((newState as any)[k]));
    const {error}=await s.from("products").update({leader_stock_vic:n(newState.VIC),leader_stock_nsw:n(newState.NSW),leader_stock_qld:n(newState.QLD),leader_stock_sa:n(newState.SA),leader_stock_wa:n(newState.WA),leader_stock_updated_at:new Date().toISOString()}).eq("id",link.product_id);if(error)throw new Error(`Unable to save Leader warehouse stock: ${error.message}`);
    const currentBuy=Number(link.buy_price_ex_gst??p?.buy_price_ex_gst??0),newBuy=remote.buy,delta=Math.round((newBuy-currentBuy)*100)/100,deltaPct=currentBuy>0?Math.round((delta/currentBuy)*10000)/100:0,currentSell=Number(p?.price||0),sellEx=currentSell/1.1,margin=sellEx>0?Math.round(((sellEx-newBuy)/sellEx)*10000)/100:0;
    return {product_id:link.product_id,link_id:link.id,name:p?.name,sku:link.supplier_sku,current_buy:currentBuy,supplier_buy:newBuy,delta,delta_percent:deltaPct,current_sell:currentSell,supplier_rrp:remote.rrp,supplier_stock:remote.stock,stock_by_state:newState,old_stock_by_state:oldState,proposed_margin:margin,changed:Math.abs(delta)>=.01,stock_changed:stockChanged,status:"ok"};
  }catch(e:any){return {product_id:link.product_id,link_id:link.id,name:p?.name,sku:link.supplier_sku,status:"error",error:e?.statusMessage||e?.message||"Sync failed"}}}));
  if(results.length){const logRows=results.map((r:any)=>({run_id:runId,product_id:r.product_id,supplier_link_id:r.link_id||null,product_name:r.name||null,sku:r.sku||null,status:r.status,error_message:r.error||null,price_changed:!!r.changed,stock_changed:!!r.stock_changed,old_buy_price:r.current_buy??null,new_buy_price:r.supplier_buy??null,price_delta:r.delta??null,price_delta_percent:r.delta_percent??null,old_stock:r.old_stock_by_state||null,new_stock:r.stock_by_state||null}));const {error}=await s.from("supplier_sync_results").insert(logRows);if(error)throw createError({statusCode:500,statusMessage:`Unable to save sync results: ${error.message}`})}
  const next=offset+batch.length,done=next>=links.length;
  if(done){const {data:all}=await s.from("supplier_sync_results").select("status,price_changed,stock_changed").eq("run_id",runId);const a=all||[];await s.from("supplier_sync_runs").update({status:a.some((x:any)=>x.status==='error'||x.status==='not_found')?'completed_with_errors':'completed',completed_at:new Date().toISOString(),checked_products:a.length,price_changes:a.filter((x:any)=>x.price_changed).length,stock_changes:a.filter((x:any)=>x.stock_changed).length,failed_products:a.filter((x:any)=>x.status==='error'||x.status==='not_found').length}).eq("id",runId)}
  return {run_id:runId,total:links.length,offset,processed:batch.length,next_offset:done?null:next,checked:results.length,changed:results.filter((x:any)=>x.changed).length,stock_changed:results.filter((x:any)=>x.stock_changed).length,failed:results.filter((x:any)=>x.status==='error'||x.status==='not_found').length,results};
});
