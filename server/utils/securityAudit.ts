import { createHash } from "node:crypto";
import type { H3Event } from "h3";
import { getHeader, getRequestIP, getRequestURL } from "h3";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { redactSensitive } from "~~/server/utils/secretRedaction";

export type SecurityAuditSeverity = "info" | "warning" | "critical";

const clean = (value: unknown, max = 500) =>
  String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

const hashIp = (event: H3Event) => {
  const ip = clean(getRequestIP(event, { xForwardedFor: true }) || "unknown", 120);
  return createHash("sha256").update(ip).digest("hex");
};

export const writeSecurityAudit = async (
  event: H3Event,
  input: {
    action: string;
    severity?: SecurityAuditSeverity;
    outcome?: "success" | "denied" | "failure";
    resource?: string;
    details?: Record<string, unknown>;
    actorId?: string | null;
    actorEmail?: string | null;
  },
) => {
  try {
    const actor = (event.context as any).securityAuditActor || {};
    const requestId = clean((event.context as any).requestId, 100) || null;
    const url = getRequestURL(event);
    const supabase = getAdminSupabase();

    const { error } = await supabase.from("kc_security_audit_log").insert({
      actor_id: input.actorId ?? actor.id ?? null,
      actor_email: clean(input.actorEmail ?? actor.email, 320) || null,
      action: clean(input.action, 120),
      severity: input.severity || "info",
      outcome: input.outcome || "success",
      resource: clean(input.resource || url.pathname, 500) || null,
      request_id: requestId,
      ip_hash: hashIp(event),
      user_agent: clean(getHeader(event, "user-agent"), 500) || null,
      details: redactSensitive(input.details || {}),
    });

    if (error) console.error("SECURITY AUDIT INSERT ERROR:", error.message);
  } catch (error) {
    // Security logging must never break the business operation being audited.
    console.error("SECURITY AUDIT ERROR:", redactSensitive(error));
  }
};
