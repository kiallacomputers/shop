import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const text = (value: any) => String(value ?? "").trim();

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();
  const body = await readBody(event);
  const brand = text(body?.brand);
  const productIds = [...new Set((Array.isArray(body?.product_ids) ? body.product_ids : []).map((id: any) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0))];

  if (!brand) throw createError({ statusCode: 400, statusMessage: "Brand is required" });
  if (!productIds.length) throw createError({ statusCode: 400, statusMessage: "Select at least one product" });
  if (productIds.length > 500) throw createError({ statusCode: 400, statusMessage: "A maximum of 500 products can be updated at once" });

  // Only fill missing brands. Never overwrite a brand that may have been added
  // by another admin since Product Data Health was loaded.
  const { data: current, error: readError } = await supabase
    .from("products")
    .select("id,brand")
    .in("id", productIds);
  if (readError) throw createError({ statusCode: 400, statusMessage: readError.message });

  const eligibleIds = (current || [])
    .filter((product: any) => !text(product.brand))
    .map((product: any) => Number(product.id));

  if (!eligibleIds.length) {
    return { ok: true, updated: 0, skipped: productIds.length };
  }

  const { error } = await supabase
    .from("products")
    .update({ brand })
    .in("id", eligibleIds);
  if (error) throw createError({ statusCode: 400, statusMessage: error.message });

  return { ok: true, updated: eligibleIds.length, skipped: productIds.length - eligibleIds.length };
});
