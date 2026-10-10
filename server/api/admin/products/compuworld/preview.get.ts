import { requireAdmin } from "~~/server/utils/adminAuth";

function parseCsv(text: string): string[][] {
  const result: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i+1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(cell); if (row.some(x => x.trim())) result.push(row);
      row = []; cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Unclosed quoted CSV field");
  row.push(cell); if (row.some(x => x.trim())) result.push(row);
  return result;
}
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const raw = process.env.COMPUWORLD_PRICE_LIST_URL?.trim();
  if (!raw) throw createError({statusCode:422,statusMessage:"Set COMPUWORLD_PRICE_LIST_URL in Netlify environment variables."});
  let url: URL;
  try { url = new URL(raw); } catch { throw createError({statusCode:422,statusMessage:"Invalid Compuworld URL configuration"}); }
  if (url.protocol !== "https:" || url.hostname !== "www.compuworld.com.au" || url.pathname !== "/products/exportproductpricelist")
    throw createError({statusCode:422,statusMessage:"Compuworld export URL must use the official export endpoint"});
  let response: Response;
  try { response = await fetch(url.toString(), {redirect:"error",signal:AbortSignal.timeout(30000),headers:{accept:"text/csv,text/plain,application/octet-stream"}}); }
  catch { throw createError({statusCode:502,statusMessage:"Could not connect to Compuworld export endpoint"}); }
  if (!response.ok) throw createError({statusCode:502,statusMessage:`Compuworld export returned HTTP ${response.status}`});
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 20_000_000) throw createError({statusCode:413,statusMessage:"Compuworld export exceeds 20 MB"});
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 20_000_000) throw createError({statusCode:413,statusMessage:"Compuworld export exceeds 20 MB"});
  const text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
  if (/^\s*<(?:!doctype html|html)/i.test(text)) throw createError({statusCode:502,statusMessage:"Compuworld returned a webpage rather than a CSV export"});
  let parsed: string[][];
  try { parsed = parseCsv(text); } catch { throw createError({statusCode:502,statusMessage:"Compuworld returned invalid CSV"}); }
  if (parsed.length < 2) throw createError({statusCode:502,statusMessage:"Compuworld export contains no product rows"});
  const headers = parsed.shift()!.map(h=>h.trim());
  if (headers.some((h,i)=>!h||headers.indexOf(h)!==i)) throw createError({statusCode:502,statusMessage:"Compuworld CSV has missing or duplicate column names"});
  return { headers, total:parsed.length, rows:parsed.slice(0,500).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""]))), truncated:parsed.length>500 };
});
