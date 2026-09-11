import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid notification." });
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("customer_back_in_stock_notifications")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "waiting");
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { ok: true };
});
