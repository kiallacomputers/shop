import type { H3Event } from "h3";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export async function recordPurchaseOrderActivity(event:H3Event, purchaseOrderId:number, action:string, fromStatus:string|null, toStatus:string|null, notes?:string|null) {
  const actor:any=(event.context as any).securityAuditActor || {};
  const { error } = await getAdminSupabase().from("accounting_purchase_order_activity").insert({
    purchase_order_id: purchaseOrderId, action, from_status: fromStatus, to_status: toStatus, notes: notes || null,
    actor_id: actor.id || null, actor_email: actor.email || null
  });
  if (error) console.error("PURCHASE ORDER ACTIVITY ERROR", error.message);
}
