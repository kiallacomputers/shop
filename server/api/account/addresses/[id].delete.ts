import { requireRequestUser } from "~~/server/utils/requestUser";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);

  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) throw createError({ statusCode: 400, statusMessage: "Invalid address ID." });

  const supabase = getAdminSupabase();
  const userId = String(user.id);

  const { data: existing, error: existingError } = await supabase
    .from("customer_addresses")
    .select("id, is_primary")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw createError({ statusCode: 500, statusMessage: existingError.message });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Address not found." });

  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  if (existing.is_primary) {
    const { data: replacement, error: replacementError } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (replacementError) throw createError({ statusCode: 500, statusMessage: replacementError.message });

    if (replacement?.id) {
      const { error: promoteError } = await supabase
        .from("customer_addresses")
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq("id", replacement.id)
        .eq("user_id", userId);
      if (promoteError) throw createError({ statusCode: 500, statusMessage: promoteError.message });
    }
  }

  return { success: true };
});
