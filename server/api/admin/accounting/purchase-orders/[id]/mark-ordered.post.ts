import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { recordPurchaseOrderActivity } from "~~/server/utils/purchaseOrderLifecycle";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid purchase order." });

  const s = getAdminSupabase();
  const { data: current, error: currentError } = await s
    .from("accounting_purchase_orders")
    .select("id,po_number,status")
    .eq("id", id)
    .single();

  if (currentError || !current) throw createError({ statusCode: 404, statusMessage: "Purchase order not found." });
  if (String(current.status).toLowerCase() !== "approved")
    throw createError({ statusCode: 409, statusMessage: "Only approved purchase orders can be marked as ordered." });

  const { data, error } = await s
    .from("accounting_purchase_orders")
    .update({ status: "ordered", ordered_at: new Date().toISOString(), ordered_by: (event.context as any).securityAuditActor?.id || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "approved")
    .select()
    .single();

  if (error || !data) throw createError({ statusCode: 400, statusMessage: error?.message || "Unable to mark purchase order as ordered." });
  await recordPurchaseOrderActivity(event,id,"marked_ordered","approved","ordered");
  return data;
});
