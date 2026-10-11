import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { extensionForImageMime, imageBytesMatchMime } from "~~/server/utils/imageUpload";
const manufacturers=["lg.com","samsung.com","asus.com","dell.com","lenovo.com","hp.com","acer.com","msi.com","gigabyte.com","aoc.com","philips.com","benq.com","viewsonic.com","logitech.com","corsair.com","kingston.com","crucial.com","wd.com","western digital.com","seagate.com","intel.com","amd.com","nvidia.com","razer.com","epson.com","brother.com","canon.com","lexmark.com","tp-link.com","netgear.com","ubiquiti.com","synology.com","qnap.com"];
const valid=(host:string)=>manufacturers.some(d=>host===d||host.endsWith('.'+d));
const mimeTypes=new Set(["image/jpeg","image/png","image/webp","image/gif"]);
export default defineEventHandler(async event=>{
 await requireAdmin(event);
 const body=await readBody(event);
 let source:URL,image:URL;
 try{source=new URL(String(body?.sourceUrl||''));image=new URL(String(body?.url||''))}
 catch{throw createError({statusCode:400,statusMessage:'Invalid manufacturer URL'})}
 if(source.protocol!=='https:'||!valid(source.hostname.toLowerCase())||source.port||source.username||source.password)
  throw createError({statusCode:400,statusMessage:'Use an official manufacturer HTTPS product page'});
 // Only retrieve images from the same manufacturer domain as the reviewed product page.
 const host=image.hostname.toLowerCase(),parent=source.hostname.toLowerCase();
 const same=host===parent||host.endsWith('.'+parent)||parent.endsWith('.'+host);
 if(image.protocol!=='https:'||!same||!valid(host)||image.port||image.username||image.password)
  throw createError({statusCode:400,statusMessage:'Image is hosted on a different domain. Download and upload it manually after checking its source.'});
 let response:Response;
 try{response=await fetch(image.toString(),{redirect:'error',signal:AbortSignal.timeout(12000),headers:{accept:'image/jpeg,image/png,image/webp,image/gif'}})}
 catch{throw createError({statusCode:502,statusMessage:'Could not retrieve manufacturer image'})}
 if(!response.ok)throw createError({statusCode:502,statusMessage:`Manufacturer image returned HTTP ${response.status}`});
 if(Number(response.headers.get('content-length')||0)>8_000_000)throw createError({statusCode:413,statusMessage:'Image too large'});
 const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase().trim();
 if(!mimeTypes.has(mime))throw createError({statusCode:415,statusMessage:'Unsupported manufacturer image format'});
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length>8_000_000||!imageBytesMatchMime(bytes,mime))throw createError({statusCode:415,statusMessage:'Invalid or oversized manufacturer image'});
 const sku=String(body?.sku||'product').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,60);
 const path=`compuworld/manufacturer/${sku}-${crypto.randomUUID()}.${extensionForImageMime(mime)}`;
 const storage=getAdminSupabase().storage.from('products');
 const {error}=await storage.upload(path,bytes,{contentType:mime,upsert:false});
 if(error)throw createError({statusCode:500,statusMessage:'Could not save manufacturer image'});
 return {path,url:storage.getPublicUrl(path).data.publicUrl};
});
