import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid purchase order." });

  const s = getAdminSupabase();
  const { data: current, error: currentError } = await s
    .from("accounting_purchase_orders")
    .select("id,po_number,status")
    .eq("id", id)
    .single();

  if (currentError || !current) throw createError({ statusCode: 404, statusMessage: "Purchase order not found." });
  if (String(current.status).toLowerCase() !== "draft")
    throw createError({ statusCode: 409, statusMessage: "Only draft purchase orders can be marked as ordered." });

  const { data, error } = await s
    .from("accounting_purchase_orders")
    .update({ status: "ordered", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft")
    .select()
    .single();

  if (error || !data) throw createError({ statusCode: 400, statusMessage: error?.message || "Unable to mark purchase order as ordered." });
  return data;
});
