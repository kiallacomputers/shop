import { getAdminSupabase } from "~~/server/utils/adminAuth";

const escapeXml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const urlNode = (loc: string, lastmod?: string | null) =>
  `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>` : ""}</url>`;

export default defineEventHandler(async (event) => {
  const supabase = getAdminSupabase();
  const base = String(useRuntimeConfig(event).public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/$/, "");

  const [productsResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("slug,updated_at").eq("active", true).not("slug", "is", null).order("slug"),
    supabase.from("categories").select("slug").eq("active", true).not("slug", "is", null).order("slug"),
  ]);

  if (productsResult.error || categoriesResult.error) {
    throw createError({ statusCode: 500, statusMessage: "Unable to generate sitemap." });
  }

  const nodes = [
    urlNode(`${base}/`),
    ...(categoriesResult.data || []).filter((row:any) => row.slug).map((row:any) => urlNode(`${base}/category/${encodeURIComponent(row.slug)}`)),
    ...(productsResult.data || []).filter((row:any) => row.slug).map((row:any) => urlNode(`${base}/product/${encodeURIComponent(row.slug)}`, row.updated_at)),
  ];

  setHeader(event, "content-type", "application/xml; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=900, s-maxage=900");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>\n`;
});
