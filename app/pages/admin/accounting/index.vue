<template>
  <main class="admin-content">
    <div class="mb-6">
      <p class="text-xs font-black uppercase tracking-wider text-blue-600">SuperAdmin</p>
      <h1 class="text-3xl font-black">Accounting</h1>
      <p class="text-slate-500">Double-entry accounting foundation for Kialla Computers.</p>
    </div>

    <div v-if="err" class="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{{ err }}</div>

    <section class="admin-panel p-5">
      <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-xl font-black">Business Snapshot</h2><p class="text-sm text-slate-500">Current financial position and {{ fyLabel }} performance.</p></div><button class="btn-secondary" @click="load">Refresh</button></div>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <NuxtLink to="/admin/accounting/receivables" class="metric"><small>Customers Owe</small><b>{{ money(dash.summary?.receivables) }}</b><span v-if="dash.summary?.overdue_receivables" class="text-red-600">{{ money(dash.summary.overdue_receivables) }} overdue</span></NuxtLink>
        <NuxtLink to="/admin/accounting/payables" class="metric"><small>Bills Owing</small><b>{{ money(dash.summary?.payables) }}</b><span v-if="dash.summary?.overdue_payables" class="text-red-600">{{ money(dash.summary.overdue_payables) }} overdue</span></NuxtLink>
        <NuxtLink to="/admin/accounting/inventory" class="metric"><small>Inventory Value</small><b>{{ money(dash.summary?.inventory_value) }}</b><span>At current buy cost</span></NuxtLink>
        <div class="metric"><small>This Month Income</small><b>{{ money(dash.summary?.month_income) }}</b><span>Posted journals</span></div>
        <div class="metric"><small>This Month Expenses</small><b>{{ money(dash.summary?.month_expenses) }}</b><span>Including COGS</span></div>
        <div class="metric"><small>This Month Profit</small><b :class="Number(dash.summary?.month_profit)<0?'text-red-600':'text-emerald-700'">{{ money(dash.summary?.month_profit) }}</b><span>Income less expenses</span></div>
        <NuxtLink to="/admin/accounting/bank-reconciliation" class="metric"><small>Bank To Reconcile</small><b>{{ dash.summary?.unreconciled_bank || 0 }}</b><span>Statement transactions</span></NuxtLink>
      </div>
      <div class="mt-5 grid gap-5 xl:grid-cols-3">
        <div class="rounded-xl border border-slate-200 p-4 xl:col-span-2"><div class="flex justify-between gap-3"><div><h3 class="font-black">Financial Year Performance</h3><p class="text-xs text-slate-500">Income, expenses and profit by month.</p></div><div class="text-right"><small class="text-slate-500">FY Profit</small><div class="font-black" :class="Number(dash.summary?.fy_profit)<0?'text-red-600':'text-emerald-700'">{{ money(dash.summary?.fy_profit) }}</div></div></div><div class="mt-5 flex h-48 items-end gap-2"><div v-for="m in dash.monthly || []" :key="m.month" class="flex min-w-0 flex-1 flex-col items-center gap-1"><div class="flex h-36 w-full items-end justify-center gap-1"><div class="w-2/5 rounded-t bg-emerald-300" :style="{height: barHeight(m.income)}" :title="`Income ${money(m.income)}`"></div><div class="w-2/5 rounded-t bg-slate-300" :style="{height: barHeight(m.expenses)}" :title="`Expenses ${money(m.expenses)}`"></div></div><span class="text-[10px] font-bold text-slate-500">{{ monthLabel(m.month) }}</span></div><div v-if="!(dash.monthly||[]).length" class="m-auto text-sm text-slate-400">No posted FY activity yet.</div></div><div class="mt-3 flex gap-4 text-xs"><span>🟩 Income {{ money(dash.summary?.fy_income) }}</span><span>⬜ Expenses {{ money(dash.summary?.fy_expenses) }}</span></div></div>
        <div class="rounded-xl border border-slate-200 p-4"><h3 class="font-black">Needs Attention</h3><div class="mt-3 space-y-2"><NuxtLink v-for="x in attention" :key="x.label" :to="x.to" class="flex justify-between rounded-lg bg-slate-50 p-3 text-sm hover:bg-slate-100"><span>{{x.label}}</span><b :class="x.alert?'text-red-600':''">{{x.value}}</b></NuxtLink><div v-if="!attention.length" class="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Nothing requiring attention.</div></div></div>
      </div>
      <div class="mt-5 grid gap-5 lg:grid-cols-2"><div class="rounded-xl border border-slate-200 p-4"><h3 class="font-black">Overdue Customer Invoices</h3><div v-for="x in dash.overdue_invoices || []" :key="x.id" class="mt-2 flex items-center justify-between gap-3 border-t pt-2 text-sm"><div><b>{{x.number}}</b><div class="text-xs text-slate-500">{{x.customer}} · {{date(x.due_date)}}</div></div><b class="text-red-600">{{money(x.balance)}}</b></div><p v-if="!(dash.overdue_invoices||[]).length" class="mt-3 text-sm text-slate-500">No overdue customer invoices.</p></div><div class="rounded-xl border border-slate-200 p-4"><h3 class="font-black">Overdue Supplier Bills</h3><div v-for="x in dash.overdue_bills || []" :key="x.id" class="mt-2 flex items-center justify-between gap-3 border-t pt-2 text-sm"><div><b>{{x.number}}</b><div class="text-xs text-slate-500">{{x.supplier}} · {{date(x.due_date)}}</div></div><b class="text-red-600">{{money(x.balance)}}</b></div><p v-if="!(dash.overdue_bills||[]).length" class="mt-3 text-sm text-slate-500">No overdue supplier bills.</p></div></div>
    </section>

    <div class="mt-5 grid gap-4 md:grid-cols-4">
      <div class="admin-panel p-5"><small>Accounts</small><div class="text-3xl font-black">{{ accounts.length }}</div></div>
      <div class="admin-panel p-5"><small>Posted Journals</small><div class="text-3xl font-black">{{ journals.length }}</div></div>
      <div class="admin-panel p-5"><small>Total Debits</small><div class="text-2xl font-black">{{ money(totalDebits) }}</div></div>
      <div class="admin-panel p-5"><small>Total Credits</small><div class="text-2xl font-black">{{ money(totalCredits) }}</div></div>
    </div>

    <section class="admin-panel mt-5 p-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black">Accounting Tools</h2>
          <p class="text-sm text-slate-500">Tools are grouped by purpose. Open a section to choose an accounting area.</p>
        </div>
      </div>

      <div class="mt-5 space-y-3">
        <section v-for="group in accountingToolGroups" :key="group.id" class="tool-group">
          <button class="tool-group-button" type="button" :aria-expanded="openToolGroup === group.id" @click="toggleToolGroup(group.id)">
            <span class="flex min-w-0 items-center gap-3">
              <span class="group-icon" aria-hidden="true">{{ group.icon }}</span>
              <span class="min-w-0 text-left">
                <span class="block font-black text-slate-800">{{ group.label }}</span>
                <span class="block text-xs font-medium text-slate-500">{{ group.description }}</span>
              </span>
            </span>
            <span class="chevron" :class="{ 'chevron-open': openToolGroup === group.id }" aria-hidden="true">⌄</span>
          </button>

          <div v-show="openToolGroup === group.id" class="border-t border-slate-200 bg-slate-50/60 p-4">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              <NuxtLink v-for="tool in group.tools" :key="tool.to" class="tool-tile" :class="tool.color" :to="tool.to" :title="tool.label">
                <span class="icon-shell" aria-hidden="true">{{ tool.icon }}</span>
                <span class="tool-label">{{ tool.label }}</span>
              </NuxtLink>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="admin-panel mt-5 p-5">
      <div class="flex justify-between gap-4">
        <div>
          <h2 class="text-xl font-black">Trial Balance</h2>
          <p class="text-sm text-slate-500">Posted journal activity by account.</p>
        </div>
        <button class="btn-secondary" @click="load">Refresh</button>
      </div>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b text-left"><th class="p-2">Code</th><th>Account</th><th>Type</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead>
          <tbody><tr v-for="a in trial" :key="a.id" class="border-b"><td class="p-2 font-mono">{{ a.code }}</td><td>{{ a.name }}</td><td class="capitalize">{{ a.account_type }}</td><td class="text-right">{{ money(a.debit) }}</td><td class="text-right">{{ money(a.credit) }}</td></tr></tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["admin"] });
const { adminFetch, isSuperAdmin } = useAdminFetch();
const accounts = ref<any[]>([]), journals = ref<any[]>([]), trial = ref<any[]>([]), dash = ref<any>({ summary:{}, monthly:[], overdue_invoices:[], overdue_bills:[] }), err = ref("");
const openToolGroup = ref('daily');
const accountingToolGroups = [
  { id:'daily', icon:'🧾', label:'Daily Accounting', description:'Accounts, journals, invoicing, receivables, suppliers, payables and banking.', tools:[
    { icon:'📊', label:'Chart of Accounts', to:'/admin/accounting/accounts', color:'tool-blue' },
    { icon:'📝', label:'General Journal', to:'/admin/accounting/journals', color:'tool-violet' },
    { icon:'🧾', label:'Sales & Invoices', to:'/admin/accounting/invoices', color:'tool-green' },
    { icon:'💰', label:'Accounts Receivable', to:'/admin/accounting/receivables', color:'tool-cyan' },
    { icon:'🚚', label:'Suppliers & Purchases', to:'/admin/accounting/purchases', color:'tool-orange' },
    { icon:'💳', label:'Accounts Payable', to:'/admin/accounting/payables', color:'tool-red' },
    { icon:'🏦', label:'Bank Reconciliation', to:'/admin/accounting/bank-reconciliation', color:'tool-indigo' },
  ]},
  { id:'inventory', icon:'📦', label:'Inventory & Purchasing', description:'Inventory accounting, cost of goods and purchasing intelligence.', tools:[
    { icon:'📦', label:'Inventory & COGS', to:'/admin/accounting/inventory', color:'tool-lime' },
    { icon:'📦', label:'Purchasing & Stock Intelligence', to:'/admin/accounting/stock-intelligence', color:'tool-orange' },
  ]},
  { id:'reports', icon:'📈', label:'Reports & Analysis', description:'Financial, tax, profitability, forecasting and management reporting.', tools:[
    { icon:'📈', label:'GST / BAS & Reports', to:'/admin/accounting/reports', color:'tool-amber' },
    { icon:'🧮', label:'ATO Income Report', to:'/admin/accounting/ato-income', color:'tool-teal' },
    { icon:'📚', label:'Financial Statements', to:'/admin/accounting/financial-statements', color:'tool-sky' },
    { icon:'💵', label:'Cash Flow & Forecasting', to:'/admin/accounting/cash-flow', color:'tool-emerald' },
    { icon:'📊', label:'Sales & Profitability', to:'/admin/accounting/profitability', color:'tool-blue' },
    { icon:'💼', label:'Business Management Report', to:'/admin/accounting/management-report', color:'tool-violet' },
    { icon:'📁', label:'Accountant Export', to:'/admin/accounting/year-end-export', color:'tool-fuchsia' },
  ]},
  { id:'control', icon:'🛡️', label:'Administration & Control', description:'Period locking, accounting health checks and audit controls.', tools:[
    { icon:'🔒', label:'Period Close', to:'/admin/accounting/period-close', color:'tool-rose' },
    { icon:'🛡️', label:'Accounting Health', to:'/admin/accounting/audit', color:'tool-slate' },
  ]},
];
const toggleToolGroup = (id:string) => { openToolGroup.value = openToolGroup.value === id ? '' : id; };
const money = (v: any) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(v || 0));
const totalDebits = computed(() => trial.value.reduce((s, a) => s + Number(a.debit || 0), 0));
const totalCredits = computed(() => trial.value.reduce((s, a) => s + Number(a.credit || 0), 0));
const fyLabel=computed(()=>dash.value?.period?.fy_start?`${String(dash.value.period.fy_start).slice(0,4)}/${String(Number(String(dash.value.period.fy_start).slice(0,4))+1).slice(-2)}`:'Current FY');
const date=(v:any)=>v?new Date(String(v)+'T00:00:00').toLocaleDateString('en-AU'):'—';
const monthLabel=(v:string)=>new Date(v+'-01T00:00:00').toLocaleDateString('en-AU',{month:'short'});
const chartMax=computed(()=>Math.max(1,...(dash.value.monthly||[]).flatMap((x:any)=>[Number(x.income||0),Number(x.expenses||0)])));
const barHeight=(v:any)=>`${Math.max(2,Math.round(Number(v||0)/chartMax.value*100))}%`;
const attention=computed(()=>{const s=dash.value.summary||{},a:any[]=[];if(Number(s.overdue_receivables)>0)a.push({label:'Overdue receivables',value:money(s.overdue_receivables),to:'/admin/accounting/receivables',alert:true});if(Number(s.overdue_payables)>0)a.push({label:'Overdue payables',value:money(s.overdue_payables),to:'/admin/accounting/payables',alert:true});if(Number(s.unreconciled_bank)>0)a.push({label:'Bank transactions to reconcile',value:String(s.unreconciled_bank),to:'/admin/accounting/bank-reconciliation',alert:false});return a});
async function load() {
  err.value = "";
  try {
    if (!isSuperAdmin.value) return navigateTo("/admin");
    [accounts.value, journals.value, trial.value, dash.value] = await Promise.all([
      adminFetch("/api/admin/accounting/accounts"),
      adminFetch("/api/admin/accounting/journals"),
      adminFetch("/api/admin/accounting/trial-balance"),
      adminFetch("/api/admin/accounting/dashboard"),
    ]);
  } catch (e: any) {
    err.value = e?.data?.statusMessage || e.message;
  }
}
onMounted(load);
</script>

<style scoped>
.admin-panel { @apply rounded-xl border border-slate-200 bg-white shadow-sm; }
.metric { @apply flex min-h-28 flex-col rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm; }
.metric small { @apply text-xs font-black uppercase tracking-wide text-slate-500; }
.metric b { @apply mt-2 text-xl font-black; }
.metric span { @apply mt-auto pt-2 text-xs text-slate-500; }
.btn-secondary { @apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold; }


.tool-tile { @apply flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2; }
.icon-shell { @apply flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-4xl shadow-sm ring-1 ring-black/5 transition duration-200; }
.tool-tile:hover .icon-shell { @apply scale-105 bg-white; }
.tool-label { @apply text-xs font-black leading-tight text-slate-700; }
.tool-blue { @apply border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 focus:ring-blue-400; }
.tool-violet { @apply border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 focus:ring-violet-400; }
.tool-green { @apply border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-400; }
.tool-cyan { @apply border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100 focus:ring-cyan-400; }
.tool-orange { @apply border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 focus:ring-orange-400; }
.tool-red { @apply border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 focus:ring-red-400; }
.tool-indigo { @apply border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 focus:ring-indigo-400; }
.tool-amber { @apply border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100 focus:ring-amber-400; }
.tool-teal { @apply border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100 focus:ring-teal-400; }
.tool-lime { @apply border-lime-200 bg-lime-50 text-lime-700 hover:border-lime-300 hover:bg-lime-100 focus:ring-lime-400; }
.tool-sky { @apply border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 focus:ring-sky-400; }
.tool-rose { @apply border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 focus:ring-rose-400; }
.tool-slate { @apply border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-200 focus:ring-slate-400; }
.tool-fuchsia { @apply border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:border-fuchsia-300 hover:bg-fuchsia-100 focus:ring-fuchsia-400; }
.tool-emerald { @apply border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-400; }

.tool-group { @apply overflow-hidden rounded-xl border border-slate-200 bg-white; }
.tool-group-button { @apply flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50; }
.group-icon { @apply flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl; }
.chevron { @apply shrink-0 text-2xl font-black text-slate-400 transition-transform duration-200; }
.chevron-open { @apply rotate-180 text-slate-700; }
</style>
