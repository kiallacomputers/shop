import { getAdminSupabase, requireAdmin } from '~~/server/utils/adminAuth';

const categories = new Set(['General','Laptops','Desktops','Monitors','Printers','Networking','Storage','Accessories','Refurbished']);
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const category = body?.category;
  const kind = body?.kind;
  const blocks = body?.blocks;
  if (!name || name.length > 80 || !categories.has(category) || !['layout','section'].includes(kind) ||
    !Array.isArray(blocks) || blocks.length < 1 || blocks.length > 100 ||
    !blocks.every((b: any) => b && typeof b === 'object' && typeof b.type === 'string' && b.type.length < 40) ||
    JSON.stringify(blocks).length > 200000)
    throw createError({ statusCode: 400, statusMessage: 'Invalid template name, category or content.' });
  const { data, error } = await getAdminSupabase().from('product_description_templates')
    .insert({ name, category, kind, blocks }).select('id,name,category,kind,blocks').single();
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
