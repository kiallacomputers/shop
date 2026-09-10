import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("customer_quote_requests")
    .select(`id,status,customer_message,quoted_total,created_at,updated_at,customer_quote_request_items(id,product_id,variant_id,product_name,variant_name,product_code,quantity,requested_price,quoted_price)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data || [];
});
