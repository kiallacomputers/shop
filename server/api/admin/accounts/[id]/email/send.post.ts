import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { sendCustomerDirectEmail } from "~~/server/utils/customerEmail";

export default defineEventHandler(async (event) => {
  const adminUser = await requireSuperAdmin(event);
  const userId = String(getRouterParam(event, "id") || "").trim();
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "Customer ID is required." });
  }

  const body = await readBody(event);
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();

  if (!subject) throw createError({ statusCode: 400, statusMessage: "Email subject is required." });
  if (!message) throw createError({ statusCode: 400, statusMessage: "Email message is required." });
  if (subject.length > 180) throw createError({ statusCode: 400, statusMessage: "Email subject is too long." });
  if (message.length > 10000) throw createError({ statusCode: 400, statusMessage: "Email message is too long." });

  const supabase = getAdminSupabase();
  const [{ data: authResult, error: authError }, { data: profile }] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase.from("customer_crm_profiles").select("display_name").eq("user_id", userId).maybeSingle(),
  ]);

  if (authError || !authResult?.user) {
    throw createError({ statusCode: 404, statusMessage: authError?.message || "Customer not found." });
  }

  const email = String(authResult.user.email || "").trim();
  if (!email) throw createError({ statusCode: 400, statusMessage: "Customer does not have an email address." });

  const customerName = String(
    profile?.display_name ||
    authResult.user.user_metadata?.display_name ||
    authResult.user.user_metadata?.full_name ||
    authResult.user.user_metadata?.name ||
    "",
  ).trim();

  await sendCustomerDirectEmail({ email, name: customerName, subject, message });

  const sentAt = new Date().toISOString();
  const sentByUserId = String((adminUser as any)?.id || (adminUser as any)?.sub || "") || null;
  const sentByEmail = String((adminUser as any)?.email || "").trim() || null;

  const { data: log, error: logError } = await supabase
    .from("customer_crm_emails")
    .insert({
      customer_user_id: userId,
      recipient_email: email,
      subject,
      message,
      sent_by_user_id: sentByUserId,
      sent_by_email: sentByEmail,
      sent_at: sentAt,
    })
    .select("id,recipient_email,subject,message,sent_by_email,sent_at")
    .single();

  if (logError) {
    // The email has already been sent, so don't report it as unsent if logging fails.
    console.error("CUSTOMER CRM EMAIL LOG ERROR:", logError.message);
    return { sent: true, sent_at: sentAt, warning: "Email sent, but the CRM history could not be recorded." };
  }

  return { sent: true, sent_at: sentAt, email: log };
});
