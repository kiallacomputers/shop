import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  const current = await requireSuperAdmin(event);
  const body: any = await readBody(event);
  const userId = String(body?.user_id || "");
  const groupId = body?.security_group_id ? String(body.security_group_id) : null;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw createError({ statusCode: 400, statusMessage: "Valid administrator ID required." });
  if (String((current as any)?.id || (current as any)?.sub || "") === userId) {
    throw createError({ statusCode: 400, statusMessage: "SuperAdmin access is unrestricted and does not need a security group." });
  }
  const db = getAdminSupabase();
  const { data: admin } = await db.from("admin_users").select("id,role").eq("id", userId).maybeSingle();
  if (!admin) throw createError({ statusCode: 404, statusMessage: "Administrator not found." });
  if (String(admin.role).toLowerCase() === "superadmin") throw createError({ statusCode: 400, statusMessage: "SuperAdmins always have full access." });
  if (groupId) {
    const { data: group } = await db.from("admin_security_groups").select("id").eq("id", groupId).maybeSingle();
    if (!group) throw createError({ statusCode: 400, statusMessage: "Security group not found." });
  }
  const { error } = await db.from("admin_users").update({ security_group_id: groupId }).eq("id", userId);
  if (error) throw createError({ statusCode: 400, statusMessage: error.message });
  return { ok: true };
});
