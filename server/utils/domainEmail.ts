type EmailRecipient = {
  address: string;
  name?: string | null;
};

type EmailAttachment = {
  name: string;
  contentType: string;
  content: Buffer | Uint8Array | string;
};

type SendDomainEmailOptions = {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  replyTo?: EmailRecipient[];
  attachments?: EmailAttachment[];
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export { escapeHtml };

export async function sendDomainEmail(options: SendDomainEmailOptions) {
  const config = useRuntimeConfig();

  // Prefer the real runtime environment variables on Netlify.
  // Nuxt runtimeConfig can be populated at build time, which may leave secrets
  // empty in a deployed serverless function even though Netlify exposes them at runtime.
  const tenantId = String(
    process.env.MICROSOFT_TENANT_ID || config.microsoftTenantId || "",
  ).trim();
  const clientId = String(
    process.env.MICROSOFT_CLIENT_ID || config.microsoftClientId || "",
  ).trim();
  const clientSecret = String(
    process.env.MICROSOFT_CLIENT_SECRET || config.microsoftClientSecret || "",
  ).trim();
  const senderEmail = String(
    process.env.MICROSOFT_SENDER_EMAIL || config.microsoftSenderEmail || "",
  ).trim();
  const senderName = String(
    process.env.MICROSOFT_SENDER_NAME ||
      config.microsoftSenderName ||
      "Kialla Computers",
  ).trim();

  const missing = [
    !tenantId && "MICROSOFT_TENANT_ID",
    !clientId && "MICROSOFT_CLIENT_ID",
    !clientSecret && "MICROSOFT_CLIENT_SECRET",
    !senderEmail && "MICROSOFT_SENDER_EMAIL",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `Microsoft Graph email is not configured. Missing runtime variable${
        missing.length === 1 ? "" : "s"
      }: ${missing.join(", ")}.`,
    );
  }

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    },
  );

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    throw new Error(`Microsoft Graph token request failed (${tokenResponse.status}): ${details}`);
  }

  const tokenData = await tokenResponse.json() as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Microsoft Graph did not return an access token.");
  }

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const toRecipients = recipients
    .filter((recipient) => recipient?.address)
    .map((recipient) => ({
      emailAddress: {
        address: recipient.address,
        ...(recipient.name ? { name: recipient.name } : {}),
      },
    }));

  if (!toRecipients.length) {
    throw new Error("At least one email recipient is required.");
  }

  const graphResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: options.subject,
          body: { contentType: "HTML", content: options.html },
          toRecipients,
          ...(options.replyTo?.length
            ? {
                replyTo: options.replyTo.map((recipient) => ({
                  emailAddress: {
                    address: recipient.address,
                    ...(recipient.name ? { name: recipient.name } : {}),
                  },
                })),
              }
            : {}),
          from: {
            emailAddress: {
              address: senderEmail,
              name: senderName,
            },
          },
          ...(options.attachments?.length
            ? {
                attachments: options.attachments.map((attachment) => ({
                  "@odata.type": "#microsoft.graph.fileAttachment",
                  name: attachment.name,
                  contentType: attachment.contentType,
                  contentBytes:
                    typeof attachment.content === "string"
                      ? attachment.content
                      : Buffer.from(attachment.content).toString("base64"),
                })),
              }
            : {}),
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!graphResponse.ok) {
    const details = await graphResponse.text();
    throw new Error(`Microsoft Graph sendMail failed (${graphResponse.status}): ${details}`);
  }

  return { sent: true, senderEmail };
}
