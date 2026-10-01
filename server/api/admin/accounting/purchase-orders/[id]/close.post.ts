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
  if (!["draft","awaiting_approval","approved"].includes(String(current.status).toLowerCase()))
    throw createError({ statusCode: 409, statusMessage: "Only unplaced purchase orders can be cancelled/closed." });

  const { data, error } = await s
    .from("accounting_purchase_orders")
    .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: (event.context as any).securityAuditActor?.id || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) throw createError({ statusCode: 400, statusMessage: error?.message || "Unable to close purchase order." });
  await recordPurchaseOrderActivity(event,id,"closed",String(current.status),"closed");
  return data;
});
