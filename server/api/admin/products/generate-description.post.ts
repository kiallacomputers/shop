import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { requireAdmin } from "~~/server/utils/adminAuth";

type Block = { type: string; text?: string; level?: number; items?: string[] };
const clean = (value: unknown, max = 120) => String(value ?? "").trim().slice(0, max);
const error = (statusCode: number, statusMessage: string) => createError({ statusCode, statusMessage });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const vendor = clean(body?.vendor || body?.brand);
  const partNumber = clean(body?.partNumber || body?.mpn || body?.product_code);
  const productName = clean(body?.productName, 220);
  const productUrl = clean(body?.productUrl, 1200);
  if (!productUrl && (!vendor || !partNumber)) throw error(400, "Enter a product URL or manufacturer and product number.");
  if (!productUrl) throw error(400, "Vendor Product URL is required for website extraction. No AI or search API is used.");
  const page = await fetchPublicProductPage(productUrl);
  const evidence = [page.title, page.description, page.text].join(" ").toLowerCase();
  const terms = [partNumber, productName].filter((x) => x.length >= 4);
  if (terms.length && !terms.some((term) => evidence.includes(term.toLowerCase()))) {
    throw error(422, "The vendor page does not appear to match the entered product. Check the URL and product number.");
  }
  const title = page.title.replace(/\\s*[|–—]\\s*[^|–—]{2,70}$/, "").trim() || productName || [vendor, partNumber].filter(Boolean).join(" ");
  const summary = (page.description || "").trim();
  if (!summary && page.text.length < 120) throw error(422, "The vendor page does not contain enough readable product details.");
  // Website extraction only: preserve statements from the source instead of inventing features.
  const blocks: Block[] = [{ type: "heading", text: "Overview", level: 2 }];
  if (summary) blocks.push({ type: "paragraph", text: clean(summary, 1100) });
  const candidates = page.text.split(/(?<=[.!?])\\s+/)
    .map((v) => v.trim())
    .filter((v) => v.length >= 45 && v.length <= 240)
    .filter((v) => !/cookie|privacy policy|subscribe|sign up|javascript|all rights reserved|terms of use/i.test(v));
  const unique = [...new Set(candidates)].filter((v) => !summary.includes(v)).slice(0, 6);
  if (unique.length) {
    blocks.push({ type: "heading", text: "Product Details", level: 2 });
    blocks.push({ type: "list", items: unique });
  }
  const images = page.images.slice(0, 12).map((url) => ({
    url, thumbnail: url, title: page.title || "Vendor product image",
    host: new URL(url).hostname,
  }));
  return {
    blurb: clean(summary || title, 350),
    blocks,
    sources: [{ title: page.title || "Vendor product page", url: page.url }],
    images,
    seoTitle: clean(title, 60),
    seoDescription: clean(summary || title, 155),
  };
});

function isPrivateAddress(ip: string): boolean {
  if (ip.includes(":")) return true; // reject IPv6 for predictable egress checks
  const n = ip.split(".").map(Number);
  return n[0] === 0 || n[0] === 10 || n[0] === 127 || n[0] >= 224 ||
    (n[0] === 169 && n[1] === 254) || (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
    (n[0] === 192 && n[1] === 168) || (n[0] === 100 && n[1] >= 64 && n[1] <= 127) ||
    (n[0] === 192 && n[1] === 0) || (n[0] === 198 && (n[1] === 18 || n[1] === 19));
}
async function fetchPublicProductPage(input: string) {
  let url: URL;
  try { url = new URL(input); } catch { throw createError({ statusCode: 400, statusMessage: "Invalid product URL." }); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || isIP(url.hostname) || url.hostname === "localhost" || !url.hostname.includes("."))
    throw createError({ statusCode: 400, statusMessage: "Use a public HTTPS manufacturer URL." });
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address)))
    throw createError({ statusCode: 400, statusMessage: "Product URL resolves to a private address." });
  let response: Response;
  try {
    response = await fetch(url.toString(), { redirect: "manual", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "KiallaComputersProductResearch/1.0", Accept: "text/html" } });
  } catch { throw createError({ statusCode: 502, statusMessage: "Could not retrieve vendor product page." }); }
  if (response.status >= 300 && response.status < 400) throw createError({ statusCode: 422, statusMessage: "Vendor page redirects. Paste the final product page URL." });
  if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html"))
    throw createError({ statusCode: 422, statusMessage: "Vendor page is unavailable or not HTML. Try manufacturer + MPN." });
  if (Number(response.headers.get("content-length") || 0) > 1500000)
    throw createError({ statusCode: 413, statusMessage: "Vendor page is too large." });
  const reader = response.body?.getReader();
  if (!reader) throw createError({ statusCode: 502, statusMessage: "Vendor page is empty." });
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1500000) { await reader.cancel(); throw createError({ statusCode: 413, statusMessage: "Vendor page is too large." }); }
    chunks.push(value);
  }
  const html = Buffer.concat(chunks).toString("utf8");
  const decode = (v: string) => v.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").trim();
  const meta = (name: string) => {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of tags) {
      if (new RegExp(`(?:name|property)=["']${name}["']`, "i").test(tag)) return decode(tag.match(/content=["']([^"']*)["']/i)?.[1] || "");
    }
    return "";
  };
  const title = decode(meta("og:title") || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").slice(0, 220);
  const description = meta("description") || meta("og:description");
  const contentHtml = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
    || html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
  const text = decode(contentHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).slice(0, 14000);
  const images: string[] = [];
  const addImage = (candidate: string) => {
    try { const u = new URL(decode(candidate), url); if (u.protocol === "https:" && !images.includes(u.toString())) images.push(u.toString()); } catch { /* ignore */ }
  };
  const ogImage = meta("og:image"); if (ogImage) addImage(ogImage);
  for (const match of html.matchAll(/<img\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi)) {
    if (images.length >= 12) break;
    addImage(match[1]);
  }
  return { title, description, text, images, url: url.toString() };
}
