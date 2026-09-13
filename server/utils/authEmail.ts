import { escapeHtml, sendDomainEmail } from "./domainEmail";

const shell = (title: string, intro: string, buttonText: string, buttonUrl: string, footer: string) => `
<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:24px 30px 10px;background:#0f172a;text-align:center;">
                <img src="https://shop.kiallacomputers.com.au/kialla-computers-logo.png" alt="Kialla Computers" width="800" style="display:inline-block;width:800px;max-width:100%;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 30px 12px;">
                <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;">Kialla Computers</div>
                <h1 style="margin:8px 0 14px;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
                <p style="margin:0;color:#475569;font-size:15px;line-height:1.65;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 30px 24px;">
                <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:9px;">${escapeHtml(buttonText)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 28px;">
                <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export async function sendSignupVerificationEmail(input: {
  email: string;
  name?: string | null;
  verificationUrl: string;
}) {
  const displayName = input.name?.trim() || "there";
  return sendDomainEmail({
    to: { address: input.email, name: input.name || undefined },
    subject: "Confirm your Kialla Computers account",
    html: shell(
      "Confirm your email address",
      `Hi ${escapeHtml(displayName)},<br><br>Thanks for creating a Kialla Computers account. Please confirm your email address to activate your account.`,
      "Confirm Email Address",
      input.verificationUrl,
      "If you did not create this account, you can safely ignore this email.",
    ),
  });
}

export async function sendPasswordRecoveryEmail(input: {
  email: string;
  recoveryUrl: string;
}) {
  return sendDomainEmail({
    to: { address: input.email },
    subject: "Reset your Kialla Computers password",
    html: shell(
      "Reset your password",
      "We received a request to reset the password for your Kialla Computers account.",
      "Reset Password",
      input.recoveryUrl,
      "If you did not request a password reset, you can safely ignore this email. The reset link should only be used by the account owner.",
    ),
  });
}
