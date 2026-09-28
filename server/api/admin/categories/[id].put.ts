import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const supabase = getAdminSupabase();

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required.",
    });
  }

  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim();

  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category name and slug are required.",
    });
  }

  if (body?.parent_id && String(body.parent_id) === String(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "A category cannot be its own parent.",
    });
  }

  const payload = {
    name,
    slug,
    parent_id: body?.parent_id || null,
    active: body?.active !== false,
    seo_title: String(body?.seo_title ?? "").trim() || null,
    seo_description: String(body?.seo_description ?? "").trim() || null,
    seo_intro: String(body?.seo_intro ?? "").trim() || null,
    seo_content: String(body?.seo_content ?? "").trim() || null,
  };

  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("ADMIN UPDATE CATEGORY ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to update category.",
    });
  }

  return data;
});
