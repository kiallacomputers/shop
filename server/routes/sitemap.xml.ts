import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { xmlEscape } from "~~/server/utils/productSeo";

export default defineEventHandler(async (event) => {
  const s = getAdminSupabase();
  const site = String(useRuntimeConfig(event).public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/$/, "");
  const [{ data: products }, { data: categories }] = await Promise.all([
    s.from("products").select("slug").eq("active", true).not("slug", "is", null).order("id"),
    s.from("categories").select("slug").eq("active", true).not("slug", "is", null).order("id"),
  ]);
  const urls = [site,
    ...(categories || []).map((x: any) => `${site}/category/${encodeURIComponent(x.slug)}`),
    ...(products || []).map((x: any) => `${site}/product/${encodeURIComponent(x.slug)}`),
  ];
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=3600");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join("\n")}\n</urlset>`;
});
