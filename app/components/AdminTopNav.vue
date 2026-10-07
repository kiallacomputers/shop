<template>
  <nav class="flex h-full items-center gap-1">
    <NuxtLink to="/admin" :class="topLink('/admin', true)">Dashboard</NuxtLink>
    <div v-for="group in visibleGroups" :key="group.key" class="relative">
      <button type="button" class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition"
        :class="groupActive(group) ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'"
        @click.stop="openGroup=openGroup===group.key?null:group.key">
        {{ group.title }} <span class="text-xs" :class="openGroup===group.key?'rotate-180':''">⌄</span>
      </button>
      <div v-if="openGroup===group.key" class="absolute left-0 top-[calc(100%+10px)] z-[100] w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
        <NuxtLink v-for="item in group.items" :key="item.to" :to="item.to"
          class="block rounded-lg px-3 py-2.5 text-sm font-semibold transition"
          :class="itemActive(item)?'bg-blue-600 text-white':'text-slate-700 hover:bg-slate-100 hover:text-blue-700'"
          @click="openGroup=null">{{ item.label }}</NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route=useRoute();
const {isSuperAdmin,adminPermissions}=useAdminFetch();
const openGroup=ref<string|null>(null);
const can=(key:string)=>isSuperAdmin.value||adminPermissions.value?.[key]===true;
const groups=computed(()=>[
 {key:'product',title:'Product',items:[
  {label:'Products',to:'/admin/products',exact:true,permission:'product.view'},{label:'Add Product',to:'/admin/products/new',permission:'product.create'},{label:'Categories',to:'/admin/categories',permission:'product.categories'},{label:'Bulk Stock Levels',to:'/admin/products/stock-levels',permission:'product.stock'},{label:'Inventory Control',to:'/admin/products/inventory-control',permission:'product.stock'},{label:'Reorder Centre',to:'/admin/products/reorder-centre',permission:'product.reorder'},{label:'Stocktake',to:'/admin/products/stocktake',permission:'product.stocktake'},{label:'Data Health',to:'/admin/products/data-health',permission:'product.data_health'},{label:'Product Reviews',to:'/admin/reviews',permission:'product.reviews'},{label:'Back in Stock',to:'/admin/back-in-stock',permission:'product.back_in_stock'}]},
 {key:'sales',title:'Sales',items:[{label:'Orders',to:'/admin/orders',permission:'sales.orders.view'},{label:'Manual Quotes',to:'/admin/manual-quotes',permission:'sales.quotes.view'},{label:'Quote Requests',to:'/admin/quotes',permission:'sales.quote_requests'},{label:'Customers',to:'/admin/customers',permission:'sales.customers.view'}]},
 {key:'purchase',title:'Purchase',items:[{label:'Suppliers',to:'/admin/purchasing/suppliers',permission:'purchase.suppliers.view'},{label:'Purchase Orders',to:'/admin/purchasing/purchase-orders',exclude:['/admin/purchasing/purchase-orders/receive-stock'],permission:'purchase.orders.view'},{label:'Receive Stock',to:'/admin/purchasing/purchase-orders/receive-stock',permission:'purchase.receive_stock'},{label:'Supplier Bills',to:'/admin/purchasing/suppliers/bills',permission:'purchase.supplier_bills'},{label:'Inventory & COGS',to:'/admin/purchasing/inventory',permission:'purchase.inventory'},{label:'Stock Intelligence',to:'/admin/purchasing/stock-intelligence',permission:'purchase.stock_intelligence'}]},
 {key:'accounting',title:'Accounting',items:[{label:'Accounting Dashboard',to:'/admin/accounting',exact:true,permission:'accounting.dashboard'},{label:'Sales & Invoices',to:'/admin/accounting/invoices',permission:'accounting.invoices'},{label:'Accounts Receivable',to:'/admin/accounting/receivables',permission:'accounting.receivables'},{label:'Accounts Payable',to:'/admin/accounting/payables',permission:'accounting.payables'},{label:'Bank Reconciliation',to:'/admin/accounting/bank-reconciliation',permission:'accounting.bank_reconciliation'},{label:'Chart of Accounts',to:'/admin/accounting/accounts',permission:'accounting.accounts'},{label:'General Journals',to:'/admin/accounting/journals',permission:'accounting.journals'},{label:'Financial Statements',to:'/admin/accounting/financial-statements',permission:'accounting.financial_statements'},{label:'Cash Flow',to:'/admin/accounting/cash-flow',permission:'accounting.cash_flow'},{label:'GST & BAS',to:'/admin/accounting/gst-bas',permission:'accounting.reports'},{label:'Financial Reports',to:'/admin/accounting/reports',permission:'accounting.reports'},{label:'Period Close',to:'/admin/accounting/period-close',permission:'accounting.period_close'},{label:'Year End Export',to:'/admin/accounting/year-end-export',permission:'accounting.year_end'}]},
 {key:'administration',title:'Administration',items:[{label:'Admin Accounts',to:'/admin/accounts',permission:'administration.admin_accounts'},{label:'Security Groups',to:'/admin/security-groups',permission:'administration.security_groups'},{label:'Security Centre',to:'/admin/security',permission:'administration.security_centre'},{label:'Live Chat',to:'/admin/chat',permission:'administration.chat'},{label:'Storage Cleanup',to:'/admin/storage-cleanup',permission:'administration.storage_cleanup'}]},
 {key:'business',title:'Business',items:[{label:'Advertisements',to:'/admin/ads',permission:'business.ads'},{label:'Freight & Pickup',to:'/admin/freight',permission:'business.freight'},{label:'Pricing Levels',to:'/admin/pricing-levels',permission:'business.pricing_levels'},{label:'Abandoned Carts',to:'/admin/abandoned-carts',permission:'business.abandoned_carts'},{label:'Analytics',to:'/admin/analytics',permission:'business.analytics'},{label:'Reports',to:'/admin/reports',permission:'business.reports'},{label:'Marketing & SEO',to:'/admin/marketing-seo',permission:'business.marketing_seo'},{label:'Google Shopping',to:'/admin/google-shopping',permission:'business.google_shopping'},{label:'Google Performance',to:'/admin/google-performance',permission:'business.google_performance'},{label:'Google Search',to:'/admin/google-search',permission:'business.google_search'},{label:'Google API Setup',to:'/admin/google-merchant-registration',permission:'business.google_api'},{label:'Facebook Share',to:'/admin/facebook-share',permission:'business.facebook'}]}
]);
const visibleGroups=computed(()=>groups.value.map(g=>({...g,items:g.items.filter((i:any)=>{
 const superOnly=['/admin/products/data-health','/admin/quotes','/admin/accounts','/admin/security-groups','/admin/security','/admin/storage-cleanup','/admin/pricing-levels','/admin/reports','/admin/marketing-seo','/admin/google-shopping','/admin/google-performance','/admin/google-search','/admin/google-merchant-registration'];
 if(superOnly.includes(i.to)&&!isSuperAdmin.value)return false; return can(i.permission);
})})).filter(g=>g.items.length));
const itemActive=(i:any)=>{const m=i.exact?route.path===i.to:route.path===i.to||route.path.startsWith(i.to+'/');const x=(i.exclude||[]).some((e:string)=>route.path===e||route.path.startsWith(e+'/'));return m&&!x};
const groupActive=(g:any)=>g.items.some(itemActive);
const topLink=(path:string,exact=false)=>['rounded-lg px-3 py-2 text-sm font-bold transition',((exact?route.path===path:route.path.startsWith(path))?'bg-blue-600 text-white':'text-slate-700 hover:bg-slate-100')];
watch(()=>route.fullPath,()=>openGroup.value=null);
onMounted(()=>document.addEventListener('click',()=>openGroup.value=null));
</script>
