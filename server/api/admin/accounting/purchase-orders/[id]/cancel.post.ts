import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { sendDomainEmail, escapeHtml } from "~~/server/utils/domainEmail";
import { recordPurchaseOrderActivity } from "~~/server/utils/purchaseOrderLifecycle";

const cancellableStatuses = ["approved", "sent", "ordered", "part_received"];

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody(event);
  const reason = String(body?.reason || "").trim();
  const emailSupplier = body?.email_supplier === true;

  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid purchase order." });
  if (!reason) throw createError({ statusCode: 400, statusMessage: "A cancellation reason is required." });
  if (reason.length > 1000) throw createError({ statusCode: 400, statusMessage: "Cancellation reason is too long." });

  const s = getAdminSupabase();
  const { data: po, error } = await s
    .from("accounting_purchase_orders")
    .select("*,accounting_suppliers(*),accounting_purchase_order_lines(*)")
    .eq("id", id)
    .single();

  if (error || !po) throw createError({ statusCode: 404, statusMessage: "Purchase order not found." });

  const current = String(po.status || "").toLowerCase();
  if (!cancellableStatuses.includes(current)) {
    throw createError({
      statusCode: 409,
      statusMessage: "Only approved, ordered or part-received purchase orders can be cancelled.",
    });
  }

  if (po.bill || ["billed", "paid", "closed", "cancelled", "received"].includes(current)) {
    throw createError({ statusCode: 409, statusMessage: "This purchase order can no longer be cancelled." });
  }

  const supplier: any = po.accounting_suppliers || {};
  const hasBeenSent = Boolean(po.last_emailed_at) || ["sent", "ordered", "part_received"].includes(current);

  if (emailSupplier) {
    if (!hasBeenSent) {
      throw createError({ statusCode: 409, statusMessage: "This purchase order has not been sent to the supplier." });
    }
    if (!supplier.email) {
      throw createError({ statusCode: 400, statusMessage: "This supplier does not have an email address." });
    }

    const html = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#0f172a">
      <h2>Purchase Order Cancellation — ${escapeHtml(po.po_number || `PO-${po.id}`)}</h2>
      <p>Hi ${escapeHtml(supplier.contact_name || supplier.name || "there")},</p>
      <p>Please cancel our purchase order <b>${escapeHtml(po.po_number || `PO-${po.id}`)}</b>.</p>
      <p><b>Cancellation reason:</b><br>${escapeHtml(reason).replaceAll("\n", "<br>")}</p>
      ${current === "part_received" ? "<p>We acknowledge that part of this order has already been received. This cancellation applies to the remaining outstanding quantities only.</p>" : ""}
      <p>Please confirm the cancellation when convenient.</p>
      <p>Regards,<br>Kialla Computers</p>
    </div>`;

    try {
      await sendDomainEmail({
        to: { address: supplier.email, name: supplier.name },
        subject: `Cancellation of Purchase Order ${po.po_number || `PO-${po.id}`} - Kialla Computers`,
        html,
      });
    } catch {
      throw createError({
        statusCode: 502,
        statusMessage: "Cancellation email failed. The purchase order was not cancelled.",
      });
    }
  }

  const lineIds = (po.accounting_purchase_order_lines || []).map((x: any) => Number(x.id)).filter(Boolean);
  let receivedByLine = new Map<number, number>();

  if (lineIds.length) {
    const { data: receiptLines, error: receiptError } = await s
      .from("accounting_inventory_receipt_lines")
      .select("purchase_order_line_id,quantity")
      .in("purchase_order_line_id", lineIds);
    if (receiptError && receiptError.code !== "42P01") {
      throw createError({ statusCode: 500, statusMessage: receiptError.message });
    }
    for (const r of receiptLines || []) {
      const lineId = Number(r.purchase_order_line_id);
      receivedByLine.set(lineId, (receivedByLine.get(lineId) || 0) + Number(r.quantity || 0));
    }
  }

  for (const line of po.accounting_purchase_order_lines || []) {
    const ordered = Number(line.quantity || 0);
    const received = receivedByLine.get(Number(line.id)) || 0;
    const alreadyCancelled = Number(line.cancelled_quantity || 0);
    const outstanding = Math.max(0, ordered - received - alreadyCancelled);
    if (outstanding <= 0) continue;

    const { error: lineError } = await s
      .from("accounting_purchase_order_lines")
      .update({ cancelled_quantity: alreadyCancelled + outstanding })
      .eq("id", line.id);
    if (lineError) throw createError({ statusCode: 500, statusMessage: lineError.message });
  }

  const now = new Date().toISOString();
  const actor = (event.context as any).securityAuditActor || {};
  const { data, error: updateError } = await s
    .from("accounting_purchase_orders")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancelled_by: actor.id || null,
      cancellation_reason: reason,
      cancellation_email_sent_at: emailSupplier ? now : null,
      cancellation_email_sent_to: emailSupplier ? supplier.email : null,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError || !data) {
    throw createError({ statusCode: 500, statusMessage: updateError?.message || "Unable to cancel purchase order." });
  }

  await recordPurchaseOrderActivity(
    event,
    id,
    current === "part_received" ? "outstanding_items_cancelled" : "cancelled",
    current,
    "cancelled",
    `${reason}${emailSupplier ? ` · Cancellation emailed to ${supplier.email}` : " · Internal cancellation only"}`,
  );

  return { ...data, cancellation_email_sent: emailSupplier };
});
