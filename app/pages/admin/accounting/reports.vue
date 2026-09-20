<template>
  <main class="admin-content">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p class="text-xs font-black uppercase tracking-wider text-blue-600">Accounting</p><h1 class="text-3xl font-black">GST / BAS & Financial Reports</h1><p class="text-slate-500">Review GST activity and profit & loss for a selected period.</p></div>
      <NuxtLink class="btn-secondary" to="/admin/accounting">← Accounting</NuxtLink>
    </div>
    <div class="admin-panel p-4">
      <div class="flex flex-wrap items-end gap-3"><label><span>From</span><input v-model="start" type="date" /></label><label><span>To</span><input v-model="end" type="date" /></label><button class="btn-primary" @click="load">Run Reports</button></div>
    </div>
    <div v-if="err" class="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{{ err }}</div>

    <section class="mt-5">
      <h2 class="mb-3 text-xl font-black">GST / BAS Estimate</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div class="metric"><small>G1 Total Sales</small><strong>{{ money(gst?.summary?.g1_total_sales) }}</strong></div>
        <div class="metric"><small>GST Collected</small><strong>{{ money(gst?.summary?.gst_collected) }}</strong></div>
        <div class="metric"><small>G11 Purchases</small><strong>{{ money(gst?.summary?.g11_non_capital_purchases) }}</strong></div>
        <div class="metric"><small>GST Credits</small><strong>{{ money(gst?.summary?.gst_credits) }}</strong></div>
        <div class="metric"><small>Estimated Net GST</small><strong>{{ money(gst?.summary?.estimated_net_gst) }}</strong></div>
      </div>
      <div class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{{ gst?.note }}</div>
    </section>

    <section class="admin-panel mt-5 p-5">
      <h2 class="text-xl font-black">Profit & Loss</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-3"><div class="metric"><small>Income</small><strong>{{ money(pl?.summary?.income) }}</strong></div><div class="metric"><small>Expenses</small><strong>{{ money(pl?.summary?.expenses) }}</strong></div><div class="metric"><small>Net Profit</small><strong>{{ money(pl?.summary?.net_profit) }}</strong></div></div>
      <div class="mt-5 overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b text-left"><th class="p-2">Code</th><th>Account</th><th>Type</th><th class="text-right">Amount</th></tr></thead><tbody><tr v-for="r in pl?.rows || []" :key="r.id" class="border-b"><td class="p-2 font-mono">{{ r.code }}</td><td>{{ r.name }}</td><td class="capitalize">{{ r.account_type.replaceAll('_',' ') }}</td><td class="text-right font-bold">{{ money(r.amount) }}</td></tr><tr v-if="!(pl?.rows || []).length"><td colspan="4" class="p-6 text-center text-slate-500">No posted income or expense journals in this period.</td></tr></tbody></table></div>
    </section>

    <section class="admin-panel mt-5 p-5"><h2 class="text-xl font-black">BAS Source Transactions</h2><div class="mt-4 grid gap-6 lg:grid-cols-2"><div><h3 class="font-black">Sales ({{ gst?.sales?.length || 0 }})</h3><div class="mt-2 max-h-80 overflow-auto"><div v-for="x in gst?.sales || []" :key="x.id" class="flex justify-between border-b py-2 text-sm"><span>{{ x.invoice_date }} · {{ x.invoice_number || `Invoice ${x.id}` }}</span><strong>{{ money(x.total) }}</strong></div></div></div><div><h3 class="font-black">Purchases ({{ gst?.purchases?.length || 0 }})</h3><div class="mt-2 max-h-80 overflow-auto"><div v-for="x in gst?.purchases || []" :key="x.id" class="flex justify-between border-b py-2 text-sm"><span>{{ x.bill_date }} · {{ x.accounting_suppliers?.name || 'Supplier' }}</span><strong>{{ money(x.total) }}</strong></div></div></div></div></section>
  </main>
</template>
<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["admin"] });
const { adminFetch, isSuperAdmin } = useAdminFetch();
const now = new Date(); const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1);
const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const start=ref(iso(qStart)), end=ref(iso(now)), gst=ref<any>(null), pl=ref<any>(null), err=ref('');
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0));
async function load(){err.value='';try{if(!isSuperAdmin.value)return navigateTo('/admin');[gst.value,pl.value]=await Promise.all([adminFetch(`/api/admin/accounting/reports/gst?start=${start.value}&end=${end.value}`),adminFetch(`/api/admin/accounting/reports/profit-loss?start=${start.value}&end=${end.value}`)])}catch(e:any){err.value=e?.data?.statusMessage||e.message}}
onMounted(load);
</script>
<style scoped>
.admin-panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.metric{@apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm}.metric small{@apply block text-xs font-bold uppercase tracking-wide text-slate-500}.metric strong{@apply mt-1 block text-2xl font-black}.btn-primary{@apply rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold}label span{@apply mb-1 block text-xs font-bold text-slate-500}input{@apply rounded-lg border border-slate-300 px-3 py-2}
</style>
