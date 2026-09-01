import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const user: any = await serverSupabaseUser(event);
  if (!user?.id) throw createError({ statusCode: 401, statusMessage: "You must be signed in." });

  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) throw createError({ statusCode: 400, statusMessage: "Invalid address ID." });

  const supabase = getAdminSupabase();
  const userId = String(user.id);

  const { data: existing, error: existingError } = await supabase
    .from("customer_addresses")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw createError({ statusCode: 500, statusMessage: existingError.message });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Address not found." });

  const now = new Date().toISOString();
  const { error: clearError } = await supabase
    .from("customer_addresses")
    .update({ is_primary: false, updated_at: now })
    .eq("user_id", userId)
    .eq("is_primary", true);

  if (clearError) throw createError({ statusCode: 500, statusMessage: clearError.message });

  const { data, error } = await supabase
    .from("customer_addresses")
    .update({ is_primary: true, updated_at: now })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
