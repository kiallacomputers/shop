import { getAdminSupabase, requireAdmin } from '~~/server/utils/adminAuth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { data, error } = await getAdminSupabase().from('product_description_templates')
    .select('id,name,category,kind,blocks,created_at,updated_at')
    .order('name', { ascending: true }).limit(500);
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data || [];
});
