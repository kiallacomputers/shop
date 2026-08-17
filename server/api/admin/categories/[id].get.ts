import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();
  const id = getRouterParam(event, "id");

  if (!id) throw createError({ statusCode: 400, statusMessage: "Category ID is required" });

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  return data;
});
