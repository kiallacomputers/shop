import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const supabase = getAdminSupabase();

  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim();

  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category name and slug are required.",
    });
  }

  const payload = {
    name,
    slug,
    parent_id: body?.parent_id || null,
    active: body?.active !== false,
  };

  const { data, error } = await supabase
    .from("categories")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("ADMIN CREATE CATEGORY ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to create category.",
    });
  }

  return data;
});
