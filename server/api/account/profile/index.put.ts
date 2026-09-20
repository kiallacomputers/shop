import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";

export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event);
  const body = await readBody(event);
  const preferred = String(body?.preferred_contact || "email").toLowerCase();

  if (!["email", "phone"].includes(preferred)) {
    throw createError({ statusCode: 400, statusMessage: "Preferred contact must be email or phone." });
  }

  const payload = {
    user_id: user.id,
    display_name: String(body?.display_name || "").trim().slice(0, 120) || null,
    business_name: String(body?.business_name || "").trim().slice(0, 160) || null,
    phone: String(body?.phone || "").trim().slice(0, 60) || null,
    preferred_contact: preferred,
    order_updates: body?.order_updates !== false,
    back_in_stock_updates: body?.back_in_stock_updates !== false,
    marketing_updates: body?.marketing_updates === true,
    updated_at: new Date().toISOString(),
  };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("customer_crm_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("display_name,business_name,phone,preferred_contact,order_updates,back_in_stock_updates,marketing_updates")
    .single();

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata || {}),
      display_name: payload.display_name || undefined,
      full_name: payload.display_name || undefined,
      business_name: payload.business_name || undefined,
      phone: payload.phone || undefined,
    },
  });

  return data;
});
