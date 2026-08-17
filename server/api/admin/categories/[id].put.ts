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
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required",
    });
  }

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

  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name and slug are required",
    });
  }

  if (String(parentId) === String(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "A category cannot be its own parent",
    });
  }

  const { data: duplicate } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: "A category with this slug already exists",
    });
  }

  if (parentId !== null) {
    const { data: allCategories, error: categoryError } = await supabase
      .from("categories")
      .select("id,parent_id");

    if (categoryError) {
      throw createError({
        statusCode: 500,
        statusMessage: categoryError.message,
      });
    }

    const byId = new Map(
      (allCategories || []).map((category) => [
        String(category.id),
        category,
      ]),
    );

    if (!byId.has(String(parentId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Selected parent category does not exist",
      });
    }

    let currentId: string | null = String(parentId);
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === String(id)) {
        throw createError({
          statusCode: 400,
          statusMessage: "That parent selection would create a category loop",
        });
      }

      if (visited.has(currentId)) break;
      visited.add(currentId);

      const current = byId.get(currentId);
      currentId = current?.parent_id == null
        ? null
        : String(current.parent_id);
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      parent_id: parentId,
      active,
      sort_order: sortOrder,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("UPDATE CATEGORY ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to update category",
    });
  }

  return data;
});
