import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const n = (v: any) => Number(v || 0);
const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event);
  const now = new Date();
  const start = String(q.start || `${now.getFullYear()}-07-01`);
  const end = String(q.end || now.toISOString().slice(0, 10));
  const s = getAdminSupabase();
  const { data, error } = await s.from("accounting_journal_lines")
    .select("debit,credit,accounting_accounts(id,code,name,account_type),accounting_journals!inner(journal_date,status)")
    .eq("accounting_journals.status", "posted").gte("accounting_journals.journal_date", start).lte("accounting_journals.journal_date", end);
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  const map = new Map<string, any>();
  for (const line of data || []) {
    const a: any = (line as any).accounting_accounts;
    if (!a) continue;
    const type = String(a.account_type || "").toLowerCase();
    if (!["income", "revenue", "expense", "cost_of_sales", "cost of sales", "cogs"].includes(type)) continue;
    const key = String(a.id);
    const row = map.get(key) || { id: a.id, code: a.code, name: a.name, account_type: type, amount: 0 };
    const isIncome = ["income", "revenue"].includes(type);
    row.amount += isIncome ? n((line as any).credit) - n((line as any).debit) : n((line as any).debit) - n((line as any).credit);
    map.set(key, row);
  }
  const rows = [...map.values()].map(x => ({ ...x, amount: money(x.amount) })).sort((a,b)=>String(a.code).localeCompare(String(b.code)));
  const income = money(rows.filter(x => ["income","revenue"].includes(x.account_type)).reduce((a,x)=>a+x.amount,0));
  const expenses = money(rows.filter(x => !["income","revenue"].includes(x.account_type)).reduce((a,x)=>a+x.amount,0));
  return { period: { start, end }, summary: { income, expenses, net_profit: money(income - expenses) }, rows };
});
