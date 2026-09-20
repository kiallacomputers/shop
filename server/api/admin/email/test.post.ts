import { requireAdmin } from "~~/server/utils/adminAuth";
import { escapeHtml, sendDomainEmail } from "~~/server/utils/domainEmail";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const email = String(body?.email || "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: "A valid test email address is required." });
  }
  try {
    await sendDomainEmail({
      to: { address: email },
      subject: "Kialla Computers website email test",
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;padding:24px;"><h1>Kialla Computers</h1><p>This is a successful test email from your Nuxt website.</p><p>Recipient: <strong>${escapeHtml(email)}</strong></p><p>If you received this message, Microsoft Graph domain email is configured correctly.</p></div>`,
    });
    return { success: true, message: `Test email sent to ${email}.` };
  } catch (error: any) {
    console.error("MICROSOFT GRAPH TEST EMAIL ERROR:", error?.message || error);
    throw createError({ statusCode: 503, statusMessage: error?.message || "Unable to send test email." });
  }
});
