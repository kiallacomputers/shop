import { getAdminSupabase, requireAdmin } from '~~/server/utils/adminAuth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))
    throw createError({ statusCode: 400, statusMessage: 'Invalid template ID.' });
  const { error } = await getAdminSupabase().from('product_description_templates').delete().eq('id', id);
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { success: true };
});
