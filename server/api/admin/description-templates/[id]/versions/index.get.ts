import { getAdminSupabase, requireAdmin } from '~~/server/utils/adminAuth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))
    throw createError({ statusCode: 400, statusMessage: 'Invalid template ID.' });
  const { data, error } = await getAdminSupabase()
    .from('product_description_template_versions')
    .select('id,version_number,blocks,created_at')
    .eq('template_id', id).order('version_number', { ascending: false }).limit(100);
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data || [];
});
