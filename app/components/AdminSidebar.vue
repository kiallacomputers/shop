<template>
  <div class="flex h-full flex-col text-slate-300">
    <div class="border-b border-slate-800/90 px-4 py-4">
      <NuxtLink to="/admin" class="flex items-center gap-3 rounded-xl px-2 py-1" @click="nav">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm"><img src="/kialla-computers-logo.png" alt="Kialla Computers" class="h-full w-full object-contain" /></div>
        <div class="min-w-0"><p class="truncate text-sm font-black text-white">Kialla Computers</p><p class="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-400">Administration</p></div>
      </NuxtLink>
    </div>
    <nav class="admin-sidebar-nav flex-1 overflow-y-auto px-3 py-4">
      <NuxtLink to="/admin" :class="linkClass('/admin',true)" @click="nav">Dashboard</NuxtLink>

      <NavGroup v-for="group in visibleGroups" :key="group.key" :title="group.title" :open="openGroup===group.key" :active="groupActive(group)" @toggle="toggle(group.key)">
        <NuxtLink v-for="item in group.items" :key="item.to" :to="item.to" :class="linkClass(item.to,item.exact,item.exclude)" @click="nav">{{ item.label }}</NuxtLink>
      </NavGroup>
    </nav>
    <div class="border-t border-slate-800 p-3">
      <div v-if="securityGroup?.name && !isSuperAdmin" class="mb-2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-400">Group: <span class="font-bold text-slate-200">{{ securityGroup.name }}</span></div>
      <button type="button" class="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white" @click="backToStore">← Back to Store</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
const emit=defineEmits<{navigate:[]}>(); const route=useRoute();
const { isSuperAdmin, adminPermissions, securityGroup }=useAdminFetch();
const can=(key:string)=>isSuperAdmin.value || adminPermissions.value?.[key]===true;
const groups=computed(()=>[
 {key:'product',title:'Product',items:[
  {label:'Products',to:'/admin/products',exact:true},{label:'Add Product',to:'/admin/products/new'},{label:'Categories',to:'/admin/categories'},{label:'Bulk Stock Levels',to:'/admin/products/stock-levels'},{label:'Reorder Centre',to:'/admin/products/reorder-centre'},{label:'Stocktake',to:'/admin/products/stocktake'},{label:'Data Health',to:'/admin/products/data-health'},{label:'Product Reviews',to:'/admin/reviews'},{label:'Back in Stock',to:'/admin/back-in-stock'}]},
 {key:'sales',title:'Sales',items:[{label:'Orders',to:'/admin/orders'},{label:'Manual Quotes',to:'/admin/manual-quotes'},{label:'Quote Requests',to:'/admin/quotes'},{label:'Customers',to:'/admin/customers'}]},
 {key:'purchase',title:'Purchase',items:[{label:'Suppliers',to:'/admin/purchasing/suppliers'},{label:'Purchase Orders',to:'/admin/purchasing/purchase-orders',exclude:['/admin/purchasing/purchase-orders/receive-stock']},{label:'Receive Stock',to:'/admin/purchasing/purchase-orders/receive-stock'},{label:'Supplier Bills',to:'/admin/purchasing/suppliers/bills'},{label:'Inventory & COGS',to:'/admin/purchasing/inventory'},{label:'Stock Intelligence',to:'/admin/purchasing/stock-intelligence'}]},
 {key:'accounting',title:'Accounting',items:[{label:'Accounting Dashboard',to:'/admin/accounting',exact:true},{label:'Sales & Invoices',to:'/admin/accounting/invoices'},{label:'Accounts Receivable',to:'/admin/accounting/receivables'},{label:'Accounts Payable',to:'/admin/accounting/payables'},{label:'Bank Reconciliation',to:'/admin/accounting/bank-reconciliation'},{label:'Chart of Accounts',to:'/admin/accounting/accounts'},{label:'General Journals',to:'/admin/accounting/journals'},{label:'Financial Statements',to:'/admin/accounting/financial-statements'},{label:'Cash Flow',to:'/admin/accounting/cash-flow'},{label:'Reports',to:'/admin/accounting/reports'},{label:'Period Close',to:'/admin/accounting/period-close'},{label:'Year End Export',to:'/admin/accounting/year-end-export'}]},
 {key:'administration',title:'Administration',items:[{label:'Admin Accounts',to:'/admin/accounts'},{label:'Security Groups',to:'/admin/security-groups'},{label:'Security Centre',to:'/admin/security'},{label:'Live Chat',to:'/admin/chat'},{label:'Storage Cleanup',to:'/admin/storage-cleanup'}]},
 {key:'business',title:'Business',items:[{label:'Advertisements',to:'/admin/ads'},{label:'Freight & Pickup',to:'/admin/freight'},{label:'Pricing Levels',to:'/admin/pricing-levels'},{label:'Abandoned Carts',to:'/admin/abandoned-carts'},{label:'Analytics',to:'/admin/analytics'},{label:'Reports',to:'/admin/reports'},{label:'Marketing & SEO',to:'/admin/marketing-seo'},{label:'Google Shopping',to:'/admin/google-shopping'},{label:'Google Performance',to:'/admin/google-performance'},{label:'Google Search',to:'/admin/google-search'},{label:'Google API Setup',to:'/admin/google-merchant-registration'},{label:'Facebook Share',to:'/admin/facebook-share'}]},
]);
const visibleGroups=computed(()=>groups.value.filter(g=>can(g.key)).map(g=>({...g,items:g.items.filter(i=>{
  const superOnly=['/admin/products/data-health','/admin/quotes','/admin/accounts','/admin/security-groups','/admin/security','/admin/storage-cleanup','/admin/pricing-levels','/admin/reports','/admin/marketing-seo','/admin/google-shopping','/admin/google-performance','/admin/google-search','/admin/google-merchant-registration'];
  return !superOnly.includes(i.to) || isSuperAdmin.value;
})})));
const openGroup=ref<string|null>(null); const toggle=(k:string)=>openGroup.value=openGroup.value===k?null:k;
const groupActive=(g:any)=>g.items.some((i:any)=>route.path===i.to||route.path.startsWith(i.to+'/'));
const linkClass=(path:string,exact=false,exclude:string[]=[] )=>{const m=exact?route.path===path:route.path===path||route.path.startsWith(path+'/'); const x=(exclude||[]).some(e=>route.path===e||route.path.startsWith(e+'/')); return ['mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',m&&!x?'bg-blue-600 text-white shadow-lg shadow-blue-950/20':'text-slate-300 hover:bg-slate-800/90 hover:text-white'];};
const nav=()=>{openGroup.value=null;emit('navigate')}; const backToStore=()=>{emit('navigate');if(import.meta.client)window.location.assign('/')};
const NavGroup=defineComponent({props:{title:{type:String,required:true},open:Boolean,active:Boolean},emits:['toggle'],setup(p,{slots,emit}){return()=>h('div',{class:'mt-2'},[h('button',{type:'button',class:['mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.12em] transition',p.active?'bg-slate-800 text-blue-300':'text-slate-500 hover:bg-slate-800/70 hover:text-slate-300'],onClick:()=>emit('toggle')},[h('span',p.title),h('span',{class:['text-base transition-transform',p.open?'rotate-90':'']},'›')]),h('div',{class:['ml-2 border-l border-slate-800 pl-2',p.open?'block':'hidden']},slots.default?.())])}});
</script>
