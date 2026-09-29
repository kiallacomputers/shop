import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { getGoogleMerchantAccessToken } from "~~/server/utils/googleMerchantApi";

const n=(v:any)=>Number(v||0);
const pct=(clicks:number,impressions:number)=>impressions>0?(clicks/impressions)*100:0;

export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);

  const c=useRuntimeConfig(event);
  const merchantId=String(c.googleMerchantId||"").trim();
  if(!merchantId) {
    throw createError({statusCode:503,statusMessage:"GOOGLE_MERCHANT_ID is not configured in Netlify"});
  }

  const q=getQuery(event);
  const days=Math.min(90,Math.max(1,Number(q.days||28)));
  const end=new Date();
  const start=new Date(end);
  start.setUTCDate(start.getUTCDate()-days+1);
  const d=(x:Date)=>x.toISOString().slice(0,10);

  const token=await getGoogleMerchantAccessToken(event);

  // Merchant API MQL uses product_performance_view directly.
  const query=`SELECT
  offer_id,
  title,
  impressions,
  clicks,
  click_through_rate
FROM product_performance_view
WHERE date BETWEEN '${d(start)}' AND '${d(end)}'
ORDER BY impressions DESC`;

  const endpoint=`https://merchantapi.googleapis.com/reports/v1beta/accounts/${encodeURIComponent(merchantId)}/reports:search`;

  const allResults:any[]=[];
  let pageToken="";

  do {
    const response=await fetch(endpoint,{
      method:"POST",
      headers:{
        authorization:`Bearer ${token}`,
        "content-type":"application/json",
        accept:"application/json",
      },
      body:JSON.stringify({
        query,
        pageSize:1000,
        ...(pageToken?{pageToken}:{}),
      }),
    });

    const json:any=await response.json().catch(()=>({}));

    if(!response.ok){
      console.error("GOOGLE MERCHANT REPORT ERROR:",JSON.stringify(json));

      const googleMessage=String(
        json?.error?.message ||
        json?.error?.status ||
        `Google Merchant API returned HTTP ${response.status}`
      );

      const registrationHint=/not registered|register.*gcp|developer registration/i.test(googleMessage)
        ? " The Google Cloud project still needs Merchant API developer registration."
        : "";

      throw createError({
        statusCode:502,
        statusMessage:`Google Merchant Center: ${googleMessage}${registrationHint}`,
      });
    }

    allResults.push(...(json.results||[]));
    pageToken=String(json.nextPageToken||"");
  } while(pageToken);

  // Current Merchant API returns selected report fields inside productPerformanceView.
  const byOffer=new Map<string,any>();

  for(const row of allResults){
    const p=row?.productPerformanceView||{};
    const offerId=String(p.offerId||"").trim();
    const title=String(p.title||offerId||"Unknown product");
    const impressions=n(p.impressions);
    const clicks=n(p.clicks);

    // Defensive aggregation in case Google returns multiple rows for an offer.
    const key=offerId||title;
    const current=byOffer.get(key)||{offer_id:offerId,title,impressions:0,clicks:0,ctr:0};
    current.impressions+=impressions;
    current.clicks+=clicks;
    current.ctr=pct(current.clicks,current.impressions);
    byOffer.set(key,current);
  }

  const rows=Array.from(byOffer.values()).sort((a:any,b:any)=>b.impressions-a.impressions);
  const impressions=rows.reduce((a:number,x:any)=>a+x.impressions,0);
  const clicks=rows.reduce((a:number,x:any)=>a+x.clicks,0);

  return {
    merchant_id:merchantId,
    days,
    start_date:d(start),
    end_date:d(end),
    summary:{
      impressions,
      clicks,
      ctr:pct(clicks,impressions),
      products_with_impressions:rows.filter((x:any)=>x.impressions>0).length,
    },
    products:rows,
  };
});
