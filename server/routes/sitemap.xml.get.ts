import { getAdminSupabase } from "~~/server/utils/adminAuth";

const escapeXml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export default defineEventHandler(async (event) => {
  const supabase = getAdminSupabase();
  const base = "https://shop.kiallacomputers.com.au";

  const [productsResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("slug").eq("active", true).order("slug"),
    supabase.from("categories").select("slug").eq("active", true).order("slug"),
  ]);

  if (productsResult.error || categoriesResult.error) {
    throw createError({ statusCode: 500, statusMessage: "Unable to generate sitemap." });
  }

  const urls = [
    `${base}/`,
    ...(categoriesResult.data || []).filter((row) => row.slug).map((row) => `${base}/category/${encodeURIComponent(row.slug)}`),
    ...(productsResult.data || []).filter((row) => row.slug).map((row) => `${base}/product/${encodeURIComponent(row.slug)}`),
  ];

  setHeader(event, "content-type", "application/xml; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=900, s-maxage=900");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
});
