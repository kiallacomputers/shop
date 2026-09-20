<template>
  <section class="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p class="text-[11px] font-black uppercase tracking-[.18em] text-blue-600">Purchasing workspace</p>
        <p class="mt-1 text-sm text-slate-500">Supplier → Purchase Order → Receive Stock → Supplier Bill → Payment → Inventory</p>
      </div>
      <NuxtLink to="/admin/purchasing/purchase-orders/new" class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-blue-700">+ Purchase Order</NuxtLink>
    </div>
    <nav class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Purchasing workflow">
      <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="group rounded-xl border px-3 py-3 transition" :class="active(item) ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50'">
        <div class="flex items-center gap-2"><span class="text-lg">{{ item.icon }}</span><span class="text-sm font-black">{{ item.label }}</span></div>
        <p class="mt-1 hidden text-xs text-slate-500 xl:block">{{ item.caption }}</p>
      </NuxtLink>
    </nav>
    <div class="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-5">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-slate-500">
        <span>Draft</span><span>→</span><span>Sent / Ordered</span><span>→</span><span>Partially Received</span><span>→</span><span>Received</span><span>→</span><span>Billed</span><span>→</span><span>Paid</span>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
const route=useRoute()
const items=[
 {to:'/admin/purchasing/suppliers',icon:'🚚',label:'Suppliers',caption:'Directory & products'},
 {to:'/admin/purchasing/purchase-orders',icon:'📋',label:'Purchase Orders',caption:'Create & order'},
 {to:'/admin/purchasing/purchase-orders/receive-stock',icon:'📦',label:'Receive Stock',caption:'Partial or full'},
 {to:'/admin/purchasing/suppliers/bills',icon:'🧾',label:'Bills',caption:'Bills & due dates'},
 {to:'/admin/accounting/payables',icon:'💳',label:'Payables',caption:'Money owing'},
 {to:'/admin/purchasing/inventory',icon:'📊',label:'Inventory',caption:'Value & COGS'}
]
function active(item:any){return route.path===item.to||route.path.startsWith(item.to+'/')}
</script>
