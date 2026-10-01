import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { normaliseAdminPermissions } from "~~/server/utils/adminPermissions";
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const body: any = await readBody(event);
  const name = String(body?.name || "").trim().slice(0, 80);
  if (!name) throw createError({ statusCode: 400, statusMessage: "Group name is required." });
  const { data, error } = await getAdminSupabase().from("admin_security_groups").insert({
    name, description: String(body?.description || "").trim().slice(0, 500) || null,
    permissions: normaliseAdminPermissions(body?.permissions), updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw createError({ statusCode: 400, statusMessage: error.message });
  return data;
});
