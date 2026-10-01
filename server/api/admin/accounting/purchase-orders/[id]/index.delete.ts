import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

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
  const status = String(current.status || "").toLowerCase();
  if (!["draft", "awaiting_approval"].includes(status)) {
    throw createError({ statusCode: 409, statusMessage: "Only purchase orders that have not been approved can be permanently deleted." });
  }

  // These records have no stock receipts or supplier bill yet. Remove child records explicitly
  // so deletion works regardless of the database FK cascade configuration.
  const { error: activityError } = await s.from("accounting_purchase_order_activity").delete().eq("purchase_order_id", id);
  if (activityError && activityError.code !== "42P01") throw createError({ statusCode: 500, statusMessage: "Unable to delete purchase order activity." });

  const { error: lineError } = await s.from("accounting_purchase_order_lines").delete().eq("purchase_order_id", id);
  if (lineError) throw createError({ statusCode: 500, statusMessage: "Unable to delete purchase order lines." });

  const { error } = await s.from("accounting_purchase_orders").delete().eq("id", id).in("status", ["draft", "awaiting_approval"]);
  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to delete purchase order." });

  return { ok: true, id, po_number: current.po_number };
});
