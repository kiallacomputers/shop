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
  if (!vendor || !partNumber) throw error(400, "Enter a manufacturer/vendor name and product number.");
  const searchKey = process.env.SERPER_API_KEY;
  const aiKey = process.env.OPENAI_API_KEY;
  if (!searchKey || !aiKey) throw error(503, "Configure SERPER_API_KEY and OPENAI_API_KEY on the server.");

  const query = `"${vendor}" "${partNumber}" product specifications`;
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
  if (!results.length) throw error(404, "No reliable search results found for that product number.");

  const instructions = [
    "Create an attractive, accurate ecommerce description from ONLY the supplied search-result snippets.",
    "Never invent specifications, dimensions, compatibility, warranties, inclusions, or claims.",
    "If snippets are vague, produce fewer sections rather than filling gaps.",
    "Return a JSON object with keys: blurb (one sentence), blocks (array).",
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
          { role: "user", content: JSON.stringify({ vendor, partNumber, productName, research: results }) },
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
  return { blurb: clean(generated.blurb, 350), blocks, sources: results.map(({ title, url }: any) => ({ title, url })), images };
});
