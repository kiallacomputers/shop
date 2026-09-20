import type { H3Event } from "h3";

const cleanOrigin = (value: unknown) => {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.origin;
  } catch {
    return "";
  }
};

export const getSiteOrigin = (_event?: H3Event) => {
  const config = useRuntimeConfig();
  const configured = cleanOrigin(
    config.public?.siteUrl ||
      process.env.NUXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL,
  );

  if (configured) return configured;

  // Keep development convenient without trusting the incoming Host header in
  // production redirects, password-reset links or customer emails.
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return "https://shop.kiallacomputers.com.au";
};
