import type { H3Event } from "h3";
import { writeSecurityAudit } from "~~/server/utils/securityAudit";

export const auditPaymentSecurity = async (
  event: H3Event,
  action: string,
  outcome: "success" | "denied" | "failure",
  details: Record<string, unknown> = {},
  severity: "info" | "warning" | "critical" = outcome === "success" ? "info" : "warning",
) => {
  await writeSecurityAudit(event, {
    action,
    outcome,
    severity,
    resource: "/api/stripe/webhook",
    details,
  });
};

export const isStripeCheckoutSessionId = (value: unknown) =>
  /^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(String(value || "").trim());
