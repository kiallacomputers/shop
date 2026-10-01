import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { getProductionConfigChecks } from "~~/server/utils/secureConfig";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const supabase = getAdminSupabase();
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [recent, last24h, warnings7d, failures7d] = await Promise.all([
    supabase.from("kc_security_audit_log").select("id, created_at, actor_email, action, severity, outcome, resource, request_id").order("created_at", { ascending: false }).limit(12),
    supabase.from("kc_security_audit_log").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    supabase.from("kc_security_audit_log").select("id", { count: "exact", head: true }).gte("created_at", since7d).in("severity", ["warning", "critical"]),
    supabase.from("kc_security_audit_log").select("id", { count: "exact", head: true }).gte("created_at", since7d).in("outcome", ["denied", "failure"]),
  ]);

  const error = recent.error || last24h.error || warnings7d.error || failures7d.error;
  if (error) throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load security information." });

  return {
    summary: {
      events_24h: last24h.count || 0,
      warnings_7d: warnings7d.count || 0,
      failures_7d: failures7d.count || 0,
    },
    protections: [
      { key: "admin_auth", label: "Admin role enforcement", enabled: true },
      { key: "auth_hardening", label: "Authentication & session hardening", enabled: true },
      { key: "security_headers", label: "Security headers / CSP", enabled: true },
      { key: "csrf", label: "Same-origin mutation protection", enabled: true },
      { key: "validation", label: "Server-side input validation", enabled: true },
      { key: "rate_limit", label: "Persistent abuse rate limiting", enabled: true },
      { key: "audit", label: "Admin security audit logging", enabled: true },
      { key: "upload_security", label: "File upload & storage validation", enabled: true },
      { key: "payment_security", label: "Checkout, Stripe & webhook hardening", enabled: true },
      { key: "database_security", label: "Database & Supabase access hardening", enabled: true },
      { key: "config_security", label: "Secrets & production configuration hardening", enabled: true },
    ],
    configuration: {
      production: process.env.NODE_ENV === "production",
      checks: getProductionConfigChecks(),
    },
    recent: recent.data || [],
  };
});
