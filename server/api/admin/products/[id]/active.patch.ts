import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Product ID is required" });
  const body = await readBody(event);
  if (typeof body?.active !== "boolean") {
    throw createError({ statusCode: 400, statusMessage: "active must be a boolean" });
  }
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("products")
    .update({ active: body.active }).eq("id", id).select("id,active").maybeSingle();
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  if (!data) throw createError({ statusCode: 404, statusMessage: "Product not found" });
  return data;
});
