import {
  getAdminSupabase,
  requireAdmin,
} from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required.",
    });
  }

  const supabase = getAdminSupabase();

  // ========================================
  // LOAD ORIGINAL PRODUCT
  // ========================================

  const {
    data: original,
    error: originalError,
  } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (originalError || !original) {
    console.error(
      "DUPLICATE PRODUCT LOAD ERROR:",
      originalError,
    );

    throw createError({
      statusCode: 404,
      statusMessage:
        originalError?.message ||
        "Original product was not found.",
    });
  }

  // ========================================
  // BUILD BASE NAME / SLUG
  // ========================================

  const originalName =
    String(original.name || "Product").trim();

  const originalSlug =
    String(original.slug || "product")
      .trim()
      .replace(/-copy(?:-\d+)?$/i, "");

  // Remove an existing Copy suffix from the name
  // so duplicating a duplicate remains tidy.
  const baseName = originalName.replace(
    /\s+Copy(?:\s+\d+)?$/i,
    "",
  );

  let copyNumber = 1;

  let newName = `${baseName} Copy`;

  let newSlug = `${originalSlug}-copy`;

  // ========================================
  // FIND UNIQUE SLUG
  // ========================================

  while (true) {
    const {
      data: existing,
      error: slugError,
    } = await supabase
      .from("products")
      .select("id")
      .eq("slug", newSlug)
      .maybeSingle();

    if (slugError) {
      console.error(
        "DUPLICATE PRODUCT SLUG CHECK ERROR:",
        slugError,
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          slugError.message ||
          "Unable to check product slug.",
      });
    }

    if (!existing) {
      break;
    }

    copyNumber += 1;

    newName =
      `${baseName} Copy ${copyNumber}`;

    newSlug =
      `${originalSlug}-copy-${copyNumber}`;
  }

  // ========================================
  // REMOVE DATABASE GENERATED FIELDS
  // ========================================

  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    categories: _categories,
    ...copyFields
  } = original as any;

  // ========================================
  // CREATE DUPLICATE
  // ========================================

  const payload = {
    ...copyFields,

    name: newName,

    slug: newSlug,

    // Safer default:
    // make duplicate inactive until it is reviewed.
    active: false,
  };

  const {
    data: duplicated,
    error: insertError,
  } = await supabase
    .from("products")
    .insert(payload)
    .select(`
      *,
      categories (
        id,
        name,
        slug,
        parent_id
      )
    `)
    .single();

  if (insertError) {
    console.error(
      "DUPLICATE PRODUCT INSERT ERROR:",
      insertError,
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        insertError.message ||
        "Unable to duplicate product.",
    });
  }

  console.log(
    "PRODUCT DUPLICATED:",
    original.id,
    "->",
    duplicated.id,
  );

  return duplicated;
});
