import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { extensionForImageMime, imageBytesMatchMime } from "~~/server/utils/imageUpload";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const input = String(body?.url || "");
  const sku = String(body?.sku || "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60) || "product";
  let url: URL;
  try { url = new URL(input); } catch { throw createError({ statusCode: 400, statusMessage: "Invalid image URL" }); }
  // Only allow official Compuworld-hosted images. Avoid server-side requests to arbitrary hosts.
  if (url.protocol !== "https:" || !["www.compuworld.com.au", "compuworld.com.au"].includes(url.hostname) || url.port || url.username || url.password) {
    throw createError({ statusCode: 400, statusMessage: "Only Compuworld-hosted HTTPS images can be downloaded automatically" });
  }
  let response: Response;
  try {
    response = await fetch(url.toString(), { redirect: "error", signal: AbortSignal.timeout(12000), headers: { accept: "image/jpeg,image/png,image/webp,image/gif" } });
  } catch { throw createError({ statusCode: 502, statusMessage: "Unable to retrieve the supplier image" }); }
  if (!response.ok) throw createError({ statusCode: 502, statusMessage: `Supplier image returned HTTP ${response.status}` });
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: "Supplier image is too large" });
  const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED.has(mime)) throw createError({ statusCode: 415, statusMessage: "Supplier URL did not return a supported image" });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: "Supplier image is too large" });
  if (!imageBytesMatchMime(bytes, mime)) throw createError({ statusCode: 415, statusMessage: "Supplier image signature is invalid" });
  const path = `compuworld/${sku}-${crypto.randomUUID()}.${extensionForImageMime(mime)}`;
  const storage = getAdminSupabase().storage.from("products");
  const { error } = await storage.upload(path, bytes, { contentType: mime, cacheControl: "3600", upsert: false });
  if (error) throw createError({ statusCode: 500, statusMessage: "Could not save the image to Supabase Storage" });
  return { path, url: storage.getPublicUrl(path).data.publicUrl };
});
