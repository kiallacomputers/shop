import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const full_name = String(body?.full_name || "").trim();
  if (!full_name) throw createError({ statusCode: 400, statusMessage: "Customer name is required." });

  const pricing_level_key = String(body?.pricing_level_key || "standard").trim() || "standard";
  const auth_user_id = String(body?.auth_user_id || "").trim() || null;
  const s = getAdminSupabase();

  const { data: level, error: levelError } = await s
    .from("customer_pricing_levels")
    .select("key")
    .eq("key", pricing_level_key)
    .eq("active", true)
    .maybeSingle();

  if (levelError || !level) {
    throw createError({ statusCode: 400, statusMessage: "Please select a valid active pricing level." });
  }

  // If a login account was selected, make sure it is a real Supabase Auth user
  // and is not already linked to another sales customer.
  if (auth_user_id) {
    const { data: authData, error: authError } = await s.auth.admin.getUserById(auth_user_id);
    if (authError || !authData?.user) {
      throw createError({ statusCode: 400, statusMessage: "Please select a valid login account." });
    }

    const { data: existingLink, error: existingLinkError } = await s
      .from("sales_customers")
      .select("id,full_name")
      .eq("auth_user_id", auth_user_id)
      .maybeSingle();

    if (existingLinkError) {
      throw createError({ statusCode: 500, statusMessage: existingLinkError.message });
    }

    if (existingLink) {
      throw createError({
        statusCode: 409,
        statusMessage: `That login account is already linked to ${existingLink.full_name || "another customer"}.`,
      });
    }
  }

  const row = {
    customer_type: body?.customer_type === "business" ? "business" : "individual",
    pricing_level_key,
    full_name,
    company_name: String(body?.company_name || "").trim() || null,
    email: String(body?.email || "").trim() || null,
    phone: String(body?.phone || "").trim() || null,
    auth_user_id,
    billing_address: String(body?.billing_address || "").trim() || null,
    delivery_address: String(body?.delivery_address || "").trim() || null,
    notes: String(body?.notes || "").trim() || null,
  };

  const { data, error } = await s
    .from("sales_customers")
    .insert(row)
    .select()
    .single();

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
