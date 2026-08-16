import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ============================================
  // VERIFY ADMIN
  // ============================================

  await requireAdmin(event);

  // ============================================
  // SUPABASE
  // ============================================

  const supabase = getAdminSupabase();

  // ============================================
  // READ REQUEST BODY
  // ============================================

  const body = await readBody(event);

  console.log("=================================");
  console.log("ADMIN CREATE CATEGORY");
  console.log("REQUEST BODY:", body);
  console.log("=================================");

  // ============================================
  // VALIDATE NAME
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
  // VALIDATE SLUG
  // ============================================

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Unable to generate category slug.",
    });
  }

  // ============================================
  // PARENT CATEGORY
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
  // CHECK DUPLICATE SLUG
  // ============================================

  const { data: existingCategory, error: duplicateCheckError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (duplicateCheckError) {
    console.error("ADMIN CATEGORY DUPLICATE CHECK ERROR:", duplicateCheckError);

    throw createError({
      statusCode: 500,
      statusMessage:
        duplicateCheckError.message || "Unable to check existing category.",
    });
  }

  if (existingCategory) {
    throw createError({
      statusCode: 409,
      statusMessage: `A category with the slug "${slug}" already exists.`,
    });
  }

  // ============================================
  // INSERT CATEGORY
  // ============================================

  console.log("=================================");
  console.log("INSERTING CATEGORY");
  console.log("NAME:", name);
  console.log("SLUG:", slug);
  console.log("PARENT ID:", parent_id);
  console.log("ACTIVE:", active);
  console.log("=================================");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      parent_id,
      active,
    })
    .select("*")
    .single();

  // ============================================
  // INSERT ERROR
  // ============================================

  if (error) {
    console.error("=================================");
    console.error("ADMIN CREATE CATEGORY ERROR");
    console.error(error);
    console.error("=================================");

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to create category.",
    });
  }

  // ============================================
  // SUCCESS
  // ============================================

  console.log("=================================");
  console.log("✅ CATEGORY CREATED");
  console.log(data);
  console.log("=================================");

  return data;
});
