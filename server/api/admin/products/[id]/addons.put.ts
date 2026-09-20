import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const money = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const productId = Number(getRouterParam(event, "id"));
  const body = await readBody(event);
  const groups = Array.isArray(body?.groups) ? body.groups : [];
  if (!Number.isInteger(productId) || productId <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid product" });

  for (const group of groups) {
    if (!String(group?.name || "").trim()) throw createError({ statusCode: 400, statusMessage: "Every add-on group needs a name" });
    if (!["multiple","single"].includes(String(group?.selection_type))) throw createError({ statusCode: 400, statusMessage: "Invalid add-on selection type" });
    for (const option of Array.isArray(group?.options) ? group.options : []) {
      if (!String(option?.name || "").trim()) throw createError({ statusCode: 400, statusMessage: "Every add-on option needs a name" });
      if (!Number.isFinite(Number(option?.price)) || Number(option.price) < 0) throw createError({ statusCode: 400, statusMessage: "Add-on prices must be 0 or more" });
    }
  }

  const supabase = getAdminSupabase();
  const { data: oldGroups, error: oldError } = await supabase.from("product_addon_groups").select("id").eq("product_id", productId);
  if (oldError) throw createError({ statusCode: 500, statusMessage: oldError.message });
  const oldIds = (oldGroups || []).map((row: any) => row.id);
  if (oldIds.length) {
    const { error } = await supabase.from("product_addon_groups").delete().in("id", oldIds);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  }

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    const { data: savedGroup, error: groupError } = await supabase.from("product_addon_groups").insert({
      product_id: productId,
      name: String(group.name).trim(),
      selection_type: group.selection_type,
      required: group.required === true,
      active: group.active !== false,
      sort_order: gi,
    }).select("id").single();
    if (groupError || !savedGroup) throw createError({ statusCode: 500, statusMessage: groupError?.message || "Unable to save add-on group" });

    const options = (Array.isArray(group.options) ? group.options : []).map((option: any, oi: number) => ({
      group_id: savedGroup.id,
      name: String(option.name).trim(),
      price: money(option.price),
      active: option.active !== false,
      sort_order: oi,
    }));
    if (options.length) {
      const { error } = await supabase.from("product_addon_options").insert(options);
      if (error) throw createError({ statusCode: 500, statusMessage: error.message || "Unable to save add-on options" });
    }
  }
  return { success: true };
});
