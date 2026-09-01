import { escapeHtml, sendDomainEmail } from "~~/server/utils/domainEmail";

type OrderEmailItem = {
  product_name: string;
  quantity: number;
  price: number;
};

type OrderEmailData = {
  id: string | number;
  customer_email: string;
  customer_name?: string | null;
  total: number;
  shipping_method?: string | null;
  shipping_postcode?: string | null;
  shipping_cost?: number | null;
  items: OrderEmailItem[];
};

const money = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const rows = order.items
    .map((item) => {
      const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.product_name)}</td>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;">${Number(item.quantity || 0)}</td>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(item.price)}</td>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${money(subtotal)}</td>
        </tr>`;
    })
    .join("");

  const customerName = order.customer_name?.trim() || "Customer";
  const delivery = order.shipping_method
    ? `<p style="margin:6px 0;"><strong>Delivery:</strong> ${escapeHtml(order.shipping_method)}${order.shipping_postcode ? ` (${escapeHtml(order.shipping_postcode)})` : ""}</p>`
    : "";

  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <div style="padding:28px;background:#0f172a;color:#ffffff;">
        <h1 style="margin:0;font-size:24px;">Kialla Computers</h1>
        <p style="margin:8px 0 0;color:#cbd5e1;">Order confirmation</p>
      </div>
      <div style="padding:28px;">
        <p>Hi ${escapeHtml(customerName)},</p>
        <p>Thank you for your order. Your payment has been received successfully.</p>
        <p style="margin:6px 0;"><strong>Order:</strong> #${escapeHtml(order.id)}</p>
        ${delivery}
        <table style="width:100%;border-collapse:collapse;margin-top:22px;font-size:14px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:12px;text-align:left;">Product</th>
              <th style="padding:12px;text-align:center;">Qty</th>
              <th style="padding:12px;text-align:right;">Price</th>
              <th style="padding:12px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:22px 0 0;text-align:right;font-size:20px;"><strong>Total: ${money(order.total)}</strong></p>
        <p style="margin-top:28px;">We will contact you if we need any further information while preparing your order.</p>
        <p style="margin-bottom:0;">Regards,<br><strong>Kialla Computers</strong></p>
      </div>
    </div>
    <p style="text-align:center;color:#64748b;font-size:12px;margin-top:18px;">This email was sent automatically by Kialla Computers.</p>
  </div>
</body>
</html>`;

  return sendDomainEmail({
    to: { address: order.customer_email, name: order.customer_name },
    subject: `Kialla Computers - Order #${order.id} confirmation`,
    html,
  });
}
