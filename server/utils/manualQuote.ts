import { getAdminSupabase } from "~~/server/utils/adminAuth";

export const quoteTotals = (quote:any) => {
  const items = quote.manual_quote_items || quote.items || [];
  const itemsTotal = items.reduce((sum:number, i:any) => {
    const gross = Number(i.quantity || 0) * Number(i.unit_price || 0);
    return sum + gross * (1 - Number(i.discount_percent || 0) / 100);
  }, 0);
  const total = Math.max(0, itemsTotal + Number(quote.delivery_amount || 0) - Number(quote.discount_amount || 0));
  return { itemsTotal, total, gst: total / 11, exGst: total - total / 11 };
};

export async function loadManualQuote(id:string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("manual_quotes")
    .select("*,sales_customers(*),manual_quote_items(*)")
    .eq("id", id).maybeSingle();
  if (error) throw createError({ statusCode:500, statusMessage:error.message });
  if (!data) throw createError({ statusCode:404, statusMessage:"Quote not found." });
  data.manual_quote_items = (data.manual_quote_items || []).sort((a:any,b:any)=>Number(a.sort_order)-Number(b.sort_order));
  return { ...data, totals: quoteTotals(data) };
}
