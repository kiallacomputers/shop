import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");

  if (!id) throw createError({ statusCode: 400, statusMessage: "Advertisement ID is required" });

  const supabase = getAdminSupabase();
  const { error } = await supabase.from("ads").delete().eq("id", id);

  if (error) {
    console.error("ADMIN DELETE AD ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to delete advertisement" });
  }

  return { success: true };
});
