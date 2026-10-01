import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = String(getRouterParam(event, "id") || "");
  const db = getAdminSupabase();
  const { count } = await db.from("admin_users").select("id", { count: "exact", head: true }).eq("security_group_id", id);
  if ((count || 0) > 0) throw createError({ statusCode: 409, statusMessage: "Move administrators out of this group before deleting it." });
  const { error } = await db.from("admin_security_groups").delete().eq("id", id);
  if (error) throw createError({ statusCode: 400, statusMessage: error.message });
  return { ok: true };
});
