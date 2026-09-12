<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Mobile top bar -->
    <header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
      <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700" aria-label="Open admin navigation" @click="mobileOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <NuxtLink to="/admin" class="font-bold text-slate-900">Kialla Computers <span class="text-blue-600">Admin</span></NuxtLink>
      <NuxtLink to="/" class="text-sm font-semibold text-blue-600">Store</NuxtLink>
    </header>

    <div v-if="mobileOpen" class="fixed inset-0 z-50 lg:hidden">
      <button class="absolute inset-0 bg-slate-950/40" aria-label="Close admin navigation" @click="mobileOpen = false" />
      <aside class="relative h-full w-[290px] max-w-[85vw] bg-slate-950 shadow-2xl">
        <AdminSidebar @navigate="mobileOpen = false" />
      </aside>
    </div>

    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-950 lg:block">
      <AdminSidebar />
    </aside>

    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur lg:flex">
        <div>
          <p class="text-sm font-semibold text-slate-900">{{ pageTitle }}</p>
          <p class="text-xs text-slate-500">{{ breadcrumb }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="adminRole" class="rounded-full px-2.5 py-1 text-xs font-bold" :class="isSuperAdmin ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'">
            {{ isSuperAdmin ? "SuperAdmin" : "Admin" }}
          </span>
          <NuxtLink to="/" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">View Store</NuxtLink>
        </div>
      </header>
      <main class="min-h-[calc(100vh-4rem)]">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const mobileOpen = ref(false);
const { adminRole, isSuperAdmin } = useAdminFetch();

watch(() => route.fullPath, () => { mobileOpen.value = false; });

const titleMap: Record<string, string> = {
  products: "Products", categories: "Categories", orders: "Orders", quotes: "Quotes",
  inventory: "Inventory", freight: "Freight & Pickup", ads: "Advertisements",
  analytics: "Traffic Analytics", reports: "Business Reports", accounts: "Accounts",
  "pricing-levels": "Pricing Levels", "storage-cleanup": "Storage Cleanup",
  "back-in-stock": "Back in Stock", "facebook-share": "Facebook Product Share",
};

const pageTitle = computed(() => {
  const parts = route.path.split("/").filter(Boolean);
  if (parts.length === 1) return "Dashboard";
  return titleMap[parts[1]] || "Administration";
});
const breadcrumb = computed(() => {
  const parts = route.path.split("/").filter(Boolean).slice(1);
  if (!parts.length) return "Admin";
  return ["Admin", ...parts.map(p => titleMap[p] || (p === "new" ? "New" : p.length > 20 ? "Detail" : p.replaceAll("-", " ").replace(/\b\w/g, c => c.toUpperCase())))].join(" › ");
});
</script>
