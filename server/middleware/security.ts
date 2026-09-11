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

  const forwardedProto = String(getHeader(event, "x-forwarded-proto") || "").toLowerCase();
  if (process.env.NODE_ENV === "production" || forwardedProto === "https") {
    setHeader(event, "Strict-Transport-Security", "max-age=31536000; includeSubDomains");
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

  // Browser requests that mutate application state must come from this site.
  // Stripe webhooks are server-to-server and are authenticated with Stripe's
  // signature, so they are intentionally excluded from this origin check.
  const method = String(event.method || "GET").toUpperCase();
  if (UNSAFE_METHODS.has(method) && path !== "/api/stripe/webhook") {
    const originHeader = String(getHeader(event, "origin") || "").trim();
    if (originHeader) {
      const requestUrl = getRequestURL(event);
      const forwardedHost = String(getHeader(event, "x-forwarded-host") || "").trim();
      const host = forwardedHost || String(getHeader(event, "host") || requestUrl.host).trim();
      const proto = forwardedProto || requestUrl.protocol.replace(":", "") || "https";
      const expectedOrigin = normaliseOrigin(`${proto}://${host}`);
      const suppliedOrigin = normaliseOrigin(originHeader);

      if (!expectedOrigin || !suppliedOrigin || suppliedOrigin !== expectedOrigin) {
        throw createError({
          statusCode: 403,
          statusMessage: "This request was blocked for security reasons.",
        });
      }
    }
  }
});
