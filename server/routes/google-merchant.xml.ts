import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { firstProductImage, seoDescription, xmlEscape } from "~~/server/utils/productSeo";

export default defineEventHandler(async (event) => {
  const s = getAdminSupabase();
  const site = String(useRuntimeConfig(event).public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/$/, "");
  const { data, error } = await s.from("products")
    .select("id,name,slug,product_code,brand,gtin,mpn,blurb,description,price,stock,active,refurbished,images,categories(name)")
    .eq("active", true).not("slug", "is", null).gt("price", 0).order("name");
  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to generate product feed" });

  const items = (data || []).filter((p: any) => firstProductImage(p.images)).map((p: any) => {
    const id = String(p.product_code || `KC-${p.id}`);
    const availability = Number(p.stock || 0) > 0 ? "in_stock" : "backorder";
    return `<item>\n<title>${xmlEscape(p.name)}</title>\n<link>${xmlEscape(`${site}/product/${encodeURIComponent(p.slug)}`)}</link>\n<description>${xmlEscape(seoDescription(p, 5000))}</description>\n<g:id>${xmlEscape(id)}</g:id>\n<g:image_link>${xmlEscape(firstProductImage(p.images))}</g:image_link>\n<g:availability>${availability}</g:availability>\n<g:price>${Number(p.price).toFixed(2)} AUD</g:price>\n<g:condition>${p.refurbished ? "refurbished" : "new"}</g:condition>\n${p.brand ? `<g:brand>${xmlEscape(p.brand)}</g:brand>\n` : ""}${p.gtin ? `<g:gtin>${xmlEscape(p.gtin)}</g:gtin>\n` : ""}${p.mpn ? `<g:mpn>${xmlEscape(p.mpn)}</g:mpn>\n` : ""}${(!p.gtin && !p.mpn) ? `<g:identifier_exists>false</g:identifier_exists>\n` : ""}${p.categories?.name ? `<g:product_type>${xmlEscape(p.categories.name)}</g:product_type>\n` : ""}</item>`;
  }).join("\n");
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=1800");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>Kialla Computers</title><link>${xmlEscape(site)}</link><description>Kialla Computers product feed</description>${items}</channel></rss>`;
});
