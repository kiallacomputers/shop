import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      stripe_session_id,
      customer_email,
      customer_name,
      total,
      status,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("ADMIN ORDERS ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load orders.",
    });
  }

  return data ?? [];
});
