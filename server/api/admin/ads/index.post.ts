import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);

  const title = String(body?.title || "").trim();
  const imageUrl = String(body?.image_url || "").trim();
  const linkUrl = String(body?.link_url || "").trim() || "#shop";
  const sortOrder = Number(body?.sort_order ?? 0);

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Advertisement title is required" });
  }

  if (!imageUrl) {
    throw createError({ statusCode: 400, statusMessage: "Advertisement image is required" });
  }

  if (!Number.isFinite(sortOrder)) {
    throw createError({ statusCode: 400, statusMessage: "Sort order must be a number" });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("ads")
    .insert({
      title,
      image_url: imageUrl,
      link_url: linkUrl,
      active: body?.active !== false,
      sort_order: Math.trunc(sortOrder),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("ADMIN CREATE AD ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to create advertisement" });
  }

  return data;
});
