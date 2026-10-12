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
  const searchKey = process.env.SERPER_API_KEY;
  const aiKey = process.env.OPENAI_API_KEY;
  if (!searchKey || !aiKey) throw error(503, "Configure SERPER_API_KEY and OPENAI_API_KEY on the server.");

  let page: { title: string; description: string; text: string; url: string; images: string[] } | null = null;
  if (productUrl) {
    // Public HTTPS pages only. DNS and redirect targets are validated server-side.
    page = await fetchPublicProductPage(productUrl);
  }
  const query = page ? `"${page.title || vendor}" "${partNumber}" product specifications` : `"${vendor}" "${partNumber}" product specifications`;
  let search: any;
  try {
    search = await $fetch<any>("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": searchKey, "Content-Type": "application/json" },
      body: { q: query, num: 8, gl: "au", hl: "en" },
      timeout: 12000,
    });
  } catch {
    throw error(502, "Product research search failed. Check your Serper API key.");
  }
  let imageSearch: any = null;
  try {
    imageSearch = await $fetch<any>("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": searchKey, "Content-Type": "application/json" },
      body: { q: `"${vendor}" "${partNumber}" product official image`, num: 12, gl: "au", hl: "en" },
      timeout: 12000,
    });
  } catch { /* Description can still succeed if image search is unavailable. */ }
  const images = (Array.isArray(imageSearch?.images) ? imageSearch.images : [])
    .filter((item: any) => typeof item.imageUrl === "string" && item.imageUrl.startsWith("https://"))
    .slice(0, 12)
    .map((item: any) => ({
      url: item.imageUrl,
      thumbnail: typeof item.thumbnailUrl === "string" && item.thumbnailUrl.startsWith("https://") ? item.thumbnailUrl : item.imageUrl,
      title: clean(item.title, 160),
      host: (() => { try { return new URL(item.imageUrl).hostname; } catch { return ""; } })(),
    }));
  const results = (Array.isArray(search?.organic) ? search.organic : [])
    .filter((r: any) => typeof r.link === "string" && /^https:\/\//.test(r.link))
    .slice(0, 8)
    .map((r: any) => ({ title: clean(r.title, 180), url: r.link, snippet: clean(r.snippet, 600) }));
  if (!results.length && !page) throw error(404, "No product research found. Try another URL or manufacturer and MPN.");
  if (page) results.unshift({ title: page.title || "Vendor product page", url: page.url, snippet: page.description });
  const pageImages = (page?.images || []).map((url) => ({ url, thumbnail: url, title: page?.title || "Vendor product image", host: new URL(url).hostname }));
  const combinedImages = [...pageImages, ...images.filter((item: any) => !pageImages.some((p) => p.url === item.url))].slice(0, 12);

  const instructions = [
    "Create an attractive, accurate ecommerce description using ONLY the supplied vendor-page text and search snippets.",
    "Never invent specifications, dimensions, compatibility, warranties, inclusions, or claims.",
    "If snippets are vague, produce fewer sections rather than filling gaps.",
    "Return JSON with keys: blurb (one sentence), blocks (array), seoTitle (max 60 characters), seoDescription (max 155 characters).",
    "Allowed blocks: {type:'heading',text:'...',level:2}, {type:'paragraph',text:'...'}, {type:'list',items:['...']}.",
    "Use heading Overview, a concise introductory paragraph, and Key Features list only when substantiated.",
    "Do not include vendor marketing claims without evidence. No markdown, no HTML, no links in blocks.",
    "Australian English. Do not claim the product is in stock.",
  ].join(" ");
  let response: any;
  try {
    response = await $fetch<any>("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: {
        model: process.env.OPENAI_DESCRIPTION_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify({ vendor, partNumber, productName, vendorPage: page ? { title: page.title, description: page.description, text: page.text } : null, research: results }) },
        ],
      },
      timeout: 25000,
    });
  } catch {
    throw error(502, "Description generation failed. Check the OpenAI API key and model access.");
  }
  let generated: any;
  try {
    generated = JSON.parse(response?.choices?.[0]?.message?.content || "{}");
  } catch {
    throw error(502, "AI returned an invalid description.");
  }
  const blocks: Block[] = (Array.isArray(generated.blocks) ? generated.blocks : [])
    .slice(0, 14)
    .map((b: any) => {
      const type = String(b?.type || "");
      if (type === "heading") return { type, text: clean(b.text, 180), level: 2 };
      if (type === "paragraph") return { type, text: clean(b.text, 1200) };
      if (type === "list") return { type, items: (Array.isArray(b.items) ? b.items : []).slice(0, 10).map((x: any) => clean(x, 300)).filter(Boolean) };
      return null;
    })
    .filter((b: any) => b && (b.text || b.items?.length));
  if (!blocks.length) throw error(422, "Insufficient verified details to generate a description.");
  return { blurb: clean(generated.blurb, 350), blocks, sources: results.map(({ title, url }: any) => ({ title, url })), images: combinedImages, seoTitle: clean(generated.seoTitle, 60), seoDescription: clean(generated.seoDescription, 155) };
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
  const text = decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).slice(0, 14000);
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
