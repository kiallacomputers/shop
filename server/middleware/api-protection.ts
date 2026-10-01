import type { H3Event } from "h3";
import { getHeader, getRequestURL, setHeader } from "h3";
import { writeSecurityAudit } from "~~/server/utils/securityAudit";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SENSITIVE_PREFIXES = ["/api/admin/", "/api/account/", "/api/accounting/customer"];

function isSensitive(pathname: string) {
  return SENSITIVE_PREFIXES.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
}

function sameOrigin(event: H3Event, origin: string) {
  try {
    const requestUrl = getRequestURL(event);
    const supplied = new URL(origin);
    return supplied.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  if (!isSensitive(url.pathname)) return;

  // Sensitive account/admin responses should not be cached by browsers or edges.
  setHeader(event, "Cache-Control", "no-store, max-age=0");
  setHeader(event, "Pragma", "no-cache");

  const method = String(event.method || "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) return;

  // Modern browsers provide Sec-Fetch-Site. Reject explicit cross-site writes.
  const fetchSite = String(getHeader(event, "sec-fetch-site") || "").toLowerCase();
  if (fetchSite === "cross-site") {
    await writeSecurityAudit(event, {
      action: "api.cross_site_write",
      outcome: "denied",
      severity: "warning",
      resource: url.pathname,
      details: { method, reason: "sec_fetch_site_cross_site" },
    });
    throw createError({ statusCode: 403, statusMessage: "Cross-site request denied." });
  }

  // Origin is a second CSRF boundary. Do not reject non-browser clients merely
  // because Origin is absent; authentication/authorisation still applies.
  const origin = String(getHeader(event, "origin") || "").trim();
  if (origin && !sameOrigin(event, origin)) {
    await writeSecurityAudit(event, {
      action: "api.cross_origin_write",
      outcome: "denied",
      severity: "warning",
      resource: url.pathname,
      details: { method, reason: "origin_mismatch" },
    });
    throw createError({ statusCode: 403, statusMessage: "Cross-origin request denied." });
  }
});
