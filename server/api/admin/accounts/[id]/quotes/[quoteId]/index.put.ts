import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { sendQuoteReadyEmail } from "~~/server/utils/quoteEmail";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const userId = String(getRouterParam(event, "id") || "");
  const quoteId = Number(getRouterParam(event, "quoteId"));
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid quote ID." });
  }
  const body = await readBody(event);
  const statuses = ["requested","reviewing","quoted","accepted","declined","closed"];
  const status = String(body?.status || "requested");
  if (!statuses.includes(status)) throw createError({ statusCode: 400, statusMessage: "Invalid quote status." });
  const supabase = getAdminSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("customer_quote_requests")
    .select("id,quote_number,status,customer_message,created_at,expires_at")
    .eq("id", quoteId).eq("user_id", userId).maybeSingle();
  if (existingError) throw createError({ statusCode: 500, statusMessage: existingError.message });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Quote request not found." });

  const incomingItems = Array.isArray(body?.items) ? body.items : [];
  for (const item of incomingItems.slice(0, 100)) {
    const itemId = Number(item?.id);
    const quotedPrice = item?.quoted_price === "" || item?.quoted_price == null ? null : Number(item.quoted_price);
    if (!Number.isInteger(itemId)) continue;
    if (quotedPrice != null && (!Number.isFinite(quotedPrice) || quotedPrice < 0)) throw createError({ statusCode: 400, statusMessage: "Quoted item prices must be valid amounts." });
    const { error } = await supabase.from("customer_quote_request_items").update({ quoted_price: quotedPrice }).eq("id", itemId).eq("quote_request_id", quoteId);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  }

  let quotedTotal = body?.quoted_total === "" || body?.quoted_total == null ? null : Number(body.quoted_total);
  if (quotedTotal != null && (!Number.isFinite(quotedTotal) || quotedTotal < 0)) throw createError({ statusCode: 400, statusMessage: "Quoted total must be a valid amount." });
  if (quotedTotal == null && incomingItems.length) {
    quotedTotal = Math.round(incomingItems.reduce((sum:number,item:any)=>sum + Number(item?.quoted_price === "" || item?.quoted_price == null ? item?.requested_price || 0 : item.quoted_price || 0) * Math.max(1, Number(item?.quantity || 1)),0)*100)/100;
  }

  let expiresAt:string|null = null;
  if (body?.expires_at) {
    const parsed = new Date(String(body.expires_at));
    if (Number.isNaN(parsed.getTime())) throw createError({ statusCode: 400, statusMessage: "Invalid quote expiry date." });
    expiresAt = parsed.toISOString();
  } else if (status === "quoted") {
    const issued = existing.created_at ? new Date(existing.created_at) : new Date();
    const d = new Date(issued);
    d.setDate(d.getDate() + 7);
    // Keep the quote valid through the end of the seventh calendar day.
    d.setHours(23, 59, 59, 999);
    expiresAt = d.toISOString();
  }

  const movingToQuoted = status === "quoted" && existing.status !== "quoted";
  const now = new Date().toISOString();
  const update:any = {
    status, quoted_total: quotedTotal,
    admin_notes: String(body?.admin_notes || "").trim().slice(0,10000) || null,
    expires_at: expiresAt ?? existing.expires_at ?? null,
    updated_at: now,
  };
  if (movingToQuoted) update.quoted_at = now;

  const { data, error } = await supabase.from("customer_quote_requests").update(update).eq("id", quoteId).eq("user_id", userId)
    .select("id,quote_number,status,quoted_total,admin_notes,expires_at,quoted_at,sent_at,updated_at").maybeSingle();
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  if (!data) throw createError({ statusCode: 404, statusMessage: "Quote request not found." });

  if (movingToQuoted) {
    try {
      const [{ data: quoteItems, error: quoteItemsError }, authResult] = await Promise.all([
        supabase.from("customer_quote_request_items").select("id,product_name,variant_name,product_code,quantity,requested_price,quoted_price").eq("quote_request_id", quoteId).order("id", { ascending: true }),
        supabase.auth.admin.getUserById(userId),
      ]);
      if (quoteItemsError) throw quoteItemsError;
      if (authResult.error) throw authResult.error;
      const customer = authResult.data.user;
      const customerEmail = String(customer?.email || "").trim();
      if (customerEmail) {
        const requestUrl = getRequestURL(event);
        await sendQuoteReadyEmail({ id:quoteId, quote_number:existing.quote_number, created_at:existing.created_at, expires_at:data.expires_at, customer_email:customerEmail, customer_name:String(customer?.user_metadata?.display_name || customer?.user_metadata?.full_name || ""), customer_message:existing.customer_message || null, quoted_total:quotedTotal, items:quoteItems || [], accountUrl:`${requestUrl.origin}/account?quote=${quoteId}` });
        const sentAt = new Date().toISOString();
        await supabase.from("customer_quote_requests").update({ sent_at: sentAt }).eq("id", quoteId);
        data.sent_at = sentAt;
      }
    } catch (emailError:any) { console.error("QUOTE READY EMAIL ERROR:", emailError?.message || emailError); }
  }
  return data;
});
