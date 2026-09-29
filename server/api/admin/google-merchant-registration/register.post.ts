import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { getGoogleMerchantAccessToken } from "~~/server/utils/googleMerchantApi";

export default defineEventHandler(async(event)=>{
  await requireSuperAdmin(event);
  const c=useRuntimeConfig(event);
  const merchantId=String(c.googleMerchantId||"").trim();
  const configuredEmail=String(c.googleMerchantDeveloperEmail||"").trim();
  const body=await readBody(event).catch(()=>({}));
  const developerEmail=String(body?.developerEmail||configuredEmail).trim();

  if(!merchantId) throw createError({statusCode:503,statusMessage:"GOOGLE_MERCHANT_ID is not configured"});
  if(!developerEmail) throw createError({statusCode:400,statusMessage:"Enter a human Google Account email for the Merchant API developer contact"});
  if(/gserviceaccount\.com$/i.test(developerEmail)) throw createError({statusCode:400,statusMessage:"Developer contact must be a human Google Account, not the service-account email"});

  const token=await getGoogleMerchantAccessToken(event);
  const url=`https://merchantapi.googleapis.com/accounts/v1/accounts/${encodeURIComponent(merchantId)}/developerRegistration:registerGcp`;

  const response=await fetch(url,{
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json",accept:"application/json"},
    body:JSON.stringify({developerEmail}),
  });
  const json:any=await response.json().catch(()=>({}));

  if(!response.ok){
    console.error("GOOGLE MERCHANT REGISTER GCP ERROR:",JSON.stringify(json));
    throw createError({
      statusCode:502,
      statusMessage:`Google Merchant registration: ${String(json?.error?.message||json?.error?.status||`HTTP ${response.status}`)}`,
    });
  }

  return {
    ok:true,
    message:"Google Cloud project registered with Merchant Center.",
    registration:json,
    developer_email:developerEmail,
  };
});
