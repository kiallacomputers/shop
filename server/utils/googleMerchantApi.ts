import crypto from "node:crypto";

const b64url=(input:string|Buffer)=>Buffer.from(input).toString("base64url");

export const getGoogleMerchantAccessToken=async(event:any)=>{
  const c=useRuntimeConfig(event);
  const email=String(c.googleMerchantServiceAccountEmail||"").trim();
  const rawKey=String(process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY||c.googleMerchantServiceAccountPrivateKey||"").trim();
  if(!email||!rawKey) throw createError({statusCode:503,statusMessage:"Google Merchant API credentials are not configured"});
  const privateKey=rawKey.replace(/\\n/g,"\n");
  const now=Math.floor(Date.now()/1000);
  const header=b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=b64url(JSON.stringify({
    iss:email,scope:"https://www.googleapis.com/auth/content",aud:"https://oauth2.googleapis.com/token",
    iat:now,exp:now+3600,
  }));
  const unsigned=`${header}.${payload}`;
  const signature=crypto.sign("RSA-SHA256",Buffer.from(unsigned),privateKey);
  const assertion=`${unsigned}.${b64url(signature)}`;
  const body=new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion});
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});
  const json:any=await response.json();
  if(!response.ok||!json.access_token) throw createError({statusCode:502,statusMessage:json?.error_description||"Unable to authenticate with Google Merchant Center"});
  return String(json.access_token);
};

export const googleMerchantFetch=async(event:any,path:string,query:Record<string,string|number|undefined>={})=>{
  const token=await getGoogleMerchantAccessToken(event);
  const url=new URL(`https://shoppingcontent.googleapis.com/content/v2.1/${path.replace(/^\//,"")}`);
  Object.entries(query).forEach(([k,v])=>{if(v!==undefined&&v!=="")url.searchParams.set(k,String(v))});
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`,accept:"application/json"}});
  const json:any=await response.json().catch(()=>({}));
  if(!response.ok) throw createError({statusCode:response.status===403?502:response.status,statusMessage:json?.error?.message||"Google Merchant Center API request failed"});
  return json;
};
