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

  // Load the original product.
  const { data: original, error: originalError } =
    await supabase
      .from("products")
      .select(`
        name,
        slug,
        category_id,
        blurb,
        images,
        price,
        oldPrice,
        reviews,
        stock,
        featured,
        refurbished,
        description,
        active
      `)
      .eq("id", id)
      .single();

  if (originalError || !original) {
    console.error(
      "ADMIN DUPLICATE PRODUCT LOAD ERROR:",
      originalError,
    );

    throw createError({
      statusCode: 404,
      statusMessage:
        originalError?.message ||
        "Original product was not found.",
    });
  }

  const baseName = String(original.name || "Product").trim();
  const baseSlug = String(original.slug || "")
    .trim()
    .replace(/-copy(?:-\d+)?$/i, "");

  // Find a unique name and slug.
  let copyNumber = 1;
  let newName = `${baseName} Copy`;
  let newSlug = `${baseSlug || "product"}-copy`;

  while (true) {
    const { data: existing, error: existingError } =
      await supabase
        .from("products")
        .select("id")
        .eq("slug", newSlug)
        .maybeSingle();

    if (existingError) {
      console.error(
        "ADMIN DUPLICATE PRODUCT SLUG CHECK ERROR:",
        existingError,
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          existingError.message ||
          "Unable to check duplicate product slug.",
      });
    }

    if (!existing) {
      break;
    }

    copyNumber += 1;
    newName = `${baseName} Copy ${copyNumber}`;
    newSlug = `${baseSlug || "product"}-copy-${copyNumber}`;
  }

  const payload = {
    name: newName,
    slug: newSlug,
    category_id: original.category_id ?? null,
    blurb: original.blurb ?? null,
    images: original.images ?? [],
    price: original.price ?? 0,
    oldPrice: original.oldPrice ?? null,
    reviews: original.reviews ?? 0,
    stock: original.stock ?? 0,
    featured: original.featured ?? false,
    refurbished: original.refurbished ?? false,
    description: original.description ?? [],
    active: original.active ?? false,
  };

  const { data: duplicated, error: insertError } =
    await supabase
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
      "ADMIN DUPLICATE PRODUCT INSERT ERROR:",
      insertError,
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        insertError.message ||
        "Unable to duplicate product.",
    });
  }

  return duplicated;
});
