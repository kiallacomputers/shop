import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { quoteTotals } from "~~/server/utils/manualQuote";
import { enforceRateLimit } from "~~/server/utils/rateLimit";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    bucket: "public-quote-view",
    max: 60,
    windowSeconds: 15 * 60,
  });

  const token = String(getRouterParam(event, "token") || "").trim();

  if (!UUID_PATTERN.test(token)) {
    throw createError({ statusCode: 404, statusMessage: "Quote not found." });
  }

  const { data, error } = await getAdminSupabase()
    .from("manual_quotes")
    .select(
      "id,quote_number,status,issue_date,expires_at,delivery_method,delivery_amount,discount_amount,customer_notes,customer_responded_at,sales_customers(full_name,company_name),manual_quote_items(product_name,description,sku,quantity,unit_price,discount_percent,sort_order)",
    )
    .eq("public_token", token)
    .maybeSingle();

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: "Quote not found." });
  }

  const items = (data.manual_quote_items || []).sort(
    (a: any, b: any) => Number(a.sort_order) - Number(b.sort_order),
  );

  return {
    ...data,
    manual_quote_items: items,
    totals: quoteTotals({ ...data, manual_quote_items: items }),
  };
});
