import { getAdminSupabase } from "~~/server/utils/adminAuth";

export async function assertAccountingDateOpen(dateValue?: string) {
  const date = String(dateValue || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const s = getAdminSupabase();
  const { data, error } = await s
    .from("accounting_periods")
    .select("id,name,start_date,end_date,status")
    .lte("start_date", date)
    .gte("end_date", date)
    .eq("status", "closed")
    .limit(1);
  if (error) {
    // 42P01/PGRST205 means the migration has not been installed yet. Do not break
    // existing accounting until the user installs the period-lock migration.
    if ((error as any).code === "42P01" || (error as any).code === "PGRST205") return;
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  if (data?.length) {
    const p: any = data[0];
    throw createError({
      statusCode: 423,
      statusMessage: `Accounting period '${p.name}' is closed. Transactions dated ${date} cannot be posted until the period is reopened.`,
    });
  }
}
