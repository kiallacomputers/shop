<template>
  <div class="admin-shell min-h-screen bg-slate-100">
    <header class="admin-mobile-bar sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
      <button type="button" class="admin-top-icon" aria-label="Open admin navigation" @click="mobileOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-black text-slate-900">{{ pageTitle }}</p>
        <p class="truncate text-[11px] font-medium text-slate-500">Kialla Computers Admin</p>
      </div>
      <NuxtLink to="/" class="admin-top-icon" aria-label="View store">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9 20v-6h6v6"/></svg>
      </NuxtLink>
    </header>

    <Transition name="admin-drawer">
      <div v-if="mobileOpen" class="fixed inset-0 z-50 lg:hidden">
        <button class="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]" aria-label="Close admin navigation" @click="mobileOpen = false" />
        <aside class="relative h-full w-[300px] max-w-[88vw] bg-slate-950 shadow-2xl"><AdminSidebar @navigate="mobileOpen = false" /></aside>
      </div>
    </Transition>

    <div>
      <header class="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl lg:block">
        <div class="flex h-[72px] items-center gap-5 px-6">
          <NuxtLink to="/admin" class="flex shrink-0 items-center gap-2.5">
            <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5"><img src="/kialla-computers-logo.png" alt="Kialla Computers" class="h-full w-full object-contain" /></div>
            <div class="hidden xl:block"><p class="text-sm font-black text-slate-900">Kialla Computers</p><p class="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">Administration</p></div>
          </NuxtLink>
          <div class="min-w-0 flex-1"><AdminTopNav /></div>
          <div class="flex shrink-0 items-center gap-2.5">
            <span v-if="adminRole" class="rounded-full border px-3 py-1.5 text-xs font-black" :class="isSuperAdmin ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-blue-700'">{{ isSuperAdmin ? 'SuperAdmin' : 'Admin' }}</span>
            <NuxtLink to="/" class="admin-btn-secondary !min-h-[38px]">View Store</NuxtLink>
          </div>
        </div>
        <div class="flex h-[48px] items-center border-t border-slate-100 px-6">
          <div class="min-w-0">
            <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <NuxtLink to="/admin" class="hover:text-blue-600">Admin</NuxtLink>
              <template v-for="crumb in breadcrumbs" :key="crumb.label"><span>/</span><NuxtLink v-if="crumb.to" :to="crumb.to" class="hover:text-blue-600">{{crumb.label}}</NuxtLink><span v-else class="text-slate-500">{{crumb.label}}</span></template>
            </div>
            <h1 class="text-base font-black text-slate-900">{{pageTitle}}</h1>
          </div>
        </div>
      </header>

      <main class="admin-content min-h-[calc(100vh-72px)]"><slot /></main>
    </div>

    <AdminSessionTimeout />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const mobileOpen = ref(false);
const { adminRole, isSuperAdmin } = useAdminFetch();
watch(() => route.fullPath, () => { mobileOpen.value = false; });

const names: Record<string,string> = {
  products:'Products', categories:'Categories', inventory:'Inventory', ads:'Advertisements', reviews:'Product Reviews', 'back-in-stock':'Back in Stock',
  orders:'Orders', 'manual-quotes':'Manual Quotes', quotes:'Quote Requests', customers:'Customers', freight:'Freight & Pickup',
  accounting:'Accounting', 'abandoned-carts':'Abandoned Carts', analytics:'Analytics', reports:'Reports', 'facebook-share':'Facebook Share', chat:'Live Chat', accounts:'Accounts',
  'pricing-levels':'Pricing Levels', 'security-groups':'Security Groups', 'storage-cleanup':'Storage Cleanup', purchases:'Suppliers & Purchases', receivables:'Accounts Receivable', payables:'Accounts Payable',
  'bank-reconciliation':'Bank Reconciliation', 'gst-bas':'GST & BAS', 'financial-statements':'Financial Statements', 'period-close':'Period Close', 'year-end-export':'Accountant Export',
  'cash-flow':'Cash Flow & Forecasting', profitability:'Sales & Profitability', 'stock-intelligence':'Purchasing & Stock Intelligence', 'management-report':'Business Management Report',
  'accounting-health':'Accounting Health', 'google-shopping':'Google Shopping', 'google-performance':'Google Performance', 'google-search':'Google Search', 'google-merchant-registration':'Google API Setup', invoices:'Sales & Invoices', 'chart-of-accounts':'Chart of Accounts', journal:'General Journal', new:'New', edit:'Edit'
};
const prettify = (s:string) => names[s] || (s.length > 22 ? 'Detail' : s.replaceAll('-', ' ').replace(/\b\w/g,c=>c.toUpperCase()));
const pathParts = computed(() => route.path.split('/').filter(Boolean).slice(1));
const pageTitle = computed(() => pathParts.value.length ? prettify(pathParts.value[pathParts.value.length - 1]) : 'Dashboard');
const breadcrumbs = computed(() => {
  const parts = pathParts.value;
  return parts.map((p,i) => ({ label: prettify(p), to: i < parts.length - 1 ? '/admin/' + parts.slice(0,i+1).join('/') : undefined }));
});
</script>
