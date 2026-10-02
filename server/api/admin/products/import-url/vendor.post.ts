import { requireAdmin } from "~~/server/utils/adminAuth";
import { extractProduct, fetchHtml } from "~~/server/utils/productUrlImport";
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const body=await readBody(event); const url=String(body?.url||"").trim();
  if(!url)throw createError({statusCode:400,statusMessage:"Official vendor product URL is required"});
  const {html,url:finalUrl}=await fetchHtml(url);
  return extractProduct(html,finalUrl);
});
