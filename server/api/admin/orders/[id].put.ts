import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const allowedStatuses = [
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order ID is required.",
    });
  }

  const body = await readBody(event);

  const status = String(body?.status ?? "")
    .trim()
    .toLowerCase();

  if (!allowedStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid order status.",
    });
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
    })
    .eq("id", id)
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
    .single();

  if (error) {
    console.error("ADMIN UPDATE ORDER ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error.message ||
        "Unable to update order.",
    });
  }

  return data;
});
