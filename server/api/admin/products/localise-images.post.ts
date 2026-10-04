import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { isSupabaseProductImage, localiseProductImages } from "~~/server/utils/productImageLocaliser";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const productId = body?.product_id ? Number(body.product_id) : null;
  const dryRun = body?.dry_run === true;
  const supabase = getAdminSupabase();

  let query = supabase.from("products").select("id,name,product_code,images").order("id");
  if (productId) query = query.eq("id", productId);
  const { data: products, error } = await query;
  if (error) throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load products" });

  const candidates = (products || []).filter((p: any) =>
    Array.isArray(p.images) && p.images.some((url: any) => url && !isSupabaseProductImage(String(url)))
  );

  if (dryRun) {
    return {
      products: candidates.length,
      images: candidates.reduce((n: number, p: any) => n + p.images.filter((u: any) => u && !isSupabaseProductImage(String(u))).length, 0),
      items: candidates.map((p: any) => ({ id: p.id, name: p.name, external_images: p.images.filter((u: any) => u && !isSupabaseProductImage(String(u))).length })),
    };
  }

  const results:any[] = [];
  for (const product of candidates) {
    const localAlready = (product.images || []).filter((u: any) => isSupabaseProductImage(String(u)));
    const external = (product.images || []).filter((u: any) => u && !isSupabaseProductImage(String(u)));
    const moved = await localiseProductImages(external, product.product_code || `product-${product.id}`);
    const images = [...localAlready, ...moved.images];
    if (moved.images.length) {
      const { error: updateError } = await supabase.from("products").update({ images }).eq("id", product.id);
      if (updateError) {
        results.push({ id: product.id, name: product.name, copied: 0, failed: external.length, error: updateError.message });
        continue;
      }
    }
    results.push({ id: product.id, name: product.name, copied: moved.copied, failed: moved.failed.length, remaining_external: moved.failed.map((x) => x.url) });
  }
  return {
    products_processed: results.length,
    images_copied: results.reduce((n, x) => n + Number(x.copied || 0), 0),
    images_failed: results.reduce((n, x) => n + Number(x.failed || 0), 0),
    results,
  };
});
