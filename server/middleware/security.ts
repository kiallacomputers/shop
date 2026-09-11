import { randomUUID } from "node:crypto";

const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

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
});
