import { escapeHtml, sendDomainEmail } from "~~/server/utils/domainEmail";

type CustomerEmailInput = {
  email: string;
  name?: string | null;
  subject: string;
  message: string;
};

const nl2br = (value: string) => escapeHtml(value).replaceAll("\n", "<br>");

export async function sendCustomerDirectEmail(input: CustomerEmailInput) {
  const customerName = String(input.name || "").trim();
  const greeting = customerName ? `Hi ${escapeHtml(customerName)},` : "Hello,";
  const subject = String(input.subject || "").trim();
  const message = String(input.message || "").trim();

  const html = `
    <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;background:#0f172a;color:#ffffff;">
          <div style="font-size:22px;font-weight:800;">Kialla Computers</div>
          <div style="margin-top:4px;font-size:13px;color:#cbd5e1;">Computer Sales, Service &amp; ICT Solutions</div>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${greeting}</p>
          <div style="font-size:15px;line-height:1.7;color:#334155;">${nl2br(message)}</div>
          <p style="margin:26px 0 0;font-size:15px;line-height:1.6;color:#334155;">Regards,<br><strong>Kialla Computers</strong></p>
        </div>
        <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
          Kialla, Victoria, Australia · shop.kiallacomputers.com.au
        </div>
      </div>
    </div>`;

  return sendDomainEmail({
    to: { address: input.email, name: customerName || undefined },
    subject,
    html,
  });
}
