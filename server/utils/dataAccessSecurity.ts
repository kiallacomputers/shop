import type { H3Event } from "h3";
import { writeSecurityAudit } from "~~/server/utils/securityAudit";

export async function auditOwnedResourceMiss(
  event: H3Event,
  input: { resourceType: string; resourceId?: string | number | null; actorId?: string | null },
) {
  await writeSecurityAudit(event, {
    action: "data.ownership_check",
    outcome: "denied",
    severity: "warning",
    actorId: input.actorId || null,
    details: {
      reason: "resource_not_owned_or_not_found",
      resource_type: String(input.resourceType).slice(0, 80),
      resource_id: input.resourceId == null ? null : String(input.resourceId).slice(0, 100),
    },
  });
}
