<template>
  <main class="admin-content">
    <div class="mb-6">
      <p class="text-xs font-black uppercase tracking-wider text-blue-600">SuperAdmin</p>
      <h1 class="text-3xl font-black">Accounting</h1>
      <p class="text-slate-500">Double-entry accounting foundation for Kialla Computers.</p>
    </div>

    <div v-if="err" class="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{{ err }}</div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="admin-panel p-5"><small>Accounts</small><div class="text-3xl font-black">{{ accounts.length }}</div></div>
      <div class="admin-panel p-5"><small>Posted Journals</small><div class="text-3xl font-black">{{ journals.length }}</div></div>
      <div class="admin-panel p-5"><small>Total Debits</small><div class="text-2xl font-black">{{ money(totalDebits) }}</div></div>
      <div class="admin-panel p-5"><small>Total Credits</small><div class="text-2xl font-black">{{ money(totalCredits) }}</div></div>
    </div>

    <section class="admin-panel mt-5 p-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black">Accounting Tools</h2>
          <p class="text-sm text-slate-500">Open an accounting area.</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-7">
        <NuxtLink class="tool-tile tool-blue" to="/admin/accounting/accounts" title="Chart of Accounts">
          <span class="icon-shell" aria-hidden="true">📊</span>
          <span class="tool-label">Chart of Accounts</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-violet" to="/admin/accounting/journals" title="General Journal">
          <span class="icon-shell" aria-hidden="true">📝</span>
          <span class="tool-label">General Journal</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-green" to="/admin/accounting/invoices" title="Sales & Invoices">
          <span class="icon-shell" aria-hidden="true">🧾</span>
          <span class="tool-label">Sales &amp; Invoices</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-cyan" to="/admin/accounting/receivables" title="Accounts Receivable">
          <span class="icon-shell" aria-hidden="true">💰</span>
          <span class="tool-label">Accounts Receivable</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-orange" to="/admin/accounting/purchases" title="Suppliers & Purchases">
          <span class="icon-shell" aria-hidden="true">🚚</span>
          <span class="tool-label">Suppliers &amp; Purchases</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-red" to="/admin/accounting/payables" title="Accounts Payable">
          <span class="icon-shell" aria-hidden="true">💳</span>
          <span class="tool-label">Accounts Payable</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-indigo" to="/admin/accounting/bank-reconciliation" title="Bank Reconciliation">
          <span class="icon-shell" aria-hidden="true">🏦</span>
          <span class="tool-label">Bank Reconciliation</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-amber" to="/admin/accounting/reports" title="GST / BAS & Reports">
          <span class="icon-shell" aria-hidden="true">📈</span>
          <span class="tool-label">GST / BAS &amp; Reports</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-teal" to="/admin/accounting/ato-income" title="ATO Income Report">
          <span class="icon-shell" aria-hidden="true">🧮</span>
          <span class="tool-label">ATO Income Report</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-lime" to="/admin/accounting/inventory" title="Inventory & COGS">
          <span class="icon-shell" aria-hidden="true">📦</span>
          <span class="tool-label">Inventory &amp; COGS</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-sky" to="/admin/accounting/financial-statements" title="Financial Statements">
          <span class="icon-shell" aria-hidden="true">📚</span>
          <span class="tool-label">Financial Statements</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-rose" to="/admin/accounting/period-close" title="Period Close">
          <span class="icon-shell" aria-hidden="true">🔒</span>
          <span class="tool-label">Period Close</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-slate" to="/admin/accounting/audit" title="Accounting Health & Audit">
          <span class="icon-shell" aria-hidden="true">🛡️</span>
          <span class="tool-label">Accounting Health</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-fuchsia" to="/admin/accounting/year-end-export" title="Accountant / Year-End Export">
          <span class="icon-shell" aria-hidden="true">📁</span>
          <span class="tool-label">Accountant Export</span>
        </NuxtLink>
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
const accounts = ref<any[]>([]), journals = ref<any[]>([]), trial = ref<any[]>([]), err = ref("");
const money = (v: any) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(v || 0));
const totalDebits = computed(() => trial.value.reduce((s, a) => s + Number(a.debit || 0), 0));
const totalCredits = computed(() => trial.value.reduce((s, a) => s + Number(a.credit || 0), 0));
async function load() {
  err.value = "";
  try {
    if (!isSuperAdmin.value) return navigateTo("/admin");
    [accounts.value, journals.value, trial.value] = await Promise.all([
      adminFetch("/api/admin/accounting/accounts"),
      adminFetch("/api/admin/accounting/journals"),
      adminFetch("/api/admin/accounting/trial-balance"),
    ]);
  } catch (e: any) {
    err.value = e?.data?.statusMessage || e.message;
  }
}
onMounted(load);
</script>

<style scoped>
.admin-panel { @apply rounded-xl border border-slate-200 bg-white shadow-sm; }
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
</style>
