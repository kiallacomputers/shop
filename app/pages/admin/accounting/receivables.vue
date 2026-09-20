<template>
  <main class="admin-content"><AdminSalesWorkflow />
    <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600">← Accounting</NuxtLink>
    <div class="mt-2 flex flex-wrap items-start justify-between gap-3">
      <div><h1 class="text-3xl font-black">Accounts Receivable</h1><p class="text-slate-500">Outstanding customer invoices and debtor ageing.</p></div>
      <button class="btn-secondary" @click="load">Refresh</button>
    </div>
    <div v-if="err" class="my-4 rounded-lg bg-red-50 p-3 text-red-700">{{ err }}</div>
    <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div class="card"><small>Total Outstanding</small><b>{{ money(totalOutstanding) }}</b></div>
      <div class="card"><small>Current</small><b>{{ money(ageing.current) }}</b></div>
      <div class="card"><small>1–30 Days</small><b>{{ money(ageing.d30) }}</b></div>
      <div class="card"><small>31–60 Days</small><b>{{ money(ageing.d60) }}</b></div>
      <div class="card"><small>61+ Days</small><b>{{ money(ageing.d90plus) }}</b></div>
    </div>
    <section class="admin-panel mt-5 p-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="text-xl font-black">Collections Centre</h2><p class="text-sm text-slate-500">Only invoices with an outstanding balance are shown.</p></div>
        <label class="text-sm font-bold">Ageing<select v-model="filter" class="field"><option value="all">All outstanding</option><option value="current">Current</option><option value="30">1–30 days</option><option value="60">31–60 days</option><option value="90">61+ days</option></select></label>
      </div>
      <div class="mt-4 overflow-x-auto"><table class="w-full min-w-[850px] text-sm"><thead><tr class="border-b text-left"><th class="p-2">Invoice</th><th>Customer</th><th>Invoice Date</th><th>Age</th><th>Status</th><th class="text-right">Total</th><th class="text-right">Paid</th><th class="text-right">Balance</th><th></th></tr></thead><tbody>
        <tr v-for="i in filtered" :key="i.id" class="border-b"><td class="p-2 font-bold">{{ i.invoice_number }}</td><td>{{ i.customer_name || i.customer_email || '—' }}</td><td>{{ date(i.invoice_date) }}</td><td>{{ ageDays(i) }} days</td><td><span class="badge" :class="ageDays(i)>30?'bg-red-100 text-red-700':ageDays(i)>0?'bg-amber-100 text-amber-800':'bg-slate-100 text-slate-700'">{{ ageLabel(i) }}</span></td><td class="text-right">{{ money(i.total) }}</td><td class="text-right text-emerald-700">{{ money(i.paid_amount) }}</td><td class="text-right font-black">{{ money(balance(i)) }}</td><td class="text-right"><NuxtLink :to="'/admin/accounting/invoices'" class="text-xs font-bold text-blue-600">Payments →</NuxtLink></td></tr>
        <tr v-if="!filtered.length"><td colspan="9" class="p-8 text-center text-slate-500">No outstanding invoices in this ageing range.</td></tr>
      </tbody></table></div>
    </section>
  </main>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const { adminFetch, isSuperAdmin } = useAdminFetch()
const invoices = ref<any[]>([]), err = ref(''), filter = ref('all')
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const date=(v:any)=>v?new Date(`${String(v).slice(0,10)}T00:00:00`).toLocaleDateString('en-AU'):'—'
const balance=(i:any)=>Math.max(0,Number(i.total||0)-Number(i.paid_amount||0))
const ageDays=(i:any)=>{const d=new Date(`${String(i.invoice_date).slice(0,10)}T00:00:00`);const n=new Date();n.setHours(0,0,0,0);return Math.max(0,Math.floor((n.getTime()-d.getTime())/86400000))}
const ageLabel=(i:any)=>{const a=ageDays(i);return a===0?'Current':a<=30?'1–30 days':a<=60?'31–60 days':'61+ days'}
const outstanding=computed(()=>invoices.value.filter(i=>balance(i)>0))
const totalOutstanding=computed(()=>outstanding.value.reduce((s,i)=>s+balance(i),0))
const ageing=computed(()=>outstanding.value.reduce((a,i)=>{const d=ageDays(i),b=balance(i);if(d===0)a.current+=b;else if(d<=30)a.d30+=b;else if(d<=60)a.d60+=b;else a.d90plus+=b;return a},{current:0,d30:0,d60:0,d90plus:0}))
const filtered=computed(()=>outstanding.value.filter(i=>filter.value==='all'||(filter.value==='current'&&ageDays(i)===0)||(filter.value==='30'&&ageDays(i)>0&&ageDays(i)<=30)||(filter.value==='60'&&ageDays(i)>30&&ageDays(i)<=60)||(filter.value==='90'&&ageDays(i)>60)))
async function load(){err.value='';try{if(!isSuperAdmin.value)return navigateTo('/admin');invoices.value=await adminFetch('/api/admin/accounting/invoices')}catch(e:any){err.value=e?.data?.statusMessage||e.message||'Unable to load accounts receivable.'}}
onMounted(load)
</script>
<style scoped>.admin-panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.card{@apply rounded-xl border border-slate-200 bg-white p-5 shadow-sm}.card small{@apply block text-xs font-bold uppercase text-slate-500}.card b{@apply mt-1 block text-2xl font-black}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold}.field{@apply ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal}.badge{@apply rounded-full px-2 py-1 text-xs font-bold}</style>
