<template>
  <div class="flex h-full flex-col text-slate-300">
    <div class="border-b border-slate-800/90 px-4 py-4">
      <NuxtLink to="/admin" class="flex items-center gap-3 rounded-xl px-2 py-1" @click="nav">
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
      <NuxtLink to="/admin" :class="linkClass('/admin', true)" @click="nav">Dashboard</NuxtLink>

      <NavGroup
        v-for="group in visibleGroups"
        :key="group.key"
        :title="group.title"
        :open="openGroup === group.key"
        :active="groupActive(group)"
        @toggle="toggleGroup(group.key)"
      >
        <template v-for="entry in group.entries" :key="entryKey(entry)">
          <NuxtLink
            v-if="entry.type === 'item'"
            :to="entry.to"
            :class="linkClass(entry.to, entry.exact, entry.exclude)"
            @click="nav"
          >
            {{ entry.label }}
          </NuxtLink>

          <NavSubGroup
            v-else
            :title="entry.label"
            :open="isSubOpen(group.key, entry.key)"
            :active="subGroupActive(entry)"
            @toggle="toggleSubGroup(group.key, entry.key)"
          >
            <NuxtLink
              v-for="item in entry.items"
              :key="item.to"
              :to="item.to"
              :class="linkClass(item.to, item.exact, item.exclude)"
              @click="nav"
            >
              {{ item.label }}
            </NuxtLink>
          </NavSubGroup>
        </template>
      </NavGroup>
    </nav>

    <div class="border-t border-slate-800 p-3">
      <div v-if="securityGroup?.name && !isSuperAdmin" class="mb-2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-400">
        Group: <span class="font-bold text-slate-200">{{ securityGroup.name }}</span>
      </div>
      <button type="button" class="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white" @click="backToStore">
        ← Back to Store
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, watch } from "vue";

const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const { isSuperAdmin, adminPermissions, securityGroup } = useAdminFetch();

const can = (key: string) => isSuperAdmin.value || adminPermissions.value?.[key] === true;

const item = (label: string, to: string, permission: string, options: any = {}) => ({
  type: "item",
  label,
  to,
  permission,
  ...options,
});

const sub = (key: string, label: string, items: any[]) => ({
  type: "subgroup",
  key,
  label,
  items,
});

const groups = computed(() => [
  {
    key: "sales",
    title: "Sales",
    entries: [
      item("Orders", "/admin/orders", "sales.orders.view"),
      sub("quotes", "Quotes", [
        item("Manual Quotes", "/admin/manual-quotes", "sales.quotes.view"),
        item("Quote Requests", "/admin/quotes", "sales.quote_requests"),
      ]),
      item("Customers", "/admin/customers", "sales.customers.view"),
      item("Invoices", "/admin/accounting/invoices", "accounting.invoices"),
    ],
  },
  {
    key: "inventory",
    title: "Inventory",
    entries: [
      item("Products", "/admin/products", "product.view", { exact: true }),
      item("Categories", "/admin/categories", "product.categories"),
      item("Inventory Control", "/admin/products/inventory-control", "product.stock"),
      item("Stocktake", "/admin/products/stocktake", "product.stocktake"),
      item("Reorder Centre", "/admin/products/reorder-centre", "product.reorder"),
      sub("more", "More", [
        item("Bulk Stock Levels", "/admin/products/stock-levels", "product.stock"),
        item("Stock Intelligence", "/admin/purchasing/stock-intelligence", "purchase.stock_intelligence"),
        item("Inventory & COGS", "/admin/purchasing/inventory", "purchase.inventory"),
        item("Data Health", "/admin/products/data-health", "product.data_health"),
        item("Back in Stock", "/admin/back-in-stock", "product.back_in_stock"),
      ]),
    ],
  },
  {
    key: "purchasing",
    title: "Purchasing",
    entries: [
      item("Purchase Orders", "/admin/purchasing/purchase-orders", "purchase.orders.view", { exclude: ["/admin/purchasing/purchase-orders/receive-stock"] }),
      item("Receive Stock", "/admin/purchasing/purchase-orders/receive-stock", "purchase.receive_stock"),
      item("Suppliers", "/admin/purchasing/suppliers", "purchase.suppliers.view"),
    ],
  },
  {
    key: "accounting",
    title: "Accounting",
    entries: [
      item("Accounting Dashboard", "/admin/accounting", "accounting.dashboard", { exact: true }),
      item("Accounts Receivable", "/admin/accounting/receivables", "accounting.receivables"),
      item("Accounts Payable", "/admin/accounting/payables", "accounting.payables"),
      item("Supplier Bills", "/admin/purchasing/suppliers/bills", "purchase.supplier_bills"),
      sub("banking", "Banking", [
        item("Bank Reconciliation", "/admin/accounting/bank-reconciliation", "accounting.bank_reconciliation"),
        item("Cash Flow", "/admin/accounting/cash-flow", "accounting.cash_flow"),
      ]),
      sub("ledger", "General Ledger", [
        item("Chart of Accounts", "/admin/accounting/accounts", "accounting.accounts"),
        item("General Journals", "/admin/accounting/journals", "accounting.journals"),
      ]),
      sub("reporting", "Reporting", [
        item("Financial Statements", "/admin/accounting/financial-statements", "accounting.financial_statements"),
        item("Accounting Reports", "/admin/accounting/reports", "accounting.reports"),
        item("Profitability", "/admin/accounting/profitability", "accounting.reports"),
        item("ATO Income", "/admin/accounting/ato-income", "accounting.reports"),
        item("Management Report", "/admin/accounting/management-report", "accounting.reports"),
      ]),
      sub("period", "Period Management", [
        item("Period Close", "/admin/accounting/period-close", "accounting.period_close"),
        item("Year End Export", "/admin/accounting/year-end-export", "accounting.year_end"),
      ]),
    ],
  },
  {
    key: "store",
    title: "Store",
    entries: [
      item("Advertisements", "/admin/ads", "business.ads"),
      item("Freight & Pickup", "/admin/freight", "business.freight"),
      item("Pricing Levels", "/admin/pricing-levels", "business.pricing_levels"),
      item("Product Reviews", "/admin/reviews", "product.reviews"),
      item("Abandoned Carts", "/admin/abandoned-carts", "business.abandoned_carts"),
      item("Live Chat", "/admin/chat", "administration.chat"),
    ],
  },
  {
    key: "marketing",
    title: "Marketing",
    entries: [
      item("Marketing & SEO", "/admin/marketing-seo", "business.marketing_seo"),
      item("Analytics", "/admin/analytics", "business.analytics"),
      item("Business Reports", "/admin/reports", "business.reports"),
      item("Google Shopping", "/admin/google-shopping", "business.google_shopping"),
      item("Google Performance", "/admin/google-performance", "business.google_performance"),
      item("Google Search", "/admin/google-search", "business.google_search"),
      item("Facebook Share", "/admin/facebook-share", "business.facebook"),
      sub("setup", "Setup", [
        item("Google API Setup", "/admin/google-merchant-registration", "business.google_api"),
      ]),
    ],
  },
  {
    key: "system",
    title: "System",
    entries: [
      item("Admin Accounts", "/admin/accounts", "administration.admin_accounts"),
      item("Security Groups", "/admin/security-groups", "administration.security_groups"),
      item("Security Centre", "/admin/security", "administration.security_centre"),
      item("Storage Cleanup", "/admin/storage-cleanup", "administration.storage_cleanup"),
    ],
  },
]);

const superOnly = [
  "/admin/products/data-health",
  "/admin/quotes",
  "/admin/accounts",
  "/admin/security-groups",
  "/admin/security",
  "/admin/storage-cleanup",
  "/admin/pricing-levels",
  "/admin/reports",
  "/admin/marketing-seo",
  "/admin/google-shopping",
  "/admin/google-performance",
  "/admin/google-search",
  "/admin/google-merchant-registration",
];

const itemVisible = (entry: any) => {
  if (superOnly.includes(entry.to) && !isSuperAdmin.value) return false;
  return can(entry.permission);
};

const visibleGroups = computed(() =>
  groups.value
    .map((group: any) => {
      const entries = group.entries
        .map((entry: any) => {
          if (entry.type === "item") return itemVisible(entry) ? entry : null;
          const items = entry.items.filter(itemVisible);
          return items.length ? { ...entry, items } : null;
        })
        .filter(Boolean);
      return { ...group, entries };
    })
    .filter((group: any) => group.entries.length > 0),
);

const openGroup = ref<string | null>(null);
const openSubGroups = ref<Record<string, boolean>>({});

const allItems = (group: any) => group.entries.flatMap((entry: any) => entry.type === "item" ? [entry] : entry.items);
const matchesItem = (entry: any) => {
  const matched = entry.exact ? route.path === entry.to : route.path === entry.to || route.path.startsWith(entry.to + "/");
  const excluded = (entry.exclude || []).some((path: string) => route.path === path || route.path.startsWith(path + "/"));
  return matched && !excluded;
};
const groupActive = (group: any) => allItems(group).some(matchesItem);
const subGroupActive = (group: any) => group.items.some(matchesItem);
const entryKey = (entry: any) => entry.type === "item" ? entry.to : entry.key;

const syncOpenNavigation = () => {
  const group = visibleGroups.value.find(groupActive);
  if (!group) return;
  openGroup.value = group.key;
  for (const entry of group.entries) {
    if (entry.type === "subgroup" && subGroupActive(entry)) {
      openSubGroups.value[`${group.key}:${entry.key}`] = true;
    }
  }
};

watch(() => route.path, syncOpenNavigation, { immediate: true });
watch(visibleGroups, syncOpenNavigation);

const toggleGroup = (key: string) => {
  openGroup.value = openGroup.value === key ? null : key;
};
const subKey = (groupKey: string, key: string) => `${groupKey}:${key}`;
const isSubOpen = (groupKey: string, key: string) => openSubGroups.value[subKey(groupKey, key)] === true;
const toggleSubGroup = (groupKey: string, key: string) => {
  const k = subKey(groupKey, key);
  openSubGroups.value[k] = !openSubGroups.value[k];
};

const linkClass = (path: string, exact = false, exclude: string[] = []) => {
  const matched = exact ? route.path === path : route.path === path || route.path.startsWith(path + "/");
  const excluded = exclude.some(path => route.path === path || route.path.startsWith(path + "/"));
  return [
    "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
    matched && !excluded
      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
      : "text-slate-300 hover:bg-slate-800/90 hover:text-white",
  ];
};

const nav = () => emit("navigate");
const backToStore = () => {
  emit("navigate");
  if (import.meta.client) window.location.assign("/");
};

const NavGroup = defineComponent({
  props: { title: { type: String, required: true }, open: Boolean, active: Boolean },
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
      }, [
        h("span", props.title),
        h("span", { class: ["text-base transition-transform", props.open ? "rotate-90" : ""] }, "›"),
      ]),
      h("div", { class: ["ml-2 border-l border-slate-800 pl-2", props.open ? "block" : "hidden"] }, slots.default?.()),
    ]);
  },
});

const NavSubGroup = defineComponent({
  props: { title: { type: String, required: true }, open: Boolean, active: Boolean },
  emits: ["toggle"],
  setup(props, { slots, emit }) {
    return () => h("div", { class: "mb-1" }, [
      h("button", {
        type: "button",
        class: [
          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all",
          props.active ? "bg-slate-800/90 text-blue-300" : "text-slate-400 hover:bg-slate-800/70 hover:text-white",
        ],
        onClick: () => emit("toggle"),
      }, [
        h("span", props.title),
        h("span", { class: ["text-sm transition-transform", props.open ? "rotate-90" : ""] }, "›"),
      ]),
      h("div", { class: ["ml-3 border-l border-slate-700/80 pl-2 pt-1", props.open ? "block" : "hidden"] }, slots.default?.()),
    ]);
  },
});
</script>
