import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const allowedSeverity = new Set(["info", "warning", "critical"]);
const allowedOutcome = new Set(["success", "denied", "failure"]);

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const query = getQuery(event);
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1));
  const pageSize = Math.max(10, Math.min(100, Number(query.pageSize) || 50));
  const severity = String(query.severity || "").toLowerCase();
  const outcome = String(query.outcome || "").toLowerCase();
  const offset = (page - 1) * pageSize;
  const supabase = getAdminSupabase();

  let request = supabase
    .from("kc_security_audit_log")
    .select("id, created_at, actor_email, action, severity, outcome, resource, request_id, user_agent", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (allowedSeverity.has(severity)) request = request.eq("severity", severity);
  if (allowedOutcome.has(outcome)) request = request.eq("outcome", outcome);

  const { data, error, count } = await request;
  if (error) throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load security audit log." });

  return { rows: data || [], count: count || 0, page, pageSize };
});
