import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { firstProductImage, plainDescriptionText, seoDescription, seoTitle } from "~~/server/utils/productSeo";

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const issue = (key: string, label: string, severity: "warning" | "error" = "warning") => ({ key, label, severity });

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const s = getAdminSupabase();

  const [productResult, categoryResult] = await Promise.all([
    s.from("products")
      .select("id,name,slug,product_code,has_variants,brand,gtin,mpn,seo_title,seo_description,blurb,description,price,stock,active,refurbished,images,category_id,categories(id,name,slug),product_variants(id,name,product_code,gtin,mpn,active)")
      .order("name"),
    s.from("categories")
      .select("id,name,slug,parent_id,active,seo_title,seo_description,seo_intro,seo_content")
      .order("name"),
  ]);

  if (productResult.error) throw createError({ statusCode: 500, statusMessage: productResult.error.message });
  if (categoryResult.error) throw createError({ statusCode: 500, statusMessage: categoryResult.error.message });

  const allProducts = productResult.data || [];
  const activeProducts = allProducts.filter((p: any) => p.active !== false);

  const products = activeProducts.map((p: any) => {
    const issues: any[] = [];
    const customTitle = clean(p.seo_title);
    const customDescription = clean(p.seo_description);
    const generatedTitle = seoTitle(p);
    const generatedDescription = seoDescription(p, 220);
    const bodyText = plainDescriptionText(p.description);

    if (!clean(p.slug)) issues.push(issue("missing_slug", "Missing slug", "error"));
    if (!clean(p.product_code)) issues.push(issue("missing_code", "Missing SKU / Product Code", "error"));
    if (!p.category_id) issues.push(issue("missing_category", "Missing category", "error"));
    if (!clean(p.brand)) issues.push(issue("missing_brand", "Missing brand"));
    if (!firstProductImage(p.images)) issues.push(issue("missing_image", "Missing product image", "error"));
    if (!(Number(p.price) > 0)) issues.push(issue("missing_price", "Price is not configured", "error"));
    if (!clean(p.blurb) && !bodyText) issues.push(issue("missing_description", "Missing useful product description", "error"));
    if (!customTitle) issues.push(issue("auto_title", "Using automatic SEO title"));
    else if (customTitle.length > 60) issues.push(issue("long_title", `SEO title is ${customTitle.length} characters`));
    else if (customTitle.length < 25) issues.push(issue("short_title", `SEO title is only ${customTitle.length} characters`));

    if (!customDescription) issues.push(issue("auto_meta", "Using automatic meta description"));
    else if (customDescription.length > 160) issues.push(issue("long_meta", `Meta description is ${customDescription.length} characters`));
    else if (customDescription.length < 70) issues.push(issue("short_meta", `Meta description is only ${customDescription.length} characters`));

    if (p.has_variants) {
      const variants = Array.isArray(p.product_variants) ? p.product_variants.filter((v: any) => v.active !== false) : [];
      if (!variants.length) issues.push(issue("no_active_variants", "Variant product has no active variants", "error"));
      const missing = variants.filter((v: any) => !clean(v.gtin) && !clean(v.mpn));
      if (missing.length) issues.push(issue("variant_identifier", `${missing.length} variant${missing.length === 1 ? "" : "s"} missing GTIN / MPN`));
    } else if (!clean(p.gtin) && !clean(p.mpn)) {
      issues.push(issue("missing_identifier", "Missing GTIN / MPN"));
    }

    const errors = issues.filter((x) => x.severity === "error").length;
    const warnings = issues.length - errors;
    const score = Math.max(0, 100 - errors * 15 - warnings * 7);

    return {
      id: p.id, name: p.name, slug: p.slug, product_code: p.product_code,
      category: (p.categories as any)?.name || "", brand: p.brand || "",
      seo_title: generatedTitle, seo_description: generatedDescription,
      custom_seo_title: customTitle, custom_seo_description: customDescription,
      image: firstProductImage(p.images), issues, score,
    };
  });

  const activeCategories = (categoryResult.data || []).filter((c: any) => c.active !== false);
  const categories = activeCategories.map((c: any) => {
    const issues: any[] = [];
    const title = clean(c.seo_title);
    const meta = clean(c.seo_description);
    const intro = clean(c.seo_intro);
    const content = clean(c.seo_content);
    const productCount = activeProducts.filter((p: any) => String(p.category_id ?? "") === String(c.id)).length;

    if (!clean(c.slug)) issues.push(issue("missing_slug", "Missing slug", "error"));
    if (!title) issues.push(issue("missing_seo_title", "Missing custom SEO title"));
    else if (title.length > 60) issues.push(issue("long_title", `SEO title is ${title.length} characters`));
    else if (title.length < 20) issues.push(issue("short_title", `SEO title is only ${title.length} characters`));
    if (!meta) issues.push(issue("missing_meta", "Missing meta description"));
    else if (meta.length > 160) issues.push(issue("long_meta", `Meta description is ${meta.length} characters`));
    else if (meta.length < 70) issues.push(issue("short_meta", `Meta description is only ${meta.length} characters`));
    if (!intro) issues.push(issue("missing_intro", "Missing category introduction"));
    if (!content) issues.push(issue("missing_content", "Missing category content"));
    else if (content.length < 150) issues.push(issue("thin_content", "Category content is quite short"));
    if (productCount === 0) issues.push(issue("empty_category", "No active products in this category"));

    const errors = issues.filter((x) => x.severity === "error").length;
    const warnings = issues.length - errors;
    return {
      id: c.id, name: c.name, slug: c.slug, parent_id: c.parent_id,
      seo_title: title || `${c.name} | Kialla Computers`,
      seo_description: meta || `Shop ${c.name} from Kialla Computers. Browse our current range with secure checkout and Australian delivery.`,
      has_custom_title: Boolean(title), has_custom_description: Boolean(meta),
      intro_length: intro.length, content_length: content.length, product_count: productCount,
      issues, score: Math.max(0, 100 - errors * 15 - warnings * 7),
    };
  });

  const productIssueCount = (key: string) => products.filter((p: any) => p.issues.some((x: any) => x.key === key)).length;
  const categoryIssueCount = (key: string) => categories.filter((c: any) => c.issues.some((x: any) => x.key === key)).length;
  const siteUrl = String(useRuntimeConfig(event).public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/$/, "");

  return {
    generated_at: new Date().toISOString(),
    summary: {
      active_products: activeProducts.length,
      healthy_products: products.filter((p: any) => !p.issues.length).length,
      products_with_issues: products.filter((p: any) => p.issues.length).length,
      product_errors: products.filter((p: any) => p.issues.some((x: any) => x.severity === "error")).length,
      active_categories: activeCategories.length,
      healthy_categories: categories.filter((c: any) => !c.issues.length).length,
      categories_with_issues: categories.filter((c: any) => c.issues.length).length,
      missing_image: productIssueCount("missing_image"),
      automatic_titles: productIssueCount("auto_title"),
      automatic_meta: productIssueCount("auto_meta"),
      missing_identifiers: productIssueCount("missing_identifier") + productIssueCount("variant_identifier"),
      categories_missing_content: categoryIssueCount("missing_content"),
    },
    issue_filters: {
      products: [
        ["all", "All issues"], ["errors", "Errors"], ["auto_title", "Automatic SEO title"], ["auto_meta", "Automatic meta description"],
        ["missing_image", "Missing image"], ["missing_brand", "Missing brand"], ["missing_identifier", "Missing GTIN / MPN"],
        ["variant_identifier", "Variant GTIN / MPN"], ["missing_description", "Missing description"]
      ],
      categories: [
        ["all", "All issues"], ["missing_seo_title", "Missing SEO title"], ["missing_meta", "Missing meta description"],
        ["missing_intro", "Missing introduction"], ["missing_content", "Missing content"], ["empty_category", "Empty category"]
      ]
    },
    endpoints: {
      base: siteUrl,
      sitemap: `${siteUrl}/sitemap.xml`,
      robots: `${siteUrl}/robots.txt`,
      merchant: `${siteUrl}/google-merchant.xml`,
    },
    products,
    categories,
  };
});
