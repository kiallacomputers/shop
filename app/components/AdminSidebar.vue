<template>
  <div class="flex h-full flex-col text-slate-300">
    <div class="border-b border-slate-800/90 px-4 py-4">
      <NuxtLink to="/admin" class="flex items-center gap-3 rounded-xl px-2 py-1" @click="$emit('navigate')">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
          <img src="/kialla-computers-logo.png" alt="Kialla Computers" class="h-full w-full object-contain" />
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-black text-white">Kialla Computers</p>
          <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-400">Administration</p>
        </div>
      </NuxtLink>
    </div>

    <nav class="admin-sidebar-nav flex-1 overflow-y-auto px-3 py-4">
      <NuxtLink to="/admin" :class="linkClass('/admin', true)" @click="$emit('navigate')">
        <NavIcon path="M3 12 12 3l9 9M5 10v10h14V10M9 20v-6h6v6" /> Dashboard
      </NuxtLink>

      <NavGroup title="Store" group-key="store" :active="groupActive('store')" :open="openGroup === 'store'" @toggle="toggleGroup('store')">
        <NuxtLink to="/admin/products" :class="linkClass('/admin/products')" @click="$emit('navigate')"><NavIcon path="M3 6h18M6 6v14h12V6M9 10h6"/>Products</NuxtLink>
        <NuxtLink to="/admin/categories" :class="linkClass('/admin/categories')" @click="$emit('navigate')"><NavIcon path="M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v4H4v-4Zm10 0h6v4h-6v-4Z"/>Categories</NuxtLink>
        <NuxtLink to="/admin/ads" :class="linkClass('/admin/ads')" @click="$emit('navigate')"><NavIcon path="M3 5h18v14H3V5Zm4 10 3-3 2 2 3-4 3 5"/>Advertisements</NuxtLink>
        <NuxtLink to="/admin/reviews" :class="linkClass('/admin/reviews')" @click="$emit('navigate')"><NavIcon path="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>Product Reviews</NuxtLink>
        <NuxtLink to="/admin/back-in-stock" :class="linkClass('/admin/back-in-stock')" @click="$emit('navigate')"><NavIcon path="M12 3v12m0 0-4-4m4 4 4-4M5 20h14"/>Back in Stock</NuxtLink>
      </NavGroup>

      <NavGroup title="Sales" group-key="sales" :active="groupActive('sales')" :open="openGroup === 'sales'" @toggle="toggleGroup('sales')">
        <NuxtLink to="/admin/orders" :class="linkClass('/admin/orders')" @click="$emit('navigate')"><NavIcon path="M3 7h18l-2 13H5L3 7Zm4 0 2-3h6l2 3"/>Orders</NuxtLink>
        <NuxtLink to="/admin/manual-quotes" :class="linkClass('/admin/manual-quotes')" @click="$emit('navigate')"><NavIcon path="M6 3h9l3 3v15H6V3Zm3 7h6m-6 4h6"/>Manual Quotes</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/quotes" :class="linkClass('/admin/quotes')" @click="$emit('navigate')"><NavIcon path="M6 3h9l3 3v15H6V3Zm3 7h6m-6 4h6"/>Quote Requests</NuxtLink>
        <NuxtLink to="/admin/customers" :class="linkClass('/admin/customers')" @click="$emit('navigate')"><NavIcon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>Customers</NuxtLink>
        <NuxtLink to="/admin/freight" :class="linkClass('/admin/freight')" @click="$emit('navigate')"><NavIcon path="M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>Freight & Pickup</NuxtLink>
      </NavGroup>

      <NavGroup title="Purchasing" group-key="purchasing" :active="groupActive('purchasing')" :open="openGroup === 'purchasing'" @toggle="toggleGroup('purchasing')">
        <NuxtLink to="/admin/accounting/purchases" :class="linkClass('/admin/accounting/purchases')" @click="$emit('navigate')"><NavIcon path="M4 4h16v16H4V4Zm4 4h8M8 12h8M8 16h5"/>Suppliers & Purchase Orders</NuxtLink>
        <NuxtLink to="/admin/accounting/purchases#purchase-orders" :class="linkClass('/admin/accounting/purchases')" @click="$emit('navigate')"><NavIcon path="M3 7h18l-2 13H5L3 7Zm4 0 2-3h6l2 3"/>Purchase Orders</NuxtLink>
        <NuxtLink to="/admin/accounting/purchases#purchase-orders" :class="linkClass('/admin/accounting/purchases')" @click="$emit('navigate')"><NavIcon path="M12 3v12m0 0-4-4m4 4 4-4M5 20h14"/>Stock Receiving</NuxtLink>
        <NuxtLink to="/admin/accounting/payables" :class="linkClass('/admin/accounting/payables')" @click="$emit('navigate')"><NavIcon path="M6 3h9l3 3v15H6V3Zm3 7h6m-6 4h6"/>Accounts Payable</NuxtLink>
        <NuxtLink to="/admin/accounting/inventory" :class="linkClass('/admin/accounting/inventory')" @click="$emit('navigate')"><NavIcon path="M4 7h16M5 7l1 13h12l1-13M9 11v5m6-5v5"/>Inventory & COGS</NuxtLink>
        <NuxtLink to="/admin/accounting/stock-intelligence" :class="linkClass('/admin/accounting/stock-intelligence')" @click="$emit('navigate')"><NavIcon path="M4 19V9m6 10V5m6 14v-7m4 7H2"/>Stock Intelligence</NuxtLink>
      </NavGroup>

      <NavGroup title="Business" group-key="business" :active="groupActive('business')" :open="openGroup === 'business'" @toggle="toggleGroup('business')">
        <NuxtLink v-if="isSuperAdmin" to="/admin/accounting" :class="linkClass('/admin/accounting')" @click="$emit('navigate')"><NavIcon path="M4 5h16v14H4V5Zm4 4h8M8 13h3m2 0h3M8 17h3m2 0h3"/>Accounting</NuxtLink>
        <NuxtLink to="/admin/analytics" :class="linkClass('/admin/analytics')" @click="$emit('navigate')"><NavIcon path="M4 19V9m6 10V5m6 14v-7m4 7H2"/>Analytics</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/reports" :class="linkClass('/admin/reports')" @click="$emit('navigate')"><NavIcon path="M4 19V5h16v14H4Zm4-4 3-3 2 2 3-4"/>Reports</NuxtLink>
        <NuxtLink to="/admin/facebook-share" :class="linkClass('/admin/facebook-share')" @click="$emit('navigate')"><NavIcon path="M13 22v-8h3l1-4h-4V8c0-1 .5-2 2-2h2V2h-3c-3 0-5 2-5 5v3H6v4h3v8"/>Facebook Share</NuxtLink>
      </NavGroup>

      <NavGroup title="Administration" group-key="administration" :active="groupActive('administration')" :open="openGroup === 'administration'" @toggle="toggleGroup('administration')">
        <NuxtLink to="/admin/chat" :class="linkClass('/admin/chat')" @click="$emit('navigate')"><NavIcon path="M21 12a8 8 0 0 1-8 8H6l-4 2 1.3-4A8 8 0 1 1 21 12ZM8 10h8M8 14h5"/>Live Chat</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/accounts" :class="linkClass('/admin/accounts')" @click="$emit('navigate')"><NavIcon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>Accounts</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/pricing-levels" :class="linkClass('/admin/pricing-levels')" @click="$emit('navigate')"><NavIcon path="M12 3v18M7 7c0-2 2-3 5-3s5 1 5 3-2 3-5 3-5 1-5 3 2 3 5 3 5-1 5-3"/>Pricing Levels</NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/admin/storage-cleanup" :class="linkClass('/admin/storage-cleanup')" @click="$emit('navigate')"><NavIcon path="M4 7h16M9 11v5m6-5v5M8 7l1-3h6l1 3M6 7l1 13h10l1-13"/>Storage Cleanup</NuxtLink>
      </NavGroup>
    </nav>

    <div class="border-t border-slate-800 p-3">
      <button type="button" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white" @click="backToStore">
        <NavIcon path="M10 17l-5-5 5-5M5 12h14" /> Back to Store
      </button>
      <div v-if="adminRole" class="mt-2 px-3 py-2 text-xs text-slate-500">
        Signed in as <span class="font-semibold text-slate-300">{{ isSuperAdmin ? "SuperAdmin" : "Admin" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, watch } from "vue";
const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const { isSuperAdmin, adminRole } = useAdminFetch();

const groupRoutes: Record<string, string[]> = {
  store: ["/admin/products", "/admin/categories", "/admin/ads", "/admin/reviews", "/admin/back-in-stock"],
  sales: ["/admin/orders", "/admin/manual-quotes", "/admin/quotes", "/admin/customers", "/admin/freight"],
  purchasing: ["/admin/accounting/purchases", "/admin/accounting/payables", "/admin/accounting/inventory", "/admin/accounting/stock-intelligence"],
  business: ["/admin/accounting", "/admin/analytics", "/admin/reports", "/admin/facebook-share"],
  administration: ["/admin/chat", "/admin/accounts", "/admin/pricing-levels", "/admin/storage-cleanup"],
};
const groupActive = (key: string) => groupRoutes[key]?.some((path) => route.path.startsWith(path)) ?? false;
const activeGroupForRoute = () => Object.keys(groupRoutes).find((key) => groupActive(key)) ?? null;
const openGroup = ref<string | null>(activeGroupForRoute());

const toggleGroup = (key: string) => {
  openGroup.value = openGroup.value === key ? null : key;
};

watch(() => route.path, () => {
  const active = activeGroupForRoute();
  if (active) openGroup.value = active;
});

const backToStore = () => {
  emit("navigate");
  if (import.meta.client) window.location.assign("/");
};

const linkClass = (path: string, exact = false) => {
  const active = exact ? route.path === path : route.path.startsWith(path);
  return [
    "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
    active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-slate-800/90 hover:text-white",
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
  props: {
    title: { type: String, required: true },
    groupKey: { type: String, required: true },
    active: { type: Boolean, default: false },
    open: { type: Boolean, default: false },
  },
  emits: ["toggle"],
  setup(props, { slots, emit }) {
    return () => h("div", { class: "mt-2" }, [
      h("button", {
        type: "button",
        class: [
          "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.12em] transition",
          props.active ? "bg-slate-800 text-blue-300" : "text-slate-500 hover:bg-slate-800/70 hover:text-slate-300",
        ],
        onClick: () => emit("toggle"),
        "aria-expanded": String(props.open),
      }, [
        h("span", props.title),
        h("svg", { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", "stroke-width": "2", class: ["h-4 w-4 transition-transform", props.open ? "rotate-90" : ""] }, [
          h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d: "m7 5 5 5-5 5" }),
        ]),
      ]),
      h("div", { class: ["overflow-hidden transition-all", props.open ? "block" : "hidden"] }, slots.default?.()),
    ]);
  },
});
</script>
