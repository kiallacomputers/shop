import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const db = getAdminSupabase();
  const [{ data: groups, error: ge }, { data: admins, error: ae }] = await Promise.all([
    db.from("admin_security_groups").select("id,name,description,permissions,is_system,created_at,updated_at").order("name"),
    db.from("admin_users").select("id,email,role,security_group_id").order("email"),
  ]);
  if (ge || ae) throw createError({ statusCode: 500, statusMessage: ge?.message || ae?.message || "Unable to load security groups." });
  return { groups: groups || [], admins: admins || [] };
});
