import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { firstProductImage, seoDescription, seoTitle } from "~~/server/utils/productSeo";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const s = getAdminSupabase();
  const { data, error } = await s.from("products")
    .select("id,name,slug,product_code,blurb,description,price,stock,active,refurbished,images,category_id,categories(id,name,slug)")
    .order("name");
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const products = data || [];
  const active = products.filter((p: any) => p.active !== false);
  const rows = active.map((p: any) => {
    const issues: string[] = [];
    if (!String(p.slug || "").trim()) issues.push("Missing slug");
    if (!String(p.blurb || "").trim()) issues.push("Missing blurb / meta description source");
    if (!firstProductImage(p.images)) issues.push("Missing product image");
    if (!String(p.product_code || "").trim()) issues.push("Missing product code");
    if (!p.category_id) issues.push("Missing category");
    if (!(Number(p.price) > 0)) issues.push("Price is not configured");
    return {
      id: p.id, name: p.name, slug: p.slug, product_code: p.product_code,
      category: p.categories?.name || "", price: Number(p.price || 0), stock: Number(p.stock || 0),
      seo_title: seoTitle(p), seo_description: seoDescription(p), image: firstProductImage(p.images), issues,
      score: Math.max(0, 100 - issues.length * 20),
    };
  });

  const count = (needle: string) => rows.filter((p: any) => p.issues.includes(needle)).length;
  const siteUrl = String(useRuntimeConfig(event).public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/$/, "");
  return {
    summary: {
      total_products: products.length,
      active_products: active.length,
      healthy_products: rows.filter((p: any) => !p.issues.length).length,
      products_with_issues: rows.filter((p: any) => p.issues.length).length,
      missing_blurb: count("Missing blurb / meta description source"),
      missing_image: count("Missing product image"),
      missing_code: count("Missing product code"),
      missing_category: count("Missing category"),
      missing_price: count("Price is not configured"),
    },
    endpoints: {
      sitemap: `${siteUrl}/sitemap.xml`,
      robots: `${siteUrl}/robots.txt`,
      merchant: `${siteUrl}/google-merchant.xml`,
    },
    products: rows,
  };
});
