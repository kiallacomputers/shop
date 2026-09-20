import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const query = getQuery(event);
  const status = String(query.status || "all").trim();
  const search = String(query.search || "").trim().toLowerCase();
  const supabase = getAdminSupabase();

  let builder = supabase
    .from("customer_quote_requests")
    .select(`id,quote_number,user_id,status,customer_message,admin_notes,quoted_total,expires_at,quoted_at,sent_at,created_at,updated_at,customer_quote_request_items(id,product_id,variant_id,product_name,variant_name,product_code,quantity,requested_price,quoted_price)`)
    .order("created_at", { ascending: false })
    .limit(250);
  if (["requested","reviewing","quoted","accepted","declined","closed"].includes(status)) builder = builder.eq("status", status);

  const { data, error } = await builder;
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const rows:any[] = [];
  for (const quote of data || []) {
    const auth = await supabase.auth.admin.getUserById(String(quote.user_id));
    const user = auth.data?.user;
    const customerName = String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "");
    const customerEmail = String(user?.email || "");
    if (search) {
      const haystack = `${quote.quote_number || ""} ${quote.id} ${customerName} ${customerEmail} ${quote.customer_message || ""}`.toLowerCase();
      if (!haystack.includes(search)) continue;
    }
    rows.push({ ...quote, customer_name: customerName, customer_email: customerEmail });
  }
  return rows;
});
