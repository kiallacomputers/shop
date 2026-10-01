import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { sendDomainEmail, escapeHtml } from "~~/server/utils/domainEmail";
import { createPurchaseOrderPdf, getPurchaseOrderFilename } from "~~/server/utils/purchaseOrderPdf";
import { recordPurchaseOrderActivity } from "~~/server/utils/purchaseOrderLifecycle";
const money=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
export default defineEventHandler(async (event) => {
  await requireAdmin(event); const id=Number(getRouterParam(event,"id")); if(!id) throw createError({statusCode:400,statusMessage:"Invalid purchase order."});
  const s=getAdminSupabase(); const {data:po,error}=await s.from("accounting_purchase_orders").select("*,accounting_suppliers(*),accounting_purchase_order_lines(*)").eq("id",id).single();
  if(error||!po) throw createError({statusCode:404,statusMessage:"Purchase order not found."});
  const current=String(po.status||"").toLowerCase(); if(!["approved","ordered","part_received","received"].includes(current)) throw createError({statusCode:409,statusMessage:"Only approved or already ordered purchase orders can be emailed."});
  const supplier:any=po.accounting_suppliers; if(!supplier?.email) throw createError({statusCode:400,statusMessage:"This supplier does not have an email address."});
  const rows=(po.accounting_purchase_order_lines||[]).map((l:any)=>`<tr><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(l.sku||'—')}</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(l.description)}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${Number(l.quantity||0)}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${money(l.unit_cost_ex_gst)}</td></tr>`).join('');
  const html=`<div style="font-family:Arial,sans-serif;max-width:800px;margin:auto;color:#0f172a"><h2>Purchase Order ${escapeHtml(po.po_number)}</h2><p>Hi ${escapeHtml(supplier.contact_name||supplier.name||'there')},</p><p>Please find attached our purchase order <b>${escapeHtml(po.po_number)}</b>.</p><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left">SKU</th><th style="padding:8px;text-align:left">Description</th><th style="padding:8px;text-align:right">Qty</th><th style="padding:8px;text-align:right">Unit ex GST</th></tr></thead><tbody>${rows}</tbody></table><p style="text-align:right;font-size:18px"><b>Total: ${money(po.total)}</b></p>${po.expected_date?`<p><b>Expected delivery:</b> ${escapeHtml(po.expected_date)}</p>`:''}${po.notes?`<p><b>Notes:</b><br>${escapeHtml(po.notes).replaceAll('\n','<br>')}</p>`:''}<p>Regards,<br>Kialla Computers</p></div>`;
  const pdf=createPurchaseOrderPdf(po); const isFirst=current==="approved";
  try { await sendDomainEmail({to:{address:supplier.email,name:supplier.name},subject:`Purchase Order ${po.po_number} - Kialla Computers`,html,attachments:[{name:getPurchaseOrderFilename(po),contentType:"application/pdf",content:pdf}]}); }
  catch(e:any){ throw createError({statusCode:502,statusMessage:"Purchase order email failed. The order status was not changed."}); }
  const now=new Date().toISOString(); const actor=(event.context as any).securityAuditActor?.id||null;
  const patch:any={last_emailed_at:now,last_emailed_to:supplier.email,last_emailed_by:actor,updated_at:now}; if(isFirst) Object.assign(patch,{status:"ordered",ordered_at:now,ordered_by:actor});
  const {data,error:ue}=await s.from("accounting_purchase_orders").update(patch).eq("id",id).select().single(); if(ue||!data) throw createError({statusCode:500,statusMessage:"Email was sent, but the purchase order email history could not be updated."});
  await recordPurchaseOrderActivity(event,id,isFirst?"sent_to_supplier":"resent_to_supplier",current,isFirst?"ordered":current,`PDF emailed to ${supplier.email}`); return {...data,email_sent_to:supplier.email,resent:!isFirst};
});
