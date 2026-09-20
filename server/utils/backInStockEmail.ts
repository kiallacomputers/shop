import { sendDomainEmail, escapeHtml } from "~~/server/utils/domainEmail";

export type BackInStockEmailData = {
  email: string;
  customerName?: string | null;
  productName: string;
  variantName?: string | null;
  productCode?: string | null;
  price: number;
  pricingLevelName?: string | null;
  productUrl: string;
  imageUrl?: string | null;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value || 0);

export async function sendBackInStockEmail(data: BackInStockEmailData) {
  const name = String(data.customerName || "there").trim() || "there";
  const option = data.variantName ? ` — ${escapeHtml(data.variantName)}` : "";
  const image = data.imageUrl
    ? `<img src="${escapeHtml(data.imageUrl)}" alt="${escapeHtml(data.productName)}" style="display:block;max-width:220px;max-height:180px;object-fit:contain;margin:0 auto 18px;" />`
    : "";

  const html = `
  <div style="margin:0;background:#f1f5f9;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:650px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <div style="background:#0f172a;padding:24px 28px;text-align:center;">
        <img src="${escapeHtml(new URL('/kialla-computers-logo.png', data.productUrl).origin + '/kialla-computers-logo.png')}" alt="Kialla Computers" style="max-width:210px;max-height:80px;object-fit:contain;" />
      </div>
      <div style="padding:30px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0284c7;">Back in stock</p>
        <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;">Good news — it’s available!</h1>
        <p style="margin:0 0 18px;line-height:1.6;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 24px;line-height:1.6;">The product you asked us to notify you about is now available from Kialla Computers.</p>
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:22px;text-align:center;background:#f8fafc;">
          ${image}
          <h2 style="margin:0;font-size:20px;">${escapeHtml(data.productName)}${option}</h2>
          ${data.productCode ? `<p style="margin:8px 0 0;color:#64748b;font-size:13px;">Product Code: ${escapeHtml(data.productCode)}</p>` : ""}
          <p style="margin:18px 0 0;font-size:26px;font-weight:800;color:#0369a1;">${money(data.price)}</p>
          ${data.pricingLevelName && data.pricingLevelName !== "Standard" ? `<p style="margin:5px 0 0;font-size:12px;font-weight:700;color:#475569;">Your ${escapeHtml(data.pricingLevelName)} price</p>` : ""}
        </div>
        <div style="text-align:center;margin:26px 0;">
          <a href="${escapeHtml(data.productUrl)}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:800;padding:14px 24px;border-radius:9px;">VIEW PRODUCT &amp; BUY NOW</a>
        </div>
        <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#64748b;">Stock can sell quickly, so availability is not guaranteed until your order has been completed.</p>
        <p style="margin:0;line-height:1.6;">Thanks for choosing Kialla Computers.<br><strong>Kialla Computers</strong><br><span style="color:#64748b;">Computer Sales, Service &amp; ICT Solutions · Kialla, Victoria</span></p>
      </div>
    </div>
  </div>`;

  await sendDomainEmail({
    to: { address: data.email, name: data.customerName || undefined },
    subject: `Back in stock: ${data.productName}${data.variantName ? ` — ${data.variantName}` : ""}`,
    html,
  });
}
