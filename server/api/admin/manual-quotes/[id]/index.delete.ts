import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = String(getRouterParam(event, "id") || "").trim();
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Quote ID is required." });
  }

  const supabase = getAdminSupabase();

  // Delete child line items explicitly so this works even without a
  // database ON DELETE CASCADE constraint.
  const items = await supabase
    .from("manual_quote_items")
    .delete()
    .eq("quote_id", id);

  if (items.error) {
    throw createError({ statusCode: 500, statusMessage: items.error.message });
  }

  const quote = await supabase
    .from("manual_quotes")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (quote.error) {
    throw createError({ statusCode: 500, statusMessage: quote.error.message });
  }

  if (!quote.data) {
    throw createError({ statusCode: 404, statusMessage: "Manual quote not found." });
  }

  return { success: true, id: quote.data.id };
});
