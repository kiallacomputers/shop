import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();
  const id = getRouterParam(event, "id");

  if (!id) throw createError({ statusCode: 400, statusMessage: "Category ID is required" });

  const [childrenResult, productsResult] = await Promise.all([
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
  ]);

  if (childrenResult.error) {
    throw createError({ statusCode: 500, statusMessage: childrenResult.error.message });
  }

  if (productsResult.error) {
    throw createError({ statusCode: 500, statusMessage: productsResult.error.message });
  }

  const childCount = childrenResult.count ?? 0;
  const productCount = productsResult.count ?? 0;

  if (childCount > 0 || productCount > 0) {
    const reasons = [];
    if (childCount > 0) reasons.push(`${childCount} subcategor${childCount === 1 ? "y" : "ies"}`);
    if (productCount > 0) reasons.push(`${productCount} product${productCount === 1 ? "" : "s"}`);

    throw createError({
      statusCode: 409,
      statusMessage: `This category cannot be deleted because it contains ${reasons.join(" and ")}. Move or remove them first.`,
    });
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to delete category" });
  }

  return { success: true };
});
