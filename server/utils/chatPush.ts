import { escapeHtml, sendDomainEmail } from "~~/server/utils/domainEmail";

export async function notifyAdminsOfChat(input: {
  conversationId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  message: string;
}) {
  const config = useRuntimeConfig();
  const recipient = String(
    process.env.CHAT_NOTIFICATION_EMAIL ||
    process.env.ORDER_NOTIFICATION_EMAIL ||
    process.env.MICROSOFT_SENDER_EMAIL ||
    config.microsoftSenderEmail ||
    "",
  ).trim();

  if (!recipient) {
    console.warn("CHAT NOTIFICATION EMAIL: No recipient configured.");
    return { sent: false, configured: false };
  }

  const siteUrl = String(
    config.public.siteUrl ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://shop.kiallacomputers.com.au",
  ).replace(/\/+$/, "");

  const chatUrl = `${siteUrl}/admin/chat?conversation=${encodeURIComponent(input.conversationId)}`;
  const customerName = String(input.customerName || "Website visitor").trim();
  const customerEmail = String(input.customerEmail || "").trim();

  await sendDomainEmail({
    to: { address: recipient, name: "Kialla Computers" },
    subject: `New website chat from ${customerName}`,
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:28px 14px;">
      <div style="overflow:hidden;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;">
        <div style="padding:22px 26px;background:#0f172a;text-align:center;">
          <img src="${siteUrl}/kialla-computers-logo.png" alt="Kialla Computers" style="display:inline-block;max-width:180px;height:auto;border:0;" />
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;">New live chat</p>
          <h1 style="margin:0 0 18px;font-size:24px;">${escapeHtml(customerName)}</h1>
          ${customerEmail ? `<p style="margin:0 0 14px;color:#475569;"><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>` : ""}
          <div style="padding:16px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;line-height:1.6;">
            ${escapeHtml(input.message).replaceAll("\n", "<br>")}
          </div>
          <p style="margin:24px 0 0;">
            <a href="${escapeHtml(chatUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:9px;">
              Open Admin Chat
            </a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`,
  });

  return { sent: true, configured: true };
}
