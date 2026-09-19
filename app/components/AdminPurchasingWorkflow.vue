<template>
  <section class="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p class="text-[11px] font-black uppercase tracking-[.18em] text-emerald-700">Purchasing workspace</p>
        <p class="mt-1 text-sm text-slate-500">Supplier → Purchase Order → Receive Stock → Supplier Bill → Payment → Inventory</p>
      </div>
      <NuxtLink to="/admin/accounting/stock-intelligence" class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-emerald-700">📦 Stock Intelligence</NuxtLink>
    </div>
    <nav class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Purchasing workflow">
      <NuxtLink v-for="item in items" :key="item.key" :to="item.to" class="group rounded-xl border px-3 py-3 transition" :class="active(item) ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-slate-50'">
        <div class="flex items-center gap-2"><span class="text-lg">{{ item.icon }}</span><span class="text-sm font-black">{{ item.label }}</span></div>
        <p class="mt-1 hidden text-xs text-slate-500 xl:block">{{ item.caption }}</p>
      </NuxtLink>
    </nav>
  </section>
</template>
<script setup lang="ts">
const route=useRoute()
const items=[
 {key:'supplier',to:'/admin/accounting/purchases',icon:'🚚',label:'Suppliers',caption:'Suppliers & products'},
 {key:'po',to:'/admin/accounting/purchases#purchase-orders',icon:'📋',label:'Purchase Orders',caption:'Order & receive'},
 {key:'receive',to:'/admin/accounting/purchases#purchase-orders',icon:'📦',label:'Receive Stock',caption:'Partial or full'},
 {key:'bill',to:'/admin/accounting/purchases#supplier-bills',icon:'🧾',label:'Supplier Bills',caption:'Convert & review'},
 {key:'pay',to:'/admin/accounting/payables',icon:'💳',label:'Payables',caption:'Bills & payments'},
 {key:'inventory',to:'/admin/accounting/inventory',icon:'📊',label:'Inventory',caption:'Value & COGS'}
]
function active(item:any){
 if(item.key==='supplier'||item.key==='po'||item.key==='receive'||item.key==='bill') return route.path==='/admin/accounting/purchases'
 return route.path===item.to||route.path.startsWith(item.to+'/')
}
</script>
