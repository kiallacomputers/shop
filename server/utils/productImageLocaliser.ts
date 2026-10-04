import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { extensionForImageMime, imageBytesMatchMime } from "~~/server/utils/imageUpload";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const isPrivateIpv4 = (host: string) => {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  return parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0;
};

const assertSafeRemoteUrl = (value: string) => {
  let url: URL;
  try { url = new URL(value); } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid remote image URL" });
  }
  if (!["https:", "http:"].includes(url.protocol)) {
    throw createError({ statusCode: 400, statusMessage: "Remote image must use HTTP or HTTPS" });
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || host.endsWith(".local") || isPrivateIpv4(host)) {
    throw createError({ statusCode: 400, statusMessage: "Private/local image URLs are not allowed" });
  }
  return url;
};

const fetchImage = async (rawUrl: string) => {
  let current = assertSafeRemoteUrl(rawUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        referer: current.hostname.toLowerCase() === "partner.leadersystems.com.au"
          ? "https://partner.leadersystems.com.au/"
          : `${current.protocol}//${current.host}/`,
      },
      signal: AbortSignal.timeout(15000),
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location || i === MAX_REDIRECTS) throw createError({ statusCode: 502, statusMessage: "Too many image redirects" });
      current = assertSafeRemoteUrl(new URL(location, current).toString());
      continue;
    }
    if (!res.ok) throw createError({ statusCode: 502, statusMessage: `Remote image returned HTTP ${res.status}` });
    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) throw createError({ statusCode: 413, statusMessage: "Remote image is larger than 10 MB" });
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw createError({ statusCode: 413, statusMessage: "Remote image is empty or larger than 10 MB" });
    const mime = String(res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(mime) || !imageBytesMatchMime(bytes, mime)) {
      throw createError({ statusCode: 415, statusMessage: "Remote URL did not return a supported image" });
    }
    return { bytes, mime, sourceUrl: current.toString() };
  }
  throw createError({ statusCode: 502, statusMessage: "Unable to download remote image" });
};

export const isSupabaseProductImage = (value: string) =>
  /\/storage\/v1\/object\/(?:public|sign|authenticated)\/products\//i.test(String(value || ""));

export const localiseProductImage = async (remoteUrl: string, productCode = "product") => {
  if (isSupabaseProductImage(remoteUrl)) return { url: remoteUrl, copied: false };
  const { bytes, mime } = await fetchImage(remoteUrl);
  const ext = extensionForImageMime(mime);
  const safeCode = String(productCode || "product").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product";
  const path = `imported/${safeCode}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const supabase = getAdminSupabase();
  const { error } = await supabase.storage.from("products").upload(path, bytes, {
    contentType: mime, cacheControl: "31536000", upsert: false,
  });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message || "Unable to store imported product image" });
  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return { url: data.publicUrl, path, copied: true };
};

export const localiseProductImages = async (urls: unknown, productCode = "product") => {
  if (!Array.isArray(urls)) return { images: [] as string[], copied: 0, failed: [] as { url: string; error: string }[] };
  const unique = [...new Set(urls.map((x) => String(x || "").trim()).filter(Boolean))].slice(0, 20);
  const images: string[] = [];
  const failed: { url: string; error: string }[] = [];
  let copied = 0;
  for (const url of unique) {
    try {
      const result = await localiseProductImage(url, productCode);
      images.push(result.url);
      if (result.copied) copied++;
    } catch (error: any) {
      const message = error?.statusMessage || error?.message || "Unable to copy image";
      failed.push({ url, error: message });
      // Never lose an existing/imported image merely because the remote host
      // refused a server-side copy. Keep the original URL for a later retry.
      images.push(url);
    }
  }
  return { images, copied, failed };
};
