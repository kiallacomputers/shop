import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { requireObjectBody, rejectOversizedContentLength } from "~~/server/utils/inputValidation";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  rejectOversizedContentLength(event, 8 * 1024);
  const body = requireObjectBody(await readBody(event));
  const authUserId = String(body.auth_user_id || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authUserId)) {
    throw createError({ statusCode: 400, statusMessage: "A valid login account is required." });
  }

  const s = getAdminSupabase();
  const { data: authData, error: authError } = await s.auth.admin.getUserById(authUserId);
  const user = authData?.user;
  if (authError || !user) throw createError({ statusCode: 404, statusMessage: "Login account was not found." });

  const { data: already } = await s.from("sales_customers").select("*").eq("auth_user_id", authUserId).maybeSingle();
  if (already) return already;

  const email = String(user.email || "").trim();
  if (!email) throw createError({ statusCode: 400, statusMessage: "This login account does not have an email address." });

  const { data: emailMatches, error: matchError } = await s.from("sales_customers").select("id,full_name,auth_user_id").ilike("email", email);
  if (matchError) throw createError({ statusCode: 500, statusMessage: matchError.message });
  if ((emailMatches || []).length > 1) {
    throw createError({ statusCode: 409, statusMessage: "More than one customer uses this email. Link the correct customer manually." });
  }

  if (emailMatches?.length === 1) {
    const match: any = emailMatches[0];
    if (match.auth_user_id && match.auth_user_id !== authUserId) {
      throw createError({ statusCode: 409, statusMessage: "The matching customer is already linked to another login." });
    }
    const { data, error } = await s.from("sales_customers")
      .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
      .eq("id", match.id).select().single();
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    return data;
  }

  const fullName = String(user.user_metadata?.display_name || user.user_metadata?.full_name || email.split("@")[0] || "Customer").trim();
  const { data, error } = await s.from("sales_customers").insert({
    customer_type: "individual",
    pricing_level_key: "standard",
    full_name: fullName,
    email,
    auth_user_id: authUserId,
    processing_fee_enabled: true,
  }).select().single();
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
