import { requireAdmin } from "~~/server/utils/adminAuth";
import { extractProduct, fetchHtml } from "~~/server/utils/productUrlImport";
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const body=await readBody(event); const url=String(body?.url||"").trim();
  if(!url)throw createError({statusCode:400,statusMessage:"Supplier product URL is required"});
  const {html,url:finalUrl}=await fetchHtml(url,{supplier:true});
  const data=extractProduct(html,finalUrl);
  const looksLoggedOut=/\b(log\s*in|sign\s*in|dealer login)\b/i.test(data.name+" "+data.description) && !data.price_ex_gst;
  return {...data,authenticated:!looksLoggedOut,warning:looksLoggedOut?"The supplier page appears to require a logged-in session. Configure the server-side supplier session before importing private pricing.":null};
});
