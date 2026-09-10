import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { createQuotePdf, getQuoteFilename } from "~~/server/utils/quotePdf";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const quoteId = Number(getRouterParam(event, "quoteId"));
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid quote ID." });
  }
  const supabase = getAdminSupabase();
  const { data: quote, error } = await supabase
    .from("customer_quote_requests")
    .select(`id,quote_number,user_id,status,customer_message,quoted_total,expires_at,created_at,customer_quote_request_items(product_name,variant_name,product_code,quantity,requested_price,quoted_price)`)
    .eq("id", quoteId).maybeSingle();
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  if (!quote) throw createError({ statusCode: 404, statusMessage: "Quote not found." });
  const auth = await supabase.auth.admin.getUserById(String(quote.user_id));
  const user = auth.data?.user;
  const pdf = createQuotePdf({ ...quote, customer_name:String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || ""), customer_email:String(user?.email || ""), items:quote.customer_quote_request_items || [] });
  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `attachment; filename="${getQuoteFilename(quote)}"`);
  return pdf;
});
