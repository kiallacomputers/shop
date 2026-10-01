import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const q = String(getQuery(event).search || "").trim().toLowerCase();
  const s = getAdminSupabase();

  const [{ data: customers, error: customerError }, authResult] = await Promise.all([
    s.from("sales_customers")
      .select("*,manual_quotes(id,quote_number,status,created_at)")
      .order("created_at", { ascending: false })
      .limit(500),
    s.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (customerError) throw createError({ statusCode: 500, statusMessage: customerError.message });
  if (authResult.error) throw createError({ statusCode: 500, statusMessage: authResult.error.message });

  const linked = new Set((customers || []).map((c: any) => String(c.auth_user_id || "")).filter(Boolean));
  const rows: any[] = (customers || []).map((c: any) => ({ ...c, login_only: false, login_linked: !!c.auth_user_id }));

  for (const u of authResult.data.users || []) {
    if (linked.has(u.id)) continue;
    const email = String(u.email || "").trim();
    const name = String(u.user_metadata?.display_name || u.user_metadata?.full_name || email || "Registered User").trim();
    rows.push({
      id: `auth:${u.id}`,
      auth_user_id: u.id,
      full_name: name,
      company_name: null,
      email,
      phone: null,
      customer_type: "individual",
      pricing_level_key: "standard",
      processing_fee_enabled: true,
      manual_quotes: [],
      login_only: true,
      login_linked: false,
      created_at: u.created_at,
    });
  }

  const filtered = q ? rows.filter((x: any) => `${x.full_name || ""} ${x.company_name || ""} ${x.email || ""} ${x.phone || ""}`.toLowerCase().includes(q)) : rows;
  return filtered.sort((a: any, b: any) => String(a.full_name || a.email || "").localeCompare(String(b.full_name || b.email || "")));
});
