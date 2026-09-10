import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("customer_profiles")
    .select("display_name,business_name,phone,preferred_contact,order_updates,back_in_stock_updates,marketing_updates")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  return data || {
    display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || "",
    business_name: "",
    phone: "",
    preferred_contact: "email",
    order_updates: true,
    back_in_stock_updates: true,
    marketing_updates: false,
  };
});
