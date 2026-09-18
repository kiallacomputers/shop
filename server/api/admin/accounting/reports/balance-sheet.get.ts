import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const n = (v: any) => Number(v || 0);
const r2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event);
  const asOf = String(q.as_of || new Date().toISOString().slice(0, 10));
  const s = getAdminSupabase();

  const { data, error } = await s.from("accounting_journal_lines")
    .select("debit,credit,accounting_accounts(id,code,name,account_type),accounting_journals!inner(id,journal_date,status,reference,description)")
    .eq("accounting_journals.status", "posted")
    .lte("accounting_journals.journal_date", asOf);
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const map = new Map<string, any>();
  let currentEarnings = 0;
  for (const line of data || []) {
    const a: any = (line as any).accounting_accounts;
    if (!a) continue;
    const type = String(a.account_type || "").toLowerCase();
    const debit = n((line as any).debit), credit = n((line as any).credit);
    if (["revenue", "income"].includes(type)) currentEarnings += credit - debit;
    if (["expense", "cost_of_sales", "cost of sales", "cogs"].includes(type)) currentEarnings -= debit - credit;
    if (!["asset", "liability", "equity"].includes(type)) continue;
    const key = String(a.id);
    const row = map.get(key) || { id: a.id, code: a.code, name: a.name, account_type: type, debit: 0, credit: 0 };
    row.debit += debit; row.credit += credit; map.set(key, row);
  }

  const rows = [...map.values()].map((x) => ({
    ...x,
    balance: r2(x.account_type === "asset" ? x.debit - x.credit : x.credit - x.debit),
  })).sort((a,b) => String(a.code).localeCompare(String(b.code)));
  const assets = rows.filter(x => x.account_type === "asset");
  const liabilities = rows.filter(x => x.account_type === "liability");
  const equity = rows.filter(x => x.account_type === "equity");
  const totalAssets = r2(assets.reduce((s,x)=>s+x.balance,0));
  const totalLiabilities = r2(liabilities.reduce((s,x)=>s+x.balance,0));
  const postedEquity = r2(equity.reduce((s,x)=>s+x.balance,0));
  currentEarnings = r2(currentEarnings);
  const totalEquity = r2(postedEquity + currentEarnings);
  const difference = r2(totalAssets - totalLiabilities - totalEquity);

  return { as_of: asOf, assets, liabilities, equity, current_earnings: currentEarnings,
    summary: { total_assets: totalAssets, total_liabilities: totalLiabilities, posted_equity: postedEquity, total_equity: totalEquity, liabilities_and_equity: r2(totalLiabilities + totalEquity), difference, balanced: Math.abs(difference) < 0.01 } };
});
