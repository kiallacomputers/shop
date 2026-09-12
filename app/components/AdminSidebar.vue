<template>
  <div class="flex h-full flex-col text-slate-300">
    <div class="flex h-16 items-center border-b border-slate-800 px-5">
      <NuxtLink to="/admin" class="text-base font-bold text-white" @click="$emit('navigate')">
        Kialla Computers <span class="text-blue-400">Admin</span>
      </NuxtLink>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <NuxtLink to="/admin" :class="linkClass('/admin', true)" @click="$emit('navigate')">
        <NavIcon path="M3 12 12 3l9 9M5 10v10h14V10M9 20v-6h6v6" /> Dashboard
      </NuxtLink>

      <NavGroup title="Store">
        <NuxtLink to="/admin/products" :class="linkClass('/admin/products')" @click="$emit('navigate')"><NavIcon path="M3 6h18M6 6v14h12V6M9 10h6"/>Products</NuxtLink>
        <NuxtLink to="/admin/categories" :class="linkClass('/admin/categories')" @click="$emit('navigate')"><NavIcon path="M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v4H4v-4Zm10 0h6v4h-6v-4Z"/>Categories</NuxtLink>
        <NuxtLink to="/admin/ads" :class="linkClass('/admin/ads')" @click="$emit('navigate')"><NavIcon path="M3 5h18v14H3V5Zm4 10 3-3 2 2 3-4 3 5"/>Advertisements</NuxtLink>
      </NavGroup>

      <NavGroup title="Orders">
        <NuxtLink to="/admin/orders" :class="linkClass('/admin/orders')" @click="$emit('navigate')"><NavIcon path="M3 7h18l-2 13H5L3 7Zm4 0 2-3h6l2 3"/>Orders</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/quotes" :class="linkClass('/admin/quotes')" @click="$emit('navigate')"><NavIcon path="M6 3h9l3 3v15H6V3Zm3 7h6m-6 4h6"/>Quotes</NuxtLink>
        <NuxtLink to="/admin/back-in-stock" :class="linkClass('/admin/back-in-stock')" @click="$emit('navigate')"><NavIcon path="M12 3v12m0 0-4-4m4 4 4-4M5 20h14"/>Back in Stock</NuxtLink>
      </NavGroup>

      <NavGroup title="Stock & Delivery">
        <NuxtLink to="/admin/inventory" :class="linkClass('/admin/inventory')" @click="$emit('navigate')"><NavIcon path="M4 7h16M5 7l1 13h12l1-13M9 11v5m6-5v5"/>Inventory</NuxtLink>
        <NuxtLink to="/admin/freight" :class="linkClass('/admin/freight')" @click="$emit('navigate')"><NavIcon path="M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>Freight & Pickup</NuxtLink>
      </NavGroup>

      <NavGroup title="Business">
        <NuxtLink to="/admin/analytics" :class="linkClass('/admin/analytics')" @click="$emit('navigate')"><NavIcon path="M4 19V9m6 10V5m6 14v-7m4 7H2"/>Analytics</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/reports" :class="linkClass('/admin/reports')" @click="$emit('navigate')"><NavIcon path="M4 19V5h16v14H4Zm4-4 3-3 2 2 3-4"/>Reports</NuxtLink>
        <NuxtLink to="/admin/facebook-share" :class="linkClass('/admin/facebook-share')" @click="$emit('navigate')"><NavIcon path="M13 22v-8h3l1-4h-4V8c0-1 .5-2 2-2h2V2h-3c-3 0-5 2-5 5v3H6v4h3v8"/>Facebook Share</NuxtLink>
      </NavGroup>

      <NavGroup title="Tools">
        <NuxtLink v-if="isSuperAdmin" to="/admin/storage-cleanup" :class="linkClass('/admin/storage-cleanup')" @click="$emit('navigate')"><NavIcon path="M4 7h16M9 11v5m6-5v5M8 7l1-3h6l1 3M6 7l1 13h10l1-13"/>Storage Cleanup</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/pricing-levels" :class="linkClass('/admin/pricing-levels')" @click="$emit('navigate')"><NavIcon path="M12 3v18M7 7c0-2 2-3 5-3s5 1 5 3-2 3-5 3-5 1-5 3 2 3 5 3 5-1 5-3"/>Pricing Levels</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/accounts" :class="linkClass('/admin/accounts')" @click="$emit('navigate')"><NavIcon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>Accounts</NuxtLink>
      </NavGroup>
    </nav>

    <div class="border-t border-slate-800 p-3">
      <NuxtLink to="/" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white">
        <NavIcon path="M10 17l-5-5 5-5M5 12h14" /> Back to Store
      </NuxtLink>
      <div v-if="adminRole" class="mt-2 px-3 py-2 text-xs text-slate-500">
        Signed in as <span class="font-semibold text-slate-300">{{ isSuperAdmin ? "SuperAdmin" : "Admin" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";
defineEmits<{ navigate: [] }>();
const route = useRoute();
const { isSuperAdmin, adminRole } = useAdminFetch();

const linkClass = (path: string, exact = false) => {
  const active = exact ? route.path === path : route.path.startsWith(path);
  return [
    "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
    active ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white",
  ];
};

const NavIcon = defineComponent({
  props: { path: { type: String, required: true } },
  setup(props) {
    return () => h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", class: "h-4 w-4 shrink-0", "aria-hidden": "true" },
      [h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d: props.path })]);
  },
});
const NavGroup = defineComponent({
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h("div", { class: "mt-5" }, [
      h("p", { class: "mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500" }, props.title),
      slots.default?.(),
    ]);
  },
});
</script>
