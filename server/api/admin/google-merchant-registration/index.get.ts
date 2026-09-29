import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { getGoogleMerchantAccessToken } from "~~/server/utils/googleMerchantApi";

export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);
  const c=useRuntimeConfig(event);
  const merchantId=String(c.googleMerchantId||"").trim();
  const developerEmail=String(c.googleMerchantDeveloperEmail||"").trim();
  if(!merchantId) throw createError({statusCode:503,statusMessage:"GOOGLE_MERCHANT_ID is not configured"});

  const token=await getGoogleMerchantAccessToken(event);
  const url=`https://merchantapi.googleapis.com/accounts/v1/accounts/${encodeURIComponent(merchantId)}/developerRegistration`;
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`,accept:"application/json"}});
  const json:any=await response.json().catch(()=>({}));

  return {
    merchant_id:merchantId,
    developer_email:developerEmail,
    configured:Boolean(developerEmail),
    registered:response.ok && Array.isArray(json?.gcpIds) && json.gcpIds.length>0,
    registration:response.ok?json:null,
    google_status:response.status,
    google_message:response.ok?"":String(json?.error?.message||json?.error?.status||""),
  };
});
