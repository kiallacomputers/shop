import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { getGoogleServiceAccountToken } from "~~/server/utils/googleServiceAccount";

const n=(v:any)=>Number(v||0);
const round=(v:number,d=2)=>Number(v.toFixed(d));
const pctChange=(now:number,prev:number)=>prev===0?(now>0?null:0):((now-prev)/prev)*100;

export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);
  const c=useRuntimeConfig(event);
  const siteUrl=String(c.googleSearchConsoleSiteUrl||"").trim();
  if(!siteUrl) throw createError({statusCode:503,statusMessage:"GOOGLE_SEARCH_CONSOLE_SITE_URL is not configured"});
  const q=getQuery(event); const days=Math.min(90,Math.max(1,Number(q.days||28)));
  const end=new Date(); end.setUTCDate(end.getUTCDate()-2); // Search Console commonly has a short reporting delay.
  const start=new Date(end); start.setUTCDate(start.getUTCDate()-days+1);
  const prevEnd=new Date(start); prevEnd.setUTCDate(prevEnd.getUTCDate()-1);
  const prevStart=new Date(prevEnd); prevStart.setUTCDate(prevStart.getUTCDate()-days+1);
  const d=(x:Date)=>x.toISOString().slice(0,10);
  const token=await getGoogleServiceAccountToken(event,"https://www.googleapis.com/auth/webmasters.readonly");
  const endpoint=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const run=async(body:any)=>{
    const response=await fetch(endpoint,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json",accept:"application/json"},body:JSON.stringify(body)});
    const json:any=await response.json().catch(()=>({}));
    if(!response.ok){console.error("GOOGLE SEARCH CONSOLE ERROR:",JSON.stringify(json));throw createError({statusCode:502,statusMessage:`Google Search Console: ${String(json?.error?.message||json?.error?.status||`HTTP ${response.status}`)}`});}
    return json;
  };
  const range={startDate:d(start),endDate:d(end),type:"web"};
  const prevRange={startDate:d(prevStart),endDate:d(prevEnd),type:"web"};
  const [summaryRaw,previousRaw,queriesRaw,pagesRaw]=await Promise.all([
    run({...range,rowLimit:1}), run({...prevRange,rowLimit:1}),
    run({...range,dimensions:["query"],rowLimit:25000}), run({...range,dimensions:["page"],rowLimit:25000})
  ]);
  const metric=(raw:any)=>{const r=raw?.rows?.[0]||{};return {clicks:n(r.clicks),impressions:n(r.impressions),ctr:n(r.ctr)*100,position:n(r.position)}};
  const summary=metric(summaryRaw), previous=metric(previousRaw);
  const mapRows=(raw:any,key:string)=>(raw?.rows||[]).map((r:any)=>({[key]:String(r.keys?.[0]||""),clicks:n(r.clicks),impressions:n(r.impressions),ctr:n(r.ctr)*100,position:n(r.position)}));
  const queries=mapRows(queriesRaw,"query"),pages=mapRows(pagesRaw,"page");
  const opportunities={
    high_impressions_low_ctr:queries.filter((x:any)=>x.impressions>=20&&x.ctr<2).sort((a:any,b:any)=>b.impressions-a.impressions).slice(0,20),
    near_page_one:queries.filter((x:any)=>x.position>8&&x.position<=20&&x.impressions>=10).sort((a:any,b:any)=>a.position-b.position).slice(0,20),
    pages_high_impressions_low_ctr:pages.filter((x:any)=>x.impressions>=20&&x.ctr<2).sort((a:any,b:any)=>b.impressions-a.impressions).slice(0,20),
  };
  return {site_url:siteUrl,days,start_date:d(start),end_date:d(end),summary:{...summary,change:{clicks:pctChange(summary.clicks,previous.clicks),impressions:pctChange(summary.impressions,previous.impressions),ctr:pctChange(summary.ctr,previous.ctr),position:previous.position?summary.position-previous.position:null}},previous,queries,pages,opportunities};
});
