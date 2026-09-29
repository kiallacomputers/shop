import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { getGoogleMerchantAccessToken } from "~~/server/utils/googleMerchantApi";

const n=(v:any)=>Number(v||0);
const pct=(clicks:number,impressions:number)=>impressions>0?(clicks/impressions)*100:0;

export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);
  const c=useRuntimeConfig(event);
  const merchantId=String(c.googleMerchantId||"").trim();
  if(!merchantId) throw createError({statusCode:503,statusMessage:"GOOGLE_MERCHANT_ID is not configured"});

  const q=getQuery(event);
  const days=Math.min(90,Math.max(1,Number(q.days||28)));
  const end=new Date(); const start=new Date(end); start.setUTCDate(start.getUTCDate()-days);
  const d=(x:Date)=>x.toISOString().slice(0,10);

  const token=await getGoogleMerchantAccessToken(event);
  const query=`SELECT segments.offer_id, segments.title, metrics.impressions, metrics.clicks, metrics.click_through_rate
FROM MerchantPerformanceView
WHERE segments.date BETWEEN '${d(start)}' AND '${d(end)}'
ORDER BY metrics.impressions DESC`;

  const url=`https://merchantapi.googleapis.com/reports/v1beta/accounts/${encodeURIComponent(merchantId)}/reports:search`;
  const response=await fetch(url,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json",accept:"application/json"},body:JSON.stringify({query,pageSize:1000})});
  const json:any=await response.json().catch(()=>({}));
  if(!response.ok){
    console.error("GOOGLE MERCHANT REPORT ERROR",json);
    throw createError({statusCode:502,statusMessage:json?.error?.message||"Unable to load Google Merchant performance"});
  }

  const rows=(json.results||[]).map((r:any)=>{
    const seg=r.segments||{}; const m=r.metrics||{};
    const impressions=n(m.impressions),clicks=n(m.clicks);
    return {offer_id:String(seg.offerId||""),title:String(seg.title||seg.offerId||"Unknown product"),impressions,clicks,ctr:n(m.clickThroughRate)||pct(clicks,impressions)};
  });
  const impressions=rows.reduce((a:number,x:any)=>a+x.impressions,0);
  const clicks=rows.reduce((a:number,x:any)=>a+x.clicks,0);
  return {merchant_id:merchantId,days,start_date:d(start),end_date:d(end),
    summary:{impressions,clicks,ctr:pct(clicks,impressions),products_with_impressions:rows.filter((x:any)=>x.impressions>0).length},
    products:rows};
});
