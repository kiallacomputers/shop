import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { throwInternalError } from "~~/server/utils/internalError";

const PRODUCT_SELECT = `
  id, name, slug, product_code, has_variants, blurb, description,
  price, oldPrice, stock, active, featured, refurbished, images, category_id,
  categories (id, name, slug, parent_id),
  product_variants (id, product_id, name, product_code, price, old_price, stock, active, images)
`;

const normalise = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const compact = (value: unknown) => normalise(value).replace(/\s+/g, "");

const descriptionText = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") {
    try {
      return normalise(JSON.stringify(JSON.parse(value)));
    } catch {
      return normalise(value);
    }
  }
  return normalise(JSON.stringify(value));
};

const productSearchText = (product: any) => {
  const variants = Array.isArray(product.product_variants)
    ? product.product_variants.filter((variant: any) => variant?.active !== false)
    : [];

  return normalise([
    product.name,
    product.product_code,
    product.blurb,
    product.categories?.name,
    product.main_category_name,
    descriptionText(product.description),
    ...variants.flatMap((variant: any) => [variant.name, variant.product_code]),
  ].join(" "));
};

const scoreProduct = (product: any, query: string) => {
  const q = normalise(query);
  const qCompact = compact(query);
  if (!q) return 0;

  const terms = q.split(" ").filter(Boolean);
  const name = normalise(product.name);
  const nameCompact = compact(product.name);
  const code = normalise(product.product_code);
  const codeCompact = compact(product.product_code);
  const category = normalise([product.categories?.name, product.main_category_name].filter(Boolean).join(" "));
  const blurb = normalise(product.blurb);
  const description = descriptionText(product.description);
  const variants = Array.isArray(product.product_variants)
    ? product.product_variants.filter((variant: any) => variant?.active !== false)
    : [];
  const variantNames = normalise(variants.map((variant: any) => variant.name).join(" "));
  const variantCodes = normalise(variants.map((variant: any) => variant.product_code).join(" "));
  const variantCodesCompact = compact(variants.map((variant: any) => variant.product_code).join(" "));
  const haystack = productSearchText(product);

  // Every entered word must appear somewhere. Partial word matches are accepted,
  // making searches such as "deco m4" or fragments of a model/code forgiving.
  if (!terms.every((term) => haystack.includes(term))) return 0;

  let score = 1;
  if (codeCompact && codeCompact === qCompact) score += 180;
  if (codeCompact && codeCompact.startsWith(qCompact)) score += 130;
  if (variantCodesCompact && variantCodesCompact.includes(qCompact)) score += 105;
  if (name === q) score += 160;
  if (nameCompact === qCompact) score += 150;
  if (name.startsWith(q)) score += 120;
  if (name.includes(q)) score += 95;
  if (nameCompact.includes(qCompact)) score += 80;
  if (variantNames.includes(q)) score += 70;
  if (variantCodes.includes(q)) score += 75;
  if (category.includes(q)) score += 50;
  if (blurb.includes(q)) score += 35;
  if (description.includes(q)) score += 20;

  for (const term of terms) {
    if (name.split(" ").some((word) => word.startsWith(term))) score += 14;
    if (codeCompact.includes(term)) score += 12;
    if (variantCodesCompact.includes(term)) score += 10;
    if (category.includes(term)) score += 5;
  }

  if (product.featured) score += 2;
  return score;
};

export default defineEventHandler(async (event) => {
  const params = getQuery(event);
  const query = String(params.q || "").trim().slice(0, 120);
  const requestedLimit = Number(params.limit || 100);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 250)
    : 100;

  if (query.length < 2) return [];

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(1000);

  if (error) {
    throwInternalError(event, "PRODUCT SEARCH ERROR", error, "Unable to search products.");
  }

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id,name,parent_id")
    .eq("active", true);
  const categoriesById = new Map((categoryRows || []).map((row: any) => [Number(row.id), row]));

  return (data || [])
    .map((product: any) => {
      const category = categoriesById.get(Number(product.category_id));
      const parent = category?.parent_id == null ? null : categoriesById.get(Number(category.parent_id));
      return { ...product, main_category_name: parent?.name || category?.name || "" };
    })
    .map((product: any) => ({ ...product, search_score: scoreProduct(product, query) }))
    .filter((product: any) => product.search_score > 0)
    .sort((a: any, b: any) => b.search_score - a.search_score || String(a.name).localeCompare(String(b.name)))
    .slice(0, limit);
});
