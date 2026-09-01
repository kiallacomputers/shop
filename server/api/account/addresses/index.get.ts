import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const user: any = await serverSupabaseUser(event);

  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: "You must be signed in." });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("id, label, full_name, address_line_1, address_line_2, suburb, state, postcode, country, phone, is_primary, created_at, updated_at")
    .eq("user_id", String(user.id))
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data || [];
});
