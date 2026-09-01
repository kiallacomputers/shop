import { escapeHtml, sendDomainEmail } from "~~/server/utils/domainEmail";
import {
  buildInvoicePdf,
  getInvoiceFilename,
  type InvoiceData,
} from "~~/server/utils/invoicePdf";

type OrderEmailItem = {
  product_name: string;
  quantity: number;
  price: number;
};

type ShippingAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type OrderEmailData = {
  id: string | number;
  customer_email: string;
  customer_name?: string | null;
  total: number;
  shipping_method?: string | null;
  shipping_postcode?: string | null;
  shipping_cost?: number | null;
  shipping_address?: ShippingAddress | null;
  items: OrderEmailItem[];
  paid_at?: Date | string | null;
};

const money = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

const addressHtml = (order: OrderEmailData) => {
  const address = order.shipping_address || {};
  const lines = [
    address.name || order.customer_name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code || order.shipping_postcode]
      .filter(Boolean)
      .join(" "),
    address.country,
  ].filter((value): value is string => Boolean(value && String(value).trim()));

  if (!lines.length) {
    return `<p style="margin:6px 0;color:#b45309;"><strong>Delivery address:</strong> Address was not supplied by Stripe.</p>`;
  }

  return `<div style="margin-top:18px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
    <div style="font-weight:700;margin-bottom:8px;">Delivery address</div>
    ${lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
  </div>`;
};

const itemRows = (order: OrderEmailData) =>
  order.items
    .map((item) => {
      const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.product_name)}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;">${Number(item.quantity || 0)}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(item.price)}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${money(subtotal)}</td>
      </tr>`;
    })
    .join("");

const invoiceFor = (order: OrderEmailData) => {
  const invoiceData: InvoiceData = {
    ...order,
    shipping_address: order.shipping_address,
  };
  const pdf = buildInvoicePdf(invoiceData);
  return {
    name: getInvoiceFilename(invoiceData),
    contentType: "application/pdf",
    content: pdf,
  };
};

export async function sendOrderEmails(order: OrderEmailData) {
  const rows = itemRows(order);
  const delivery = order.shipping_method
    ? `<p style="margin:6px 0;"><strong>Delivery:</strong> ${escapeHtml(order.shipping_method)}${order.shipping_cost ? ` - ${money(order.shipping_cost)}` : ""}</p>`
    : "";
  const customerName = order.customer_name?.trim() || "Customer";
  const attachment = invoiceFor(order);

  const customerHtml = `<!doctype html>
<html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<div style="max-width:680px;margin:0 auto;padding:32px 16px;">
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
<div style="padding:28px;background:#0f172a;color:#fff;"><h1 style="margin:0;font-size:24px;">Kialla Computers</h1><p style="margin:8px 0 0;color:#cbd5e1;">Order confirmation</p></div>
<div style="padding:28px;">
<p>Hi ${escapeHtml(customerName)},</p>
<p>Thank you for your order. Your payment has been received successfully.</p>
<p style="margin:6px 0;"><strong>Order:</strong> #${escapeHtml(order.id)}</p>
${delivery}
${addressHtml(order)}
<table style="width:100%;border-collapse:collapse;margin-top:22px;font-size:14px;"><thead><tr style="background:#f1f5f9;"><th style="padding:12px;text-align:left;">Product</th><th style="padding:12px;text-align:center;">Qty</th><th style="padding:12px;text-align:right;">Price</th><th style="padding:12px;text-align:right;">Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin:22px 0 0;text-align:right;font-size:20px;"><strong>Total: ${money(order.total)}</strong></p>
<p style="margin-top:24px;"><strong>Your PDF invoice is attached to this email.</strong></p>
<p>We will contact you if we need any further information while preparing your order.</p>
<p style="margin-bottom:0;">Regards,<br><strong>Kialla Computers</strong></p>
</div></div></div></body></html>`;

  const sellerAddress = String(
    process.env.ORDER_NOTIFICATION_EMAIL ||
      process.env.MICROSOFT_SENDER_EMAIL ||
      useRuntimeConfig().microsoftSenderEmail ||
      "",
  ).trim();

  const sellerHtml = `<!doctype html>
<html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<div style="max-width:680px;margin:0 auto;padding:32px 16px;">
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
<div style="padding:28px;background:#0f172a;color:#fff;"><h1 style="margin:0;font-size:24px;">New Kialla Computers Order</h1><p style="margin:8px 0 0;color:#cbd5e1;">Order #${escapeHtml(order.id)}</p></div>
<div style="padding:28px;">
<p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
<p><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
${delivery}
${addressHtml(order)}
<table style="width:100%;border-collapse:collapse;margin-top:22px;font-size:14px;"><thead><tr style="background:#f1f5f9;"><th style="padding:12px;text-align:left;">Product</th><th style="padding:12px;text-align:center;">Qty</th><th style="padding:12px;text-align:right;">Price</th><th style="padding:12px;text-align:right;">Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin:22px 0 0;text-align:right;font-size:20px;"><strong>Total: ${money(order.total)}</strong></p>
<p style="margin-top:24px;"><strong>A PDF copy of the invoice is attached.</strong></p>
</div></div></div></body></html>`;

  const result = { customerSent: false, sellerSent: false };

  await sendDomainEmail({
    to: { address: order.customer_email, name: order.customer_name },
    subject: `Kialla Computers - Order #${order.id} confirmation`,
    html: customerHtml,
    attachments: [attachment],
  });
  result.customerSent = true;

  if (sellerAddress) {
    await sendDomainEmail({
      to: { address: sellerAddress, name: "Kialla Computers" },
      subject: `New order #${order.id} - ${customerName} - ${money(order.total)}`,
      html: sellerHtml,
      replyTo: [{ address: order.customer_email, name: order.customer_name }],
      attachments: [attachment],
    });
    result.sellerSent = true;
  }

  return result;
}
