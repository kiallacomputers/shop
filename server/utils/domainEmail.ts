type EmailRecipient = {
  address: string;
  name?: string | null;
};

type SendDomainEmailOptions = {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  replyTo?: EmailRecipient[];
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

  const tenantId = String(config.microsoftTenantId || "").trim();
  const clientId = String(config.microsoftClientId || "").trim();
  const clientSecret = String(config.microsoftClientSecret || "").trim();
  const senderEmail = String(config.microsoftSenderEmail || "").trim();
  const senderName = String(config.microsoftSenderName || "Kialla Computers").trim();

  if (!tenantId || !clientId || !clientSecret || !senderEmail) {
    throw new Error(
      "Microsoft Graph email is not configured. Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET and MICROSOFT_SENDER_EMAIL.",
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
