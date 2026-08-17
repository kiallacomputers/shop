import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();
  const body = await readBody(event);

  const name = String(body?.name || "").trim();
  const slug = makeSlug(String(body?.slug || name));
  const parentId =
    body?.parent_id === null ||
    body?.parent_id === "" ||
    body?.parent_id === undefined
      ? null
      : body.parent_id;

  const active = body?.active !== false;
  const sortOrder = Number.isFinite(Number(body?.sort_order))
    ? Number(body.sort_order)
    : 0;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category name is required",
    });
  }

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category slug is required",
    });
  }

  const { data: duplicate } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: "A category with this slug already exists",
    });
  }

  if (parentId !== null) {
    const { data: parent, error: parentError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError || !parent) {
      throw createError({
        statusCode: 400,
        statusMessage: "Selected parent category does not exist",
      });
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      parent_id: parentId,
      active,
      sort_order: sortOrder,
    })
    .select("*")
    .single();

  if (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to create category",
    });
  }

  return data;
});
