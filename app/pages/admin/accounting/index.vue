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

      <div class="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        <NuxtLink class="tool-tile tool-blue" to="/admin/accounting/accounts" title="Chart of Accounts">
          <span class="icon-shell"><ToolIcon path="M4 5h16v14H4V5Zm4 4h8M8 13h3m2 0h3M8 17h3m2 0h3" /></span>
          <span class="tool-label">Chart of Accounts</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-violet" to="/admin/accounting/journals" title="General Journal">
          <span class="icon-shell"><ToolIcon path="M6 3h9l3 3v15H6V3Zm3 7h6m-6 4h6m-6 4h4" /></span>
          <span class="tool-label">General Journal</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-green" to="/admin/accounting/invoices" title="Sales & Invoices">
          <span class="icon-shell"><ToolIcon path="M6 3h12v18H6V3Zm3 5h6m-6 4h6m-6 4h3" /></span>
          <span class="tool-label">Sales &amp; Invoices</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-cyan" to="/admin/accounting/receivables" title="Accounts Receivable">
          <span class="icon-shell"><ToolIcon path="M4 6h16v12H4V6Zm3 4h10M8 14h4m5-2 2 2-2 2" /></span>
          <span class="tool-label">Accounts Receivable</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-orange" to="/admin/accounting/purchases" title="Suppliers & Purchases">
          <span class="icon-shell"><ToolIcon path="M3 7h18l-2 12H5L3 7Zm4 0 2-3h6l2 3M8 12h8" /></span>
          <span class="tool-label">Suppliers &amp; Purchases</span>
        </NuxtLink>
        <NuxtLink class="tool-tile tool-red" to="/admin/accounting/payables" title="Accounts Payable">
          <span class="icon-shell"><ToolIcon path="M4 6h16v12H4V6Zm3 4h10m-7 4h4m-5-2-2 2 2 2" /></span>
          <span class="tool-label">Accounts Payable</span>
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
import { defineComponent, h } from "vue";
definePageMeta({ layout: "admin", middleware: ["admin"] });
const { adminFetch, isSuperAdmin } = useAdminFetch();
const accounts = ref<any[]>([]), journals = ref<any[]>([]), trial = ref<any[]>([]), err = ref("");
const money = (v: any) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(v || 0));
const totalDebits = computed(() => trial.value.reduce((s, a) => s + Number(a.debit || 0), 0));
const totalCredits = computed(() => trial.value.reduce((s, a) => s + Number(a.credit || 0), 0));
const ToolIcon = defineComponent({
  props: { path: { type: String, required: true } },
  setup(props) {
    return () => h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", class: "h-9 w-9", "aria-hidden": "true" }, [h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d: props.path })]);
  },
});
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
.icon-shell { @apply flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 transition duration-200; }
.tool-tile:hover .icon-shell { @apply scale-105 bg-white; }
.tool-label { @apply text-xs font-black leading-tight text-slate-700; }
.tool-blue { @apply border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 focus:ring-blue-400; }
.tool-violet { @apply border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 focus:ring-violet-400; }
.tool-green { @apply border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-400; }
.tool-cyan { @apply border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100 focus:ring-cyan-400; }
.tool-orange { @apply border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 focus:ring-orange-400; }
.tool-red { @apply border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 focus:ring-red-400; }
</style>
