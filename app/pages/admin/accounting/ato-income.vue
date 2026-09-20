<template>
  <main class="admin-content">
    <div class="no-print mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-wider text-blue-600">Accounting</p>
        <h1 class="text-3xl font-black">ATO Income Report</h1>
        <p class="text-slate-500">Business income and expense preparation report for your records or accountant.</p>
      </div>
      <NuxtLink class="btn-secondary" to="/admin/accounting">← Accounting</NuxtLink>
    </div>

    <section class="no-print admin-panel p-4">
      <div class="flex flex-wrap items-end gap-3">
        <label><span>Financial Year</span><select v-model="selectedFy" @change="applyFinancialYear"><option value="custom">Custom</option><option v-for="fy in financialYears" :key="fy.value" :value="fy.value">{{ fy.label }}</option></select></label>
        <label><span>From</span><input v-model="start" type="date" @change="selectedFy='custom'" /></label>
        <label><span>To</span><input v-model="end" type="date" @change="selectedFy='custom'" /></label>
        <button class="btn-primary" @click="load">Run Report</button>
        <button class="btn-secondary" :disabled="!report" @click="printReport">🖨️ Print / Save PDF</button>
      </div>
    </section>

    <div v-if="err" class="no-print mt-4 rounded-xl bg-red-50 p-4 text-red-700">{{ err }}</div>

    <div v-if="report" class="report-wrap mt-5">
      <header class="report-header">
        <div><p class="eyebrow">Kialla Computers</p><h2>ATO Income Preparation Report</h2><p>{{ dateLabel(report.period.start) }} to {{ dateLabel(report.period.end) }}</p></div>
        <div class="report-badge">AUD</div>
      </header>

      <div class="notice">{{ report.note }}</div>

      <section class="summary-grid">
        <div class="summary-card income"><small>Gross Business Income</small><strong>{{ money(report.summary.gross_business_income) }}</strong></div>
        <div class="summary-card expense"><small>Business Expenses</small><strong>{{ money(report.summary.total_business_expenses) }}</strong></div>
        <div class="summary-card net"><small>Net Business Income</small><strong>{{ money(report.summary.net_business_income) }}</strong></div>
      </section>

      <section class="admin-panel mt-5 p-5">
        <h3 class="text-xl font-black">Income Breakdown</h3>
        <div class="mt-3 overflow-x-auto"><table><thead><tr><th>Code</th><th>Income Account</th><th class="right">Amount</th></tr></thead><tbody><tr v-for="r in report.income_accounts" :key="r.id"><td class="mono">{{ r.code }}</td><td>{{ r.name }}</td><td class="right strong">{{ money(r.amount) }}</td></tr><tr v-if="!report.income_accounts.length"><td colspan="3" class="empty">No posted income for this period.</td></tr><tr class="total-row"><td colspan="2">Total Business Income</td><td class="right">{{ money(report.summary.gross_business_income) }}</td></tr></tbody></table></div>
      </section>

      <section class="admin-panel mt-5 p-5">
        <h3 class="text-xl font-black">Expense Breakdown</h3>
        <div class="mt-3 overflow-x-auto"><table><thead><tr><th>Code</th><th>Expense Account</th><th class="right">Amount</th></tr></thead><tbody><tr v-for="r in report.expense_accounts" :key="r.id"><td class="mono">{{ r.code }}</td><td>{{ r.name }}</td><td class="right strong">{{ money(r.amount) }}</td></tr><tr v-if="!report.expense_accounts.length"><td colspan="3" class="empty">No posted expenses for this period.</td></tr><tr class="total-row"><td colspan="2">Total Business Expenses</td><td class="right">{{ money(report.summary.total_business_expenses) }}</td></tr></tbody></table></div>
      </section>

      <section class="admin-panel mt-5 p-5">
        <div class="flex flex-wrap items-center justify-between gap-3"><div><h3 class="text-xl font-black">Transaction Audit Schedule</h3><p class="text-sm text-slate-500">Posted journal lines included in the report.</p></div><span class="count-pill">{{ report.transactions.length }} transactions</span></div>
        <div class="mt-3 overflow-x-auto"><table><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th>Account</th><th>Type</th><th class="right">Amount</th></tr></thead><tbody><tr v-for="r in report.transactions" :key="r.line_id"><td>{{ dateLabel(r.date) }}</td><td>{{ r.reference || '—' }}</td><td>{{ r.description || r.journal_description || '—' }}</td><td><span class="mono">{{ r.account_code }}</span> · {{ r.account_name }}</td><td>{{ r.category }}</td><td class="right strong">{{ money(r.amount) }}</td></tr><tr v-if="!report.transactions.length"><td colspan="6" class="empty">No reportable posted transactions for this period.</td></tr></tbody></table></div>
      </section>

      <footer class="print-footer">Generated {{ generatedLabel }} · Kialla Computers · Accounting records</footer>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });
const { adminFetch, isSuperAdmin } = useAdminFetch();
const now = new Date();
const currentFyStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const start = ref(`${currentFyStart}-07-01`), end = ref(`${currentFyStart+1}-06-30`), selectedFy = ref(String(currentFyStart));
const report = ref<any>(null), err = ref('');
const financialYears = computed(() => Array.from({length: 7}, (_,i) => currentFyStart + 2 - i).map(y => ({ value:String(y), label:`${y}–${String(y+1).slice(-2)}` })));
const money = (v:any) => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0));
const dateLabel = (v:string) => v ? new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T00:00:00`)) : '';
const generatedLabel = computed(() => new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short'}).format(new Date()));
function applyFinancialYear(){ if(selectedFy.value==='custom') return; const y=Number(selectedFy.value); start.value=`${y}-07-01`; end.value=`${y+1}-06-30`; load(); }
async function load(){ err.value=''; try { if(!isSuperAdmin.value) return navigateTo('/admin'); report.value=await adminFetch(`/api/admin/accounting/reports/ato-income?start=${start.value}&end=${end.value}`); } catch(e:any){ err.value=e?.data?.statusMessage||e.message; } }
function printReport(){ if(import.meta.client) window.print(); }
onMounted(load);
</script>

<style scoped>
.admin-panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.btn-primary{@apply rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50}label span{@apply mb-1 block text-xs font-bold text-slate-500}input,select{@apply rounded-lg border border-slate-300 bg-white px-3 py-2}.report-header{@apply flex items-start justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white}.report-header h2{@apply text-2xl font-black}.report-header p{@apply mt-1 text-sm text-slate-300}.eyebrow{@apply text-xs font-black uppercase tracking-widest text-blue-300}.report-badge{@apply rounded-xl bg-white/10 px-4 py-2 text-sm font-black}.notice{@apply mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900}.summary-grid{@apply mt-5 grid gap-4 md:grid-cols-3}.summary-card{@apply rounded-2xl border bg-white p-5 shadow-sm}.summary-card small{@apply block text-xs font-black uppercase tracking-wide text-slate-500}.summary-card strong{@apply mt-2 block text-3xl font-black}.summary-card.income{@apply border-emerald-200}.summary-card.expense{@apply border-rose-200}.summary-card.net{@apply border-blue-200}table{@apply w-full text-sm}th{@apply border-b bg-slate-50 p-2 text-left text-xs font-black uppercase tracking-wide text-slate-500}td{@apply border-b p-2}.right{@apply text-right}.strong{@apply font-bold}.mono{@apply font-mono}.empty{@apply p-6 text-center text-slate-500}.total-row td{@apply border-t-2 border-slate-300 bg-slate-50 font-black}.count-pill{@apply rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600}.print-footer{@apply mt-5 border-t border-slate-200 pt-3 text-center text-xs text-slate-400}
@media print{.no-print{display:none!important}.admin-content{padding:0!important}.report-wrap{margin:0!important}.report-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}.admin-panel,.summary-card{box-shadow:none!important;break-inside:avoid}.notice{-webkit-print-color-adjust:exact;print-color-adjust:exact}table{font-size:9pt}th,td{padding:5px!important}.print-footer{display:block} @page{size:A4 landscape;margin:10mm}}
</style>
