import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const s = getAdminSupabase();
  const { data, error } = await s
    .from("accounting_bank_accounts")
    .select("id,name,bsb,account_number,accounting_account_id,accounting_accounts(id,code,name)")
    .order("name");
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return {
    bank_accounts: data || [],
    payment_methods: [
      { value: "bank_transfer", label: "Bank Transfer / EFT" },
      { value: "credit_card", label: "Credit Card" },
      { value: "debit_card", label: "Debit Card" },
      { value: "cash", label: "Cash" },
      { value: "other", label: "Other" },
    ],
  };
});
