import { requireAdmin } from "~~/server/utils/adminAuth";
import { extractProduct, fetchHtml } from "~~/server/utils/productUrlImport";

export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const body=await readBody(event);
  const url=String(body?.url||"").trim();
  if(!url) throw createError({statusCode:400,statusMessage:"Supplier product URL is required"});

  const input=new URL(url);
  const {html,url:finalUrl}=await fetchHtml(url,{supplier:true});
  const data=extractProduct(html,finalUrl);

  if(input.hostname.toLowerCase()==="partner.leadersystems.com.au"){
    const title=String(data.name||"").trim().toLowerCase();
    const hasProductIdentity=Boolean(data.supplier_sku||data.mpn||data.gtin);
    const hasPrivatePrice=data.price_ex_gst!==null && Number.isFinite(Number(data.price_ex_gst));
    const loginShell=
      !hasProductIdentity ||
      !hasPrivatePrice ||
      title==="leader dealershop" ||
      /\b(login|log in|sign in|dealer login)\b/i.test(`${data.name||""} ${data.description||""}`);

    if(loginShell){
      throw createError({
        statusCode:422,
        statusMessage:
          "Leader authentication required. The server received the Leader Dealershop shell instead of the private product page. Update LEADER_SESSION_COOKIE in Netlify with the Cookie request header from a logged-in Leader product request, then redeploy."
      });
    }
  }

  return {...data,authenticated:true,warning:null};
});
