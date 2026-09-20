<template>
  <section class="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p class="text-[11px] font-black uppercase tracking-[.18em] text-blue-600">Sales workspace</p>
        <p class="mt-1 text-sm text-slate-500">Customer → Quote → Order → Invoice → Payment → Delivery</p>
      </div>
      <NuxtLink to="/admin/customers" class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-blue-700">+ Customer / Quote</NuxtLink>
    </div>
    <nav class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Sales workflow">
      <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="group rounded-xl border px-3 py-3 transition" :class="active(item) ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50'">
        <div class="flex items-center gap-2"><span class="text-lg">{{ item.icon }}</span><span class="text-sm font-black">{{ item.label }}</span></div>
        <p class="mt-1 hidden text-xs text-slate-500 xl:block">{{ item.caption }}</p>
      </NuxtLink>
    </nav>
  </section>
</template>
<script setup lang="ts">
const route=useRoute()
const items=[
 {to:'/admin/customers',icon:'👥',label:'Customers',caption:'Profiles & pricing'},
 {to:'/admin/manual-quotes',icon:'📝',label:'Quotes',caption:'Create & send'},
 {to:'/admin/orders',icon:'🛒',label:'Orders',caption:'Process sales'},
 {to:'/admin/accounting/invoices',icon:'🧾',label:'Invoices',caption:'Invoice & payments'},
 {to:'/admin/accounting/receivables',icon:'💰',label:'Receivables',caption:'Money owing'},
 {to:'/admin/freight',icon:'🚚',label:'Delivery',caption:'Freight & pickup'}
]
function active(item:any){return route.path===item.to||route.path.startsWith(item.to+'/')}
</script>
