import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);

  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid bank account." });
  }

  const body = await readBody(event);
  const currentBalance = Number(body?.current_balance);

  if (!Number.isFinite(currentBalance)) {
    throw createError({ statusCode: 400, statusMessage: "Enter a valid current bank balance." });
  }

  const asAt = body?.current_balance_as_at
    ? new Date(body.current_balance_as_at)
    : new Date();

  if (Number.isNaN(asAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: "Enter a valid balance date and time." });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("accounting_bank_accounts")
    .update({
      current_balance: Math.round(currentBalance * 100) / 100,
      current_balance_as_at: asAt.toISOString(),
    })
    .eq("id", id)
    .select("*,accounting_accounts(id,code,name)")
    .single();

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  return data;
});
