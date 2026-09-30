import { getAdminSupabase } from "~~/server/utils/adminAuth";

const escapeXml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const urlNode = (loc: string) =>
  `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;

export default defineEventHandler(async (event) => {
  const base = String(
    useRuntimeConfig(event).public.siteUrl ||
    "https://shop.kiallacomputers.com.au"
  ).replace(/\/+$/, "");

  try {
    const supabase = getAdminSupabase();

    // Keep the sitemap query deliberately small and stable.
    // updated_at was previously selected solely for <lastmod>; if that field
    // is unavailable/changed, Supabase rejects the entire sitemap query.
    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select("slug")
        .eq("active", true)
        .not("slug", "is", null)
        .order("slug", { ascending: true }),

      supabase
        .from("categories")
        .select("slug")
        .eq("active", true)
        .not("slug", "is", null)
        .order("slug", { ascending: true }),
    ]);

    if (productsResult.error) {
      console.error("SITEMAP PRODUCTS ERROR:", productsResult.error);
    }
    if (categoriesResult.error) {
      console.error("SITEMAP CATEGORIES ERROR:", categoriesResult.error);
    }

    // A temporary failure in one source must not turn the public sitemap into
    // HTTP 500. Include every source that loaded successfully.
    const productRows = productsResult.error ? [] : (productsResult.data || []);
    const categoryRows = categoriesResult.error ? [] : (categoriesResult.data || []);

    const urls = new Set<string>();
    urls.add(`${base}/`);

    for (const row of categoryRows as any[]) {
      const slug = String(row?.slug || "").trim();
      if (slug) urls.add(`${base}/category/${encodeURIComponent(slug)}`);
    }

    for (const row of productRows as any[]) {
      const slug = String(row?.slug || "").trim();
      if (slug) urls.add(`${base}/product/${encodeURIComponent(slug)}`);
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      Array.from(urls).map(urlNode).join("\n") +
      `\n</urlset>\n`;

    setResponseStatus(event, 200);
    setHeader(event, "content-type", "application/xml; charset=utf-8");
    setHeader(event, "cache-control", "public, max-age=300, s-maxage=300");
    setHeader(event, "x-content-type-options", "nosniff");

    return xml;
  } catch (error) {
    console.error("SITEMAP GENERATION ERROR:", error);

    // Keep the endpoint valid and fetchable even during a transient DB/config
    // problem. This prevents Search Console receiving a 500 response.
    setResponseStatus(event, 200);
    setHeader(event, "content-type", "application/xml; charset=utf-8");
    setHeader(event, "cache-control", "public, max-age=60, s-maxage=60");
    setHeader(event, "x-content-type-options", "nosniff");

    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urlNode(`${base}/`)}\n` +
      `</urlset>\n`
    );
  }
});
