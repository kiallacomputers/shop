const env = (name: string) => String(process.env[name] || "").trim();

export type ConfigCheck = { key: string; label: string; configured: boolean; required: boolean };

export const getProductionConfigChecks = (): ConfigCheck[] => [
  { key: "supabase_url", label: "Supabase URL", configured: !!env("SUPABASE_URL"), required: true },
  { key: "supabase_anon", label: "Supabase anonymous key", configured: !!env("SUPABASE_ANON_KEY"), required: true },
  { key: "supabase_secret", label: "Supabase server secret key", configured: !!env("SUPABASE_SECRET_KEY"), required: true },
  { key: "stripe_secret", label: "Stripe secret key", configured: !!env("STRIPE_SECRET_KEY"), required: true },
  { key: "stripe_webhook", label: "Stripe webhook secret", configured: !!env("STRIPE_WEBHOOK_SECRET"), required: true },
  { key: "graph_tenant", label: "Microsoft Graph tenant", configured: !!env("MICROSOFT_TENANT_ID"), required: true },
  { key: "graph_client", label: "Microsoft Graph client", configured: !!env("MICROSOFT_CLIENT_ID"), required: true },
  { key: "graph_secret", label: "Microsoft Graph client secret", configured: !!env("MICROSOFT_CLIENT_SECRET"), required: true },
  { key: "graph_sender", label: "Microsoft Graph sender", configured: !!env("MICROSOFT_SENDER_EMAIL"), required: true },
  { key: "site_url", label: "Production site URL", configured: !!(env("NUXT_PUBLIC_SITE_URL") || env("SITE_URL")), required: false },
  { key: "facebook_token", label: "Facebook publishing token", configured: !!env("FACEBOOK_PAGE_ACCESS_TOKEN"), required: false },
  { key: "google_private_key", label: "Google Merchant private key", configured: !!env("GOOGLE_MERCHANT_SERVICE_ACCOUNT_PRIVATE_KEY"), required: false },
];

export const assertCoreServerConfig = () => {
  const missing = getProductionConfigChecks().filter((x) => x.required && !x.configured).map((x) => x.label);
  if (missing.length) throw new Error(`Server configuration is incomplete (${missing.join(", ")}).`);
};
