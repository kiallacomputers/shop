import { writeSecurityAudit } from "~~/server/utils/securityAudit";
import { randomUUID } from "node:crypto";

const MAX_REQUEST_BYTES = 12 * 1024 * 1024;
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const normaliseOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
};

const buildCsp = (event: any) => {
  const config = useRuntimeConfig(event);
  const supabaseUrl = String(config.public?.supabaseUrl || "").trim();

  let supabaseOrigin = "";
  let supabaseWsOrigin = "";

  try {
    const parsed = new URL(supabaseUrl);
    supabaseOrigin = parsed.origin;
    supabaseWsOrigin = `${parsed.protocol === "https:" ? "wss:" : "ws:"}//${parsed.host}`;
  } catch {
    // If configuration is missing, keep the policy self-only.
  }

  const connect = ["'self'"];
  if (supabaseOrigin) connect.push(supabaseOrigin);
  if (supabaseWsOrigin) connect.push(supabaseWsOrigin);

  return [
    "default-src 'self'",
    // Nuxt emits inline bootstrap state/scripts. Keep unsafe-inline for compatibility
    // while still restricting scripts to this origin.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
};

export default defineEventHandler((event) => {
  const requestId = randomUUID();
  event.context.requestId = requestId;

  setHeader(event, "X-Request-ID", requestId);
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "X-Frame-Options", "DENY");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
  setHeader(
    event,
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  setHeader(event, "Content-Security-Policy", buildCsp(event));
  setHeader(event, "Cross-Origin-Opener-Policy", "same-origin");
  setHeader(event, "X-Permitted-Cross-Domain-Policies", "none");

  const forwardedProto = String(getHeader(event, "x-forwarded-proto") || "").toLowerCase();
  if (process.env.NODE_ENV === "production" || forwardedProto === "https") {
    setHeader(
      event,
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  const path = getRequestURL(event).pathname;
  if (
    path.startsWith("/api/admin/") ||
    path.startsWith("/api/account/") ||
    path.startsWith("/api/stripe/") ||
    path === "/api/checkout/success"
  ) {
    setHeader(event, "Cache-Control", "no-store, max-age=0");
    setHeader(event, "Pragma", "no-cache");
  }

  const contentLength = Number(getHeader(event, "content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Request is too large.",
    });
  }

  // Browser requests that mutate state must be same-origin.
  // Stripe webhooks are server-to-server and authenticated by Stripe signature.
  const method = String(event.method || "GET").toUpperCase();
  if (UNSAFE_METHODS.has(method) && path !== "/api/stripe/webhook") {
    const requestUrl = getRequestURL(event);
    const forwardedHost = String(getHeader(event, "x-forwarded-host") || "").trim();
    const host = forwardedHost || String(getHeader(event, "host") || requestUrl.host).trim();
    const proto = forwardedProto || requestUrl.protocol.replace(":", "") || "https";
    const expectedOrigin = normaliseOrigin(`${proto}://${host}`);

    const originHeader = String(getHeader(event, "origin") || "").trim();
    const refererHeader = String(getHeader(event, "referer") || "").trim();
    const fetchSite = String(getHeader(event, "sec-fetch-site") || "").trim().toLowerCase();

    // Modern browsers tell us explicitly when a request came from another site.
    if (fetchSite === "cross-site") {
      throw createError({
        statusCode: 403,
        statusMessage: "This request was blocked for security reasons.",
      });
    }

    // Prefer Origin. If it is absent, use Referer when a browser supplies one.
    const suppliedOrigin =
      normaliseOrigin(originHeader) ||
      normaliseOrigin(refererHeader);

    if (
      suppliedOrigin &&
      (!expectedOrigin || suppliedOrigin !== expectedOrigin)
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: "This request was blocked for security reasons.",
      });
    }
  }
  // Record successful administrator mutations without storing request bodies,
  // passwords, tokens, payment details or other sensitive payload data.
  if (UNSAFE_METHODS.has(method) && path.startsWith("/api/admin/")) {
    event.node.res.once("finish", () => {
      const statusCode = Number(event.node.res.statusCode || 200);
      const actor = (event.context as any).securityAuditActor;
      if (!actor || statusCode >= 400) return;

      void writeSecurityAudit(event, {
        action: `admin.${method.toLowerCase()}`,
        outcome: "success",
        severity: path.includes("/accounts") ? "warning" : "info",
        resource: path,
        details: { status_code: statusCode },
      });
    });
  }

});
