import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("ADMIN PRODUCTS ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load products",
    });
  }

  return data ?? [];
});
