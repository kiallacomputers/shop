import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { sendQuoteReadyEmail } from "~~/server/utils/quoteEmail";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const userId = String(getRouterParam(event, "id") || "");
  const quoteId = Number(getRouterParam(event, "quoteId"));
  const body = await readBody(event);

  const statuses = ["requested","reviewing","quoted","accepted","declined","closed"];
  const status = String(body?.status || "requested");
  if (!statuses.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid quote status." });
  }

  const supabase = getAdminSupabase();

  // Verify the quote belongs to the selected customer.
  const { data: existing, error: existingError } = await supabase
    .from("customer_quote_requests")
    .select("id,status,customer_message")
    .eq("id", quoteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw createError({ statusCode: 500, statusMessage: existingError.message });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Quote request not found." });

  const incomingItems = Array.isArray(body?.items) ? body.items : [];
  for (const item of incomingItems.slice(0, 100)) {
    const itemId = Number(item?.id);
    const quotedPrice =
      item?.quoted_price === "" || item?.quoted_price == null
        ? null
        : Number(item.quoted_price);

    if (!Number.isInteger(itemId)) continue;
    if (quotedPrice != null && (!Number.isFinite(quotedPrice) || quotedPrice < 0)) {
      throw createError({ statusCode: 400, statusMessage: "Quoted item prices must be valid amounts." });
    }

    const { error } = await supabase
      .from("customer_quote_request_items")
      .update({ quoted_price: quotedPrice })
      .eq("id", itemId)
      .eq("quote_request_id", quoteId);

    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  }

  let quotedTotal =
    body?.quoted_total === "" || body?.quoted_total == null
      ? null
      : Number(body.quoted_total);

  if (quotedTotal != null && (!Number.isFinite(quotedTotal) || quotedTotal < 0)) {
    throw createError({ statusCode: 400, statusMessage: "Quoted total must be a valid amount." });
  }

  // If the admin has entered item-level quote prices, automatically total them
  // when a separate quoted total has not been supplied.
  if (quotedTotal == null && incomingItems.length) {
    const calculated = incomingItems.reduce((sum: number, item: any) => {
      const unit = item?.quoted_price === "" || item?.quoted_price == null
        ? Number(item?.requested_price || 0)
        : Number(item.quoted_price || 0);
      return sum + unit * Math.max(1, Number(item?.quantity || 1));
    }, 0);
    quotedTotal = Math.round(calculated * 100) / 100;
  }

  const { data, error } = await supabase
    .from("customer_quote_requests")
    .update({
      status,
      quoted_total: quotedTotal,
      admin_notes: String(body?.admin_notes || "").trim().slice(0, 10000) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("user_id", userId)
    .select("id,status,quoted_total,admin_notes,updated_at")
    .maybeSingle();

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  if (!data) throw createError({ statusCode: 404, statusMessage: "Quote request not found." });

  // Send the completed quote when it first moves into Quoted status.
  // Saving later admin notes while it remains quoted will not repeatedly email the customer.
  if (status === "quoted" && existing.status !== "quoted") {
    try {
      const [{ data: quoteItems, error: quoteItemsError }, authResult] = await Promise.all([
        supabase
          .from("customer_quote_request_items")
          .select("id,product_name,variant_name,product_code,quantity,requested_price,quoted_price")
          .eq("quote_request_id", quoteId)
          .order("id", { ascending: true }),
        supabase.auth.admin.getUserById(userId),
      ]);
      if (quoteItemsError) throw quoteItemsError;
      if (authResult.error) throw authResult.error;

      const customer = authResult.data.user;
      const customerEmail = String(customer?.email || "").trim();
      if (customerEmail) {
        const requestUrl = getRequestURL(event);
        await sendQuoteReadyEmail({
          id: quoteId,
          customer_email: customerEmail,
          customer_name: String(customer?.user_metadata?.display_name || customer?.user_metadata?.full_name || ""),
          customer_message: existing.customer_message || null,
          quoted_total: quotedTotal,
          items: quoteItems || [],
          accountUrl: `${requestUrl.origin}/account?quote=${quoteId}`,
        });
      }
    } catch (emailError: any) {
      console.error("QUOTE READY EMAIL ERROR:", emailError?.message || emailError);
    }
  }

  return data;
});
