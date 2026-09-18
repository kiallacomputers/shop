import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const n = (v: any) => Number(v || 0);
const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const incomeTypes = new Set(["income", "revenue"]);
const expenseTypes = new Set(["expense", "cost_of_sales", "cost of sales", "cogs"]);

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event);
  const now = new Date();
  const defaultFyStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const start = String(q.start || `${defaultFyStart}-07-01`);
  const end = String(q.end || `${defaultFyStart + 1}-06-30`);
  const s = getAdminSupabase();

  const { data, error } = await s
    .from("accounting_journal_lines")
    .select("id,description,debit,credit,accounting_accounts(id,code,name,account_type),accounting_journals!inner(id,journal_date,reference,description,source_type,source_id,status)")
    .eq("accounting_journals.status", "posted")
    .gte("accounting_journals.journal_date", start)
    .lte("accounting_journals.journal_date", end)
    .order("id", { ascending: true });
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const accountMap = new Map<string, any>();
  const transactions: any[] = [];
  let grossIncome = 0;
  let totalExpenses = 0;

  for (const line of data || []) {
    const a: any = (line as any).accounting_accounts;
    const j: any = (line as any).accounting_journals;
    if (!a || !j) continue;
    const type = String(a.account_type || "").toLowerCase();
    const isIncome = incomeTypes.has(type);
    const isExpense = expenseTypes.has(type);
    if (!isIncome && !isExpense) continue;

    const amount = round(isIncome ? n((line as any).credit) - n((line as any).debit) : n((line as any).debit) - n((line as any).credit));
    const key = String(a.id);
    const row = accountMap.get(key) || { id: a.id, code: a.code, name: a.name, account_type: type, amount: 0 };
    row.amount = round(row.amount + amount);
    accountMap.set(key, row);

    if (isIncome) grossIncome = round(grossIncome + amount);
    else totalExpenses = round(totalExpenses + amount);

    transactions.push({
      line_id: (line as any).id,
      journal_id: j.id,
      date: j.journal_date,
      reference: j.reference || "",
      description: (line as any).description || j.description || "",
      journal_description: j.description || "",
      source_type: j.source_type || "",
      source_id: j.source_id || null,
      account_code: a.code,
      account_name: a.name,
      account_type: type,
      category: isIncome ? "Income" : "Expense",
      amount,
    });
  }

  const accounts = [...accountMap.values()].sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const incomeAccounts = accounts.filter((x) => incomeTypes.has(x.account_type));
  const expenseAccounts = accounts.filter((x) => expenseTypes.has(x.account_type));
  transactions.sort((a, b) => String(a.date).localeCompare(String(b.date)) || Number(a.journal_id) - Number(b.journal_id));

  return {
    period: { start, end },
    summary: {
      gross_business_income: round(grossIncome),
      total_business_expenses: round(totalExpenses),
      net_business_income: round(grossIncome - totalExpenses),
    },
    income_accounts: incomeAccounts,
    expense_accounts: expenseAccounts,
    transactions,
    note: "Prepared from posted accounting journals. This is a business income preparation report for record keeping/accountant review and is not an ATO lodgement form.",
  };
});
