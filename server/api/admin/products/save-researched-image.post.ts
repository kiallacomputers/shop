import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { extensionForImageMime, imageBytesMatchMime } from "~~/server/utils/imageUpload";

// Deliberately restricted to manufacturer domains to avoid arbitrary URL fetching.
const domains = ["logitech.com","lg.com","samsung.com","asus.com","dell.com","lenovo.com","hp.com","acer.com","msi.com","gigabyte.com","aoc.com","benq.com","viewsonic.com","corsair.com","kingston.com","crucial.com","seagate.com","intel.com","amd.com","razer.com","epson.com","brother.com","canon.com","tp-link.com","netgear.com","ubiquiti.com","synology.com","qnap.com","verbatim.com","western digital.com","wd.com"];
const permitted = (host: string) => domains.some(d => host === d || host.endsWith(`.${d}`));
const types = new Set(["image/jpeg","image/png","image/webp","image/gif"]);

export default defineEventHandler(async event => {
  await requireAdmin(event);
  const body = await readBody(event);
  let url: URL;
  try { url = new URL(String(body?.url || "")); }
  catch { throw createError({statusCode:400,statusMessage:"Invalid image URL"}); }
  if (url.protocol !== "https:" || url.port || url.username || url.password || !permitted(url.hostname.toLowerCase()))
    throw createError({statusCode:400,statusMessage:"Automatic saving is limited to official manufacturer image domains. Download and upload other images manually."});
  let response: Response;
  try { response = await fetch(url.toString(), {redirect:"error",signal:AbortSignal.timeout(12000),headers:{accept:"image/jpeg,image/png,image/webp,image/gif"}}); }
  catch { throw createError({statusCode:502,statusMessage:"Could not retrieve manufacturer image"}); }
  if (!response.ok) throw createError({statusCode:502,statusMessage:`Image server returned ${response.status}`});
  const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!types.has(mime)) throw createError({statusCode:415,statusMessage:"Unsupported image format"});
  if (Number(response.headers.get("content-length") || 0) > 8_000_000) throw createError({statusCode:413,statusMessage:"Image is larger than 8 MB"});
  if (!response.body) throw createError({statusCode:502,statusMessage:"Image body missing"});
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8_000_000) throw createError({statusCode:413,statusMessage:"Image is larger than 8 MB"});
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks.map(c => Buffer.from(c)));
  if (!imageBytesMatchMime(bytes,mime)) throw createError({statusCode:415,statusMessage:"Invalid image data"});
  const vendor = String(body?.vendor || "vendor").replace(/[^a-z0-9_-]/gi,"-").slice(0,40);
  const part = String(body?.partNumber || "item").replace(/[^a-z0-9_-]/gi,"-").slice(0,60);
  const path = `vendor-research/${vendor}-${part}-${crypto.randomUUID()}.${extensionForImageMime(mime)}`;
  const storage = getAdminSupabase().storage.from("products");
  const {error} = await storage.upload(path,bytes,{contentType:mime,upsert:false});
  if (error) throw createError({statusCode:500,statusMessage:"Could not save image to Supabase"});
  return {url:storage.getPublicUrl(path).data.publicUrl,path};
});
