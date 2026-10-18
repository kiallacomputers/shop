import { getAdminSupabase, requireAdmin } from '~~/server/utils/adminAuth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))
    throw createError({ statusCode: 400, statusMessage: 'Invalid template ID.' });
  const body = await readBody(event);
  const blocks = body?.blocks;
  if (!Array.isArray(blocks) || blocks.length < 1 || blocks.length > 100 ||
      !blocks.every((b: any) => b && typeof b === 'object' && typeof b.type === 'string' && b.type.length < 40) ||
      JSON.stringify(blocks).length > 200000)
    throw createError({ statusCode: 400, statusMessage: 'Invalid template content.' });
  const { data, error } = await getAdminSupabase().from('product_description_templates')
    .update({ blocks, updated_at: new Date().toISOString() })
    .eq('id', id).select('id,name,category,kind,blocks,updated_at').single();
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
