<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-xs font-black uppercase tracking-[.18em] text-blue-600">Operations</p><h1 class="mt-1 text-3xl font-black text-slate-900">Purchasing</h1><p class="mt-1 text-slate-500">Manage suppliers, purchase orders, stock receiving, supplier bills and inventory separately from Accounting.</p></div>
      <NuxtLink to="/admin/purchasing/purchase-orders/new" class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">+ Create Purchase Order</NuxtLink>
    </div>
    <section class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink v-for="item in cards" :key="item.to" :to="item.to" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
        <div class="flex items-start gap-3"><span class="text-2xl">{{item.icon}}</span><div><h2 class="font-black text-slate-900">{{item.title}}</h2><p class="mt-1 text-sm text-slate-500">{{item.text}}</p></div></div>
      </NuxtLink>
    </section>
    <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-black">Purchasing → Accounting hand-off</h2><p class="mt-1 text-sm text-slate-500">Supplier Bills remain part of the Purchasing workflow. Once money is owing or paid, the financial posting is managed through Accounts Payable in Accounting.</p><NuxtLink to="/admin/accounting/payables" class="mt-4 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Open Accounts Payable →</NuxtLink></section>
  </main>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']})
const cards=[
 {to:'/admin/purchasing/suppliers',icon:'🚚',title:'Suppliers',text:'Supplier directory, contact details and product mappings.'},
 {to:'/admin/purchasing/purchase-orders',icon:'📋',title:'Purchase Orders',text:'Create, send, order and manage purchase orders.'},
 {to:'/admin/purchasing/purchase-orders/receive-stock',icon:'📦',title:'Receive Stock',text:'Receive full or partial deliveries against purchase orders.'},
 {to:'/admin/purchasing/suppliers/bills',icon:'🧾',title:'Supplier Bills',text:'Review bills created from purchase orders and their payment status.'},
 {to:'/admin/purchasing/inventory',icon:'📊',title:'Inventory & COGS',text:'Stock valuation, cost of goods and manual stock adjustments.'},
 {to:'/admin/purchasing/stock-intelligence',icon:'📈',title:'Stock Intelligence',text:'Reorder recommendations, stock cover and supplier purchasing insights.'}
]
</script>
