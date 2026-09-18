<template>
  <main class="admin-content">
    <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600">← Accounting</NuxtLink>
    <div class="mt-2 flex flex-wrap items-start justify-between gap-4">
      <div><h1 class="text-3xl font-black">Accountant / Year-End Export</h1><p class="text-slate-500">Prepare a read-only accounting package for your accountant.</p></div>
      <button class="btn-primary" :disabled="loading" @click="downloadPackage">📁 Download Accountant ZIP</button>
    </div>
    <section class="panel mt-5 p-5">
      <div class="grid gap-4 md:grid-cols-4">
        <label class="label">Financial Year<select v-model="selectedFy" class="field" @change="applyFy"><option v-for="fy in fys" :key="fy.start" :value="fy.start">{{ fy.label }}</option><option value="custom">Custom dates</option></select></label>
        <label class="label">Start<input v-model="start" type="date" class="field" @change="selectedFy='custom'" /></label>
        <label class="label">End<input v-model="end" type="date" class="field" @change="selectedFy='custom'" /></label>
        <div class="flex items-end"><button class="btn-secondary w-full" :disabled="loading" @click="load">{{ loading?'Loading…':'Refresh Summary' }}</button></div>
      </div>
    </section>
    <div v-if="err" class="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{{ err }}</div>
    <template v-if="data">
      <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="card"><small>Gross Income</small><b>{{ money(data.summary.income) }}</b></div><div class="card"><small>Net Profit</small><b>{{ money(data.summary.net_profit) }}</b></div><div class="card"><small>Accounts Receivable</small><b>{{ money(data.summary.accounts_receivable) }}</b></div><div class="card"><small>Accounts Payable</small><b>{{ money(data.summary.accounts_payable) }}</b></div>
        <div class="card"><small>Inventory Value ex GST</small><b>{{ money(data.summary.inventory_value_ex_gst) }}</b></div><div class="card"><small>Journal Debits</small><b>{{ money(data.summary.journal_debits) }}</b></div><div class="card"><small>Journal Credits</small><b>{{ money(data.summary.journal_credits) }}</b></div><div class="card"><small>Accounting Health</small><b :class="healthy?'text-emerald-700':'text-amber-700'">{{ healthy?'Ready for review':'Review items' }}</b></div>
      </div>
      <section class="panel mt-5 p-5">
        <h2 class="text-xl font-black">Package Contents</h2><p class="mt-1 text-sm text-slate-500">The ZIP contains accountant-friendly CSV files that can be opened in Excel or imported into accounting tools.</p>
        <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="x in contents" :key="x" class="rounded-xl border border-slate-200 p-4 font-bold">✓ {{ x }}</div>
        </div>
      </section>
      <section class="panel mt-5 p-5 print-area"><div class="flex justify-between gap-4"><div><h2 class="text-xl font-black">Year-End Summary</h2><p class="text-sm text-slate-500">{{ date(start) }} – {{ date(end) }}</p></div><button class="btn-secondary no-print" @click="printSummary">Print / Save PDF</button></div>
        <div class="mt-5 overflow-x-auto"><table class="w-full text-sm"><tbody><tr v-for="row in summaryRows" :key="row[0]" class="border-b"><th class="p-3 text-left">{{ row[0] }}</th><td class="p-3 text-right font-black">{{ row[1] }}</td></tr></tbody></table></div>
        <p class="mt-5 text-xs text-slate-500">Prepared from posted accounting records for accountant review. This package is not an ATO lodgement form and does not alter accounting data.</p>
      </section>
    </template>
  </main>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']});const{adminFetch,isSuperAdmin}=useAdminFetch();const now=new Date(),fyStart=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;const start=ref(`${fyStart}-07-01`),end=ref(`${fyStart+1}-06-30`),selectedFy=ref(String(fyStart)),loading=ref(false),err=ref(''),data=ref<any>(null);const fys=Array.from({length:7},(_,i)=>{const y=fyStart+1-i;return{start:String(y),label:`FY ${y}/${String(y+1).slice(-2)}`}});const contents=['Profit & Loss','Balance Sheet','Trial Balance','General Ledger','ATO Income Report','Accounts Receivable Ageing','Accounts Payable Ageing','Inventory Valuation','Inventory Movements / COGS','Bank Transactions','Bank Reconciliation History','Chart of Accounts','Accounting Periods','Accounting Health Summary'];const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0));const date=(v:string)=>new Date(v+'T00:00:00').toLocaleDateString('en-AU');const healthy=computed(()=>data.value&&!data.value.health.unbalanced_journals&&!data.value.health.negative_or_invalid_invoice_balances&&!data.value.health.negative_or_invalid_bill_balances);const summaryRows=computed(()=>data.value?[['Gross business income',money(data.value.summary.income)],['Cost of goods sold',money(data.value.summary.cogs)],['Gross profit',money(data.value.summary.gross_profit)],['Operating expenses',money(data.value.summary.operating_expenses)],['Net profit',money(data.value.summary.net_profit)],['Accounts receivable',money(data.value.summary.accounts_receivable)],['Accounts payable',money(data.value.summary.accounts_payable)],['Inventory value ex GST',money(data.value.summary.inventory_value_ex_gst)],['Unreconciled bank transactions',String(data.value.health.unreconciled_bank_transactions)],['Journal debits',money(data.value.summary.journal_debits)],['Journal credits',money(data.value.summary.journal_credits)]]:[]);function applyFy(){if(selectedFy.value==='custom')return;const y=Number(selectedFy.value);start.value=`${y}-07-01`;end.value=`${y+1}-06-30`;load()}async function load(){err.value='';loading.value=true;try{if(!isSuperAdmin.value)return navigateTo('/admin');data.value=await adminFetch(`/api/admin/accounting/year-end/summary?start=${start.value}&end=${end.value}`)}catch(e:any){err.value=e?.data?.statusMessage||e.message||'Unable to prepare year-end summary.'}finally{loading.value=false}}async function downloadPackage(){err.value='';try{const res=await fetch(`/api/admin/accounting/year-end/export?start=${start.value}&end=${end.value}`,{credentials:'include'});if(!res.ok)throw new Error(await res.text()||'Export failed');const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Kialla-Computers-Year-End-${start.value}-to-${end.value}.zip`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}catch(e:any){err.value=e.message||'Export failed.'}}function printSummary(){window.print()}onMounted(load);
</script>
<style scoped>.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.card{@apply rounded-xl border border-slate-200 bg-white p-5 shadow-sm}.card small{@apply block text-xs font-bold uppercase text-slate-500}.card b{@apply mt-1 block text-xl font-black}.label{@apply text-sm font-bold}.field{@apply mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal}.btn-primary{@apply rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold disabled:opacity-50}@media print{.no-print{display:none}.admin-content>*:not(.print-area){display:none}.print-area{border:0;box-shadow:none}}
</style>
