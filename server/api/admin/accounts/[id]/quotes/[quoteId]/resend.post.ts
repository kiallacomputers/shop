import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { sendQuoteReadyEmail } from "~~/server/utils/quoteEmail";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const userId = String(getRouterParam(event, "id") || "");
  const quoteId = Number(getRouterParam(event, "quoteId"));
  const supabase = getAdminSupabase();
  const [{ data: quote, error }, auth] = await Promise.all([
    supabase.from("customer_quote_requests").select(`id,quote_number,user_id,status,customer_message,quoted_total,expires_at,created_at,customer_quote_request_items(id,product_name,variant_name,product_code,quantity,requested_price,quoted_price)`).eq("id",quoteId).eq("user_id",userId).maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ]);
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  if (!quote) throw createError({ statusCode: 404, statusMessage: "Quote not found." });
  if (quote.status !== "quoted") throw createError({ statusCode: 400, statusMessage: "Only quotes in Quoted status can be resent." });
  if (quote.expires_at && new Date(quote.expires_at).getTime() < Date.now()) {
    throw createError({ statusCode: 400, statusMessage: "This quote has expired. Extend the Valid Until date and save it before resending." });
  }
  const user = auth.data?.user;
  const email = String(user?.email || "").trim();
  if (!email) throw createError({ statusCode: 400, statusMessage: "Customer does not have an email address." });
  const requestUrl = getRequestURL(event);
  await sendQuoteReadyEmail({ ...quote, customer_email:email, customer_name:String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || ""), items:quote.customer_quote_request_items || [], accountUrl:`${requestUrl.origin}/account?quote=${quoteId}` });
  const sentAt = new Date().toISOString();
  const { error:updateError } = await supabase.from("customer_quote_requests").update({ sent_at:sentAt, updated_at:sentAt }).eq("id",quoteId);
  if (updateError) throw createError({ statusCode: 500, statusMessage:updateError.message });
  return { sent:true, sent_at:sentAt };
});
