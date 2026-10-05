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
  },body:form.toString(),signal:AbortSignal.timeout(15000)});
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
  let q=s.from("accounting_product_suppliers").select("id,product_id,supplier_id,supplier_sku,buy_price_ex_gst,is_primary,accounting_suppliers(id,name),products(id,name,product_code,buy_price_ex_gst,price,oldPrice,rrp_markup_percent,active)").eq("is_primary",true);
  if(ids.length) q=q.in("product_id",ids);
  const {data,error}=await q;
  if(error) throw createError({statusCode:500,statusMessage:error.message});
  const links=(data||[]).filter((x:any)=>/leader/i.test(String(x.accounting_suppliers?.name||""))&&String(x.supplier_sku||"").trim());
  const results:any[]=[];
  for(const link of links){
    const p:any=link.products;
    try{
      const remote=await leaderProduct(String(link.supplier_sku));
      if(!remote){results.push({product_id:link.product_id,name:p?.name,sku:link.supplier_sku,status:"not_found"});continue}
      const currentBuy=Number(link.buy_price_ex_gst??p?.buy_price_ex_gst??0), currentSell=Number(p?.price||0);
      const newBuy=remote.buy, delta=Math.round((newBuy-currentBuy)*100)/100, deltaPct=currentBuy>0?Math.round((delta/currentBuy)*10000)/100:0;
      const sellEx=currentSell/1.1, proposedMargin=sellEx>0?Math.round(((sellEx-newBuy)/sellEx)*10000)/100:0;
      results.push({product_id:link.product_id,link_id:link.id,name:p?.name,sku:link.supplier_sku,current_buy:currentBuy,supplier_buy:newBuy,delta,delta_percent:deltaPct,current_sell:currentSell,supplier_rrp:remote.rrp,supplier_stock:remote.stock,stock_by_state:remote.byState,proposed_margin:proposedMargin,changed:Math.abs(delta)>=0.01,status:"ok"});
    }catch(e:any){results.push({product_id:link.product_id,name:p?.name,sku:link.supplier_sku,status:"error",error:e?.statusMessage||e?.message||"Sync failed"});}
  }
  return {checked:links.length,changed:results.filter(x=>x.changed).length,results};
});