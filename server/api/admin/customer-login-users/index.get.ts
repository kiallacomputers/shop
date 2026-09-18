import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const q = String(getQuery(event).search || '').trim().toLowerCase();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return (data.users || []).filter((u: any) => !q || `${u.email || ''} ${u.user_metadata?.full_name || ''}`.toLowerCase().includes(q)).map((u: any) => ({ id: u.id, email: u.email || '', full_name: u.user_metadata?.full_name || '' }));
});
