<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <NuxtLink to="/admin" class="text-sm font-bold text-blue-600 hover:text-blue-700">← Admin Dashboard</NuxtLink>
        <p class="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-600">Administration</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Back in Stock Notifications</h1>
        <p class="mt-2 text-slate-500">See customer demand and notification history for unavailable products.</p>
      </div>
      <button type="button" :disabled="loading" class="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60" @click="load">Refresh</button>
    </div>

    <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{{ errorMessage }}</div>
    <div v-if="successMessage" class="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{{ successMessage }}</div>

    <section class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-xl border bg-white p-5"><p class="text-xs font-bold uppercase text-slate-500">Waiting</p><p class="mt-2 text-3xl font-black text-amber-700">{{ waiting.length }}</p></div>
      <div class="rounded-xl border bg-white p-5"><p class="text-xs font-bold uppercase text-slate-500">Products with demand</p><p class="mt-2 text-3xl font-black text-slate-900">{{ waitingProducts.length }}</p></div>
      <div class="rounded-xl border bg-white p-5"><p class="text-xs font-bold uppercase text-slate-500">Sent</p><p class="mt-2 text-3xl font-black text-emerald-700">{{ sent.length }}</p></div>
    </section>

    <section class="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-slate-900">Customers Waiting by Product</h2>
      <p class="mt-1 text-sm text-slate-500">Useful as a quick guide when deciding what to reorder.</p>
      <div v-if="waitingProducts.length" class="mt-5 divide-y divide-slate-100">
        <div v-for="item in waitingProducts" :key="item.key" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-bold text-slate-900">{{ item.name }}<span v-if="item.variant"> — {{ item.variant }}</span></p>
            <p class="text-sm text-slate-500">{{ item.code || 'No product code' }} · Current stock: {{ item.stock }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-800">{{ item.count }} waiting</span>
            <button v-if="item.stock > 0" type="button" :disabled="processingKey === item.key" class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" @click="processItem(item)">{{ processingKey === item.key ? 'Sending…' : 'Send Available Now' }}</button>
          </div>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-slate-500">No customers are currently waiting for stock.</p>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-xl font-bold text-slate-900">Notification History</h2>
        <select v-model="filter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">All</option><option value="waiting">Waiting</option><option value="sent">Sent</option><option value="cancelled">Cancelled</option></select>
      </div>
      <div class="mt-5 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-3 py-3">Customer</th><th class="px-3 py-3">Product</th><th class="px-3 py-3">Requested</th><th class="px-3 py-3">Status</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in filtered" :key="row.id"><td class="px-3 py-3"><p class="font-semibold">{{ row.customer_name || 'Customer' }}</p><p class="text-xs text-slate-500">{{ row.email }}</p></td><td class="px-3 py-3"><p class="font-semibold">{{ row.products?.name }}<span v-if="row.product_variants?.name"> — {{ row.product_variants.name }}</span></p><p class="text-xs text-slate-500">{{ row.product_variants?.product_code || row.products?.product_code || '' }}</p></td><td class="px-3 py-3 text-slate-600">{{ formatDate(row.requested_at) }}</td><td class="px-3 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-bold capitalize" :class="statusClass(row.status)">{{ row.status }}</span><p v-if="row.last_error" class="mt-1 max-w-xs text-xs text-red-600">{{ row.last_error }}</p></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });
const { adminFetch } = useAdminFetch();
const rows = ref<any[]>([]); const loading=ref(false); const errorMessage=ref(''); const successMessage=ref(''); const filter=ref('all'); const processingKey=ref('');
const waiting=computed(()=>rows.value.filter(x=>x.status==='waiting')); const sent=computed(()=>rows.value.filter(x=>x.status==='sent')); const filtered=computed(()=>filter.value==='all'?rows.value:rows.value.filter(x=>x.status===filter.value));
const waitingProducts=computed(()=>{ const map=new Map<string,any>(); for(const r of waiting.value){ const key=`${r.product_id}:${r.variant_id||'base'}`; const current=map.get(key)||{key,product_id:r.product_id,variant_id:r.variant_id,name:r.products?.name||'Product',variant:r.product_variants?.name||'',code:r.product_variants?.product_code||r.products?.product_code||'',stock:Number(r.product_variants?.stock??r.products?.stock??0),count:0}; current.count++; map.set(key,current); } return [...map.values()].sort((a,b)=>b.count-a.count); });
async function load(){loading.value=true;errorMessage.value='';try{rows.value=await adminFetch<any[]>('/api/admin/back-in-stock')||[]}catch(e:any){errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to load notifications.'}finally{loading.value=false}}
async function processItem(item:any){processingKey.value=item.key;errorMessage.value='';successMessage.value='';try{const result=await adminFetch<any>('/api/admin/back-in-stock/process',{method:'POST',body:{product_id:item.product_id,variant_id:item.variant_id}});successMessage.value=`Sent ${result?.sent||0} back-in-stock notification(s).`;await load()}catch(e:any){errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to send notifications.'}finally{processingKey.value=''}}
const formatDate=(v:string)=>new Date(v).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short'}); const statusClass=(s:string)=>s==='sent'?'bg-emerald-100 text-emerald-700':s==='waiting'?'bg-amber-100 text-amber-800':'bg-slate-100 text-slate-600';
onMounted(load);
</script>
