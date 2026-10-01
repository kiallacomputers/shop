import { getAdminSupabase } from "~~/server/utils/adminAuth";

export const DEFAULT_PROCESSING_FEE = 2;

export async function getProcessingFeeForUser(userId: string): Promise<{ enabled: boolean; amount: number }> {
  const id = String(userId || "").trim();
  if (!id) return { enabled: true, amount: DEFAULT_PROCESSING_FEE };

  const { data, error } = await getAdminSupabase()
    .from("sales_customers")
    .select("processing_fee_enabled")
    .eq("auth_user_id", id)
    .maybeSingle();

  // Safe default: customers are charged the normal fee unless an administrator
  // has explicitly disabled it on their linked customer profile.
  if (error || !data) return { enabled: true, amount: DEFAULT_PROCESSING_FEE };
  const enabled = data.processing_fee_enabled !== false;
  return { enabled, amount: enabled ? DEFAULT_PROCESSING_FEE : 0 };
}
