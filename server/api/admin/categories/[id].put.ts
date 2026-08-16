import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ============================================
  // VERIFY ADMIN
  // ============================================

  await requireAdmin(event);

  // ============================================
  // GET CATEGORY ID
  // ============================================

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required.",
    });
  }

  // ============================================
  // SUPABASE
  // ============================================

  const supabase = getAdminSupabase();

  // ============================================
  // REQUEST BODY
  // ============================================

  const body = await readBody(event);

  console.log("=================================");
  console.log("ADMIN UPDATE CATEGORY");
  console.log("ID:", id);
  console.log("BODY:", body);
  console.log("=================================");

  // ============================================
  // NAME
  // ============================================

  const name = String(body?.name || "").trim();

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category name is required.",
    });
  }

  // ============================================
  // GENERATE SLUG
  // ============================================

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const slug = String(body?.slug || generateSlug(name)).trim();

  // ============================================
  // PARENT
  // ============================================

  const parent_id =
    body?.parent_id === null ||
    body?.parent_id === undefined ||
    body?.parent_id === ""
      ? null
      : body.parent_id;

  // ============================================
  // ACTIVE
  // ============================================

  const active = body?.active !== false;

  // ============================================
  // PREVENT CATEGORY BEING ITS OWN PARENT
  // ============================================

  if (parent_id !== null && String(parent_id) === String(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "A category cannot be its own parent.",
    });
  }

  // ============================================
  // CHECK DUPLICATE SLUG
  // ============================================

  const { data: existingCategory, error: duplicateCheckError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (duplicateCheckError) {
    console.error("ADMIN CATEGORY DUPLICATE CHECK ERROR:", duplicateCheckError);

    throw createError({
      statusCode: 500,
      statusMessage:
        duplicateCheckError.message || "Unable to check category slug.",
    });
  }

  if (existingCategory) {
    throw createError({
      statusCode: 409,
      statusMessage: `A category with the slug "${slug}" already exists.`,
    });
  }

  // ============================================
  // UPDATE
  // ============================================

  const { data, error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      parent_id,
      active,
    })
    .eq("id", id)
    .select("*")
    .single();

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    console.error("=================================");
    console.error("ADMIN UPDATE CATEGORY ERROR");
    console.error(error);
    console.error("=================================");

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to update category.",
    });
  }

  // ============================================
  // SUCCESS
  // ============================================

  console.log("=================================");
  console.log("✅ CATEGORY UPDATED");
  console.log(data);
  console.log("=================================");

  return data;
});
