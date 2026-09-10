import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const userId = String(getRouterParam(event, "id") || "");
  const body = await readBody(event);
  if (!userId) throw createError({ statusCode: 400, statusMessage: "Customer ID is required." });

  const tags = Array.isArray(body?.tags)
    ? body.tags.map((tag: any) => String(tag).trim()).filter(Boolean).slice(0, 30)
    : String(body?.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 30);

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("customer_profiles")
    .upsert({
      user_id: userId,
      display_name: String(body?.display_name || "").trim().slice(0, 120) || null,
      business_name: String(body?.business_name || "").trim().slice(0, 160) || null,
      phone: String(body?.phone || "").trim().slice(0, 60) || null,
      preferred_contact: ["email","phone"].includes(String(body?.preferred_contact)) ? String(body.preferred_contact) : "email",
      order_updates: body?.order_updates !== false,
      back_in_stock_updates: body?.back_in_stock_updates !== false,
      marketing_updates: body?.marketing_updates === true,
      admin_notes: String(body?.admin_notes || "").trim().slice(0, 10000) || null,
      tags,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
