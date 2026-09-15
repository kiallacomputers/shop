import { escapeHtml, sendDomainEmail } from "~~/server/utils/domainEmail";
export async function sendReviewRequestEmail(order:any, products:any[]) {
  if (!order?.customer_email || !products?.length) return;
  const links = products.map((p:any)=>`<li style="margin:10px 0"><a href="https://shop.kiallacomputers.com.au/product/${encodeURIComponent(p.slug)}#reviews" style="color:#2367d1;font-weight:700">Review ${escapeHtml(p.name)}</a></li>`).join("");
  await sendDomainEmail({to:{address:order.customer_email,name:order.customer_name},subject:`How did we do? Review your Kialla Computers order #${order.id}`,html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><img src="https://shop.kiallacomputers.com.au/kialla-computers-logo.png" alt="Kialla Computers" style="width:240px;max-width:70%;height:auto"><h2>How did we do?</h2><p>Hi ${escapeHtml(order.customer_name||"there")},</p><p>Your order has been delivered. We'd love to hear what you think about your purchase.</p><ul>${links}</ul><p>Reviews are linked to your verified purchase and help other customers make an informed choice.</p><p>Thanks,<br><strong>Kialla Computers</strong></p></div>`});
}
