import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const { data, error } = await getAdminSupabase().from("accounting_periods").select("*").order("start_date", { ascending: false });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data || [];
});
