<template>
  <main class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">Administration</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Business Dashboard</h1>
        <p class="mt-2 text-slate-500">Sales, orders, inventory and customer activity at a glance.</p>
      </div>

      <div class="flex items-center gap-3">
        <span
          v-if="adminRole"
          class="rounded-full px-3 py-1.5 text-xs font-bold"
          :class="isSuperAdmin ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'"
        >
          {{ isSuperAdmin ? "SuperAdmin" : "Admin" }}
        </span>
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          @click="loadDashboard"
        >
          <svg :class="['h-4 w-4', loading ? 'animate-spin' : '']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      {{ errorMessage }}
    </div>

    <div v-if="loading && !dashboard" class="space-y-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="item in 4" :key="item" class="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
      <div class="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>

    <template v-else-if="dashboard">
      <!-- SALES PERIODS -->
      <section class="mb-6">
        <div class="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Sales</h2>
            <p class="text-sm text-slate-500">Revenue from paid and active orders.</p>
          </div>
          <p class="hidden text-xs text-slate-400 sm:block">Updated {{ formatDateTime(dashboard.generated_at) }}</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="period in salesPeriodCards" :key="period.key" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-500">{{ period.label }}</p>
              <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{{ period.orders }} orders</span>
            </div>
            <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">{{ currency(period.revenue) }}</p>
            <p class="mt-2 text-xs text-slate-500">GST component {{ currency(period.gst) }}</p>
          </article>
        </div>
      </section>

      <!-- FINANCIAL / ORDER / INVENTORY SUMMARY -->
      <section class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NuxtLink to="/admin/orders" class="group rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-emerald-800">30-Day Financials</p>
              <p class="mt-2 text-2xl font-bold text-slate-900">{{ currency(dashboard.sales.last30.revenue) }}</p>
            </div>
            <span class="rounded-xl bg-white p-2 text-emerald-700 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></svg>
            </span>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div><p class="text-slate-500">GST</p><p class="mt-1 font-bold text-slate-800">{{ currency(dashboard.sales.last30.gst) }}</p></div>
            <div><p class="text-slate-500">Est. gross profit*</p><p class="mt-1 font-bold text-emerald-700">{{ currency(dashboard.sales.last30.estimatedGrossProfitExGst) }}</p></div>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/orders" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-slate-500">Orders Requiring Action</p>
              <p class="mt-2 text-3xl font-bold text-slate-900">{{ ordersRequiringAction }}</p>
            </div>
            <span class="rounded-xl bg-blue-50 p-2 text-blue-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M5 6l1 14h12l1-14M9 10v6m6-6v6M8 3h8l1 3H7l1-3Z" /></svg>
            </span>
          </div>
          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <span class="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{{ dashboard.orders.newPaid }} new</span>
            <span class="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{{ dashboard.orders.processing }} processing</span>
            <span class="rounded-full bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">{{ dashboard.orders.shipping }} shipping</span>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/inventory" class="group rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm transition hover:border-amber-400 hover:shadow-md">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-amber-800">Inventory Attention</p>
              <p class="mt-2 text-3xl font-bold text-slate-900">{{ dashboard.inventory.lowStock + dashboard.inventory.outOfStock }}</p>
            </div>
            <span class="rounded-xl bg-white p-2 text-amber-700 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M5 7l1 13h12l1-13M9 11v5m6-5v5M8 4h8l1 3H7l1-3Z" /></svg>
            </span>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div><p class="text-slate-500">Low stock</p><p class="mt-1 font-bold text-amber-700">{{ dashboard.inventory.lowStock }}</p></div>
            <div><p class="text-slate-500">Out of stock</p><p class="mt-1 font-bold text-red-700">{{ dashboard.inventory.outOfStock }}</p></div>
          </div>
          <p class="mt-3 border-t border-amber-100 pt-3 text-xs text-slate-500">Stock value <strong class="text-slate-800">{{ currency(dashboard.inventory.stockValueExGst) }}</strong> ex GST · {{ dashboard.inventory.waitingCustomers }} waiting customers</p>
        </NuxtLink>

        <NuxtLink v-if="isSuperAdmin" to="/admin/accounts" class="group rounded-2xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm transition hover:border-violet-400 hover:shadow-md">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-violet-800">Customers</p>
              <p class="mt-2 text-3xl font-bold text-slate-900">{{ dashboard.customers.total }}</p>
            </div>
            <span class="rounded-xl bg-white p-2 text-violet-700 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
          </div>
          <p class="mt-4 text-xs text-slate-500"><span class="font-bold text-violet-700">+{{ dashboard.customers.new30d }}</span> new in the last 30 days</p>
        </NuxtLink>

        <div v-else class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-500">Inventory Value</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ currency(dashboard.inventory.stockValueExGst) }}</p>
          <p class="mt-4 text-xs text-slate-500">{{ number(dashboard.inventory.stockUnits) }} units on hand · ex GST cost value</p>
        </div>
      </section>

      <!-- CHART + STATUS -->
      <section class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">30-Day Sales Trend</h2>
              <p class="text-sm text-slate-500">Daily revenue from paid and active orders.</p>
            </div>
            <div class="text-sm text-slate-500">All-time sales <strong class="text-slate-900">{{ currency(dashboard.sales.allTimeRevenue) }}</strong></div>
          </div>

          <div class="overflow-x-auto pb-2">
            <div class="flex h-56 min-w-[680px] items-end gap-1.5 border-b border-slate-200 px-1">
              <div v-for="day in dashboard.sales.chart" :key="day.date" class="group relative flex h-full min-w-0 flex-1 items-end">
                <div
                  class="w-full rounded-t bg-blue-500 transition hover:bg-blue-600"
                  :style="{ height: `${chartHeight(day.revenue)}%` }"
                />
                <div class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
                  {{ shortDate(day.date) }} · {{ currency(day.revenue) }} · {{ day.orders }} order{{ day.orders === 1 ? '' : 's' }}
                </div>
              </div>
            </div>
            <div class="mt-2 flex min-w-[680px] justify-between text-[10px] text-slate-400">
              <span>{{ shortDate(dashboard.sales.chart[0]?.date) }}</span>
              <span>{{ shortDate(dashboard.sales.chart[14]?.date) }}</span>
              <span>{{ shortDate(dashboard.sales.chart[29]?.date) }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-lg font-bold text-slate-900">Order Status</h2>
            <p class="text-sm text-slate-500">Current workflow position.</p>
          </div>
          <div class="space-y-3 p-5">
            <StatusRow label="New / Paid" :value="dashboard.orders.newPaid" tone="blue" />
            <StatusRow label="Processing" :value="dashboard.orders.processing" tone="amber" />
            <StatusRow label="Shipping" :value="dashboard.orders.shipping" tone="violet" />
            <StatusRow label="Delivered" :value="dashboard.orders.delivered" tone="green" />
            <StatusRow label="Back-order stock risk" :value="dashboard.orders.backorderRisk" tone="red" />
          </div>
          <div class="border-t border-slate-100 px-5 py-4">
            <NuxtLink to="/admin/orders" class="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage orders →</NuxtLink>
          </div>
        </div>
      </section>

      <!-- OPERATIONAL LISTS -->
      <section class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Recent Orders</h2>
              <p class="text-sm text-slate-500">Latest customer purchases.</p>
            </div>
            <NuxtLink to="/admin/orders" class="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</NuxtLink>
          </div>

          <div v-if="!dashboard.recentOrders.length" class="p-8 text-center text-slate-500">No orders have been placed yet.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th class="px-5 py-3">Order</th><th class="px-5 py-3">Customer</th><th class="px-5 py-3">Status</th><th class="px-5 py-3 text-right">Total</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="order in dashboard.recentOrders" :key="order.id" class="hover:bg-slate-50/70">
                  <td class="px-5 py-3.5">
                    <NuxtLink :to="`/admin/orders/${order.id}`" class="font-bold text-slate-900 hover:text-blue-600">#{{ order.id }}</NuxtLink>
                    <p class="mt-0.5 text-xs text-slate-400">{{ formatDate(order.created_at) }}</p>
                  </td>
                  <td class="max-w-[180px] px-5 py-3.5"><p class="truncate font-medium text-slate-800">{{ order.customer_name || "Customer" }}</p><p class="truncate text-xs text-slate-400">{{ order.customer_email || "" }}</p></td>
                  <td class="px-5 py-3.5"><span :class="statusClass(order.status)" class="rounded-full px-2.5 py-1 text-xs font-bold">{{ prettyStatus(order.status) }}</span></td>
                  <td class="px-5 py-3.5 text-right font-bold text-slate-900">{{ currency(order.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Products Needing Attention</h2>
              <p class="text-sm text-slate-500">Low stock, waiting customers and open order demand.</p>
            </div>
            <NuxtLink to="/admin/inventory" class="text-sm font-semibold text-amber-700 hover:text-amber-800">Inventory →</NuxtLink>
          </div>

          <div v-if="!dashboard.inventory.attention.length" class="p-8 text-center text-slate-500">Stock levels look good.</div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="item in dashboard.inventory.attention" :key="`${item.product_id}:${item.variant_id || 'base'}`" class="flex items-center gap-4 px-5 py-3.5">
              <div class="min-w-0 flex-1">
                <NuxtLink :to="item.variant_id ? `/admin/products/${item.product_id}/variants` : `/admin/products/${item.product_id}`" class="block truncate font-semibold text-slate-900 hover:text-blue-600">
                  {{ item.name }}<span v-if="item.variant_name" class="font-normal text-slate-500"> — {{ item.variant_name }}</span>
                </NuxtLink>
                <p v-if="item.code" class="mt-0.5 truncate text-xs text-slate-400">{{ item.code }}</p>
              </div>
              <div class="flex shrink-0 flex-wrap justify-end gap-1.5 text-xs">
                <span :class="item.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'" class="rounded-full px-2.5 py-1 font-bold">{{ item.stock }} stock</span>
                <span v-if="item.waiting_customers" class="rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-700">{{ item.waiting_customers }} waiting</span>
                <span v-if="item.open_order_qty" class="rounded-full bg-violet-100 px-2.5 py-1 font-bold text-violet-700">{{ item.open_order_qty }} ordered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TOP SELLERS + QUOTES -->
      <section class="mb-8 grid grid-cols-1 gap-6" :class="isSuperAdmin ? 'xl:grid-cols-3' : ''">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" :class="isSuperAdmin ? 'xl:col-span-2' : ''">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-lg font-bold text-slate-900">Top-Selling Products</h2>
            <p class="text-sm text-slate-500">By units sold during the last 90 days.</p>
          </div>
          <div v-if="!dashboard.topProducts.length" class="p-8 text-center text-slate-500">No sales data yet.</div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="(item, index) in dashboard.topProducts" :key="`${item.product_id}:${item.variant_id || 'base'}`" class="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-3.5">
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{{ index + 1 }}</span>
              <div class="min-w-0">
                <NuxtLink :to="`/admin/products/${item.product_id}`" class="block truncate font-semibold text-slate-900 hover:text-blue-600">{{ item.name }}<span v-if="item.variant_name" class="font-normal text-slate-500"> — {{ item.variant_name }}</span></NuxtLink>
                <p class="mt-0.5 text-xs text-slate-400">{{ item.code || 'No product code' }}</p>
              </div>
              <div class="text-right"><p class="font-bold text-slate-900">{{ item.quantity }} sold</p><p class="text-xs text-slate-500">{{ currency(item.revenue) }}</p></div>
            </div>
          </div>
        </div>

        <div v-if="isSuperAdmin" class="rounded-2xl border border-violet-200 bg-white shadow-sm">
          <div class="border-b border-violet-100 px-5 py-4">
            <h2 class="text-lg font-bold text-slate-900">Quotes</h2>
            <p class="text-sm text-slate-500">Customer quote pipeline.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 p-5">
            <QuoteStat label="Awaiting action" :value="dashboard.quotes.awaitingAction" tone="amber" />
            <QuoteStat label="Sent" :value="dashboard.quotes.sent" tone="blue" />
            <QuoteStat label="Accepted" :value="dashboard.quotes.accepted" tone="green" />
            <QuoteStat label="Expired" :value="dashboard.quotes.expired" tone="red" />
          </div>
          <div class="border-t border-violet-100 px-5 py-4"><NuxtLink to="/admin/quotes" class="text-sm font-semibold text-violet-700 hover:text-violet-800">Manage quotes →</NuxtLink></div>
        </div>
      </section>

      <p class="mb-8 text-xs text-slate-400">* Estimated gross profit is product sales ex GST less the current Buy Price ex GST. Freight, payment fees and other business costs are not deducted.</p>
    </template>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";

const toneMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
};

const StatusRow = defineComponent({
  props: { label: { type: String, required: true }, value: { type: Number, required: true }, tone: { type: String, default: "blue" } },
  setup(props) {
    return () => h("div", { class: "flex items-center justify-between gap-3" }, [
      h("span", { class: "text-sm text-slate-600" }, props.label),
      h("span", { class: `min-w-9 rounded-full px-2.5 py-1 text-center text-xs font-bold ${toneMap[props.tone] || toneMap.blue}` }, String(props.value)),
    ]);
  },
});

const QuoteStat = defineComponent({
  props: { label: { type: String, required: true }, value: { type: Number, required: true }, tone: { type: String, default: "blue" } },
  setup(props) {
    return () => h("div", { class: "rounded-xl bg-slate-50 p-3" }, [
      h("p", { class: "text-xs text-slate-500" }, props.label),
      h("p", { class: `mt-1 text-2xl font-bold ${(toneMap[props.tone] || toneMap.blue).split(" ")[1]}` }, String(props.value)),
    ]);
  },
});

definePageMeta({ layout: "admin", middleware: "admin" });

const { adminFetch, checkAdmin, isSuperAdmin, adminRole } = useAdminFetch();

const dashboard = ref<any>(null);
const loading = ref(true);
const errorMessage = ref("");

const currency = (value: unknown) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));
const number = (value: unknown) => new Intl.NumberFormat("en-AU").format(Number(value || 0));

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
  : "—";

const formatDateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value))
  : "—";

const shortDate = (value?: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(year, month - 1, day));
};

const salesPeriodCards = computed(() => {
  if (!dashboard.value?.sales?.periods) return [];
  return ["today", "7d", "30d", "90d"].map((key) => ({ key, ...dashboard.value.sales.periods[key] }));
});

const ordersRequiringAction = computed(() => {
  if (!dashboard.value?.orders) return 0;
  return Number(dashboard.value.orders.newPaid || 0) + Number(dashboard.value.orders.processing || 0) + Number(dashboard.value.orders.shipping || 0);
});

const maxChartRevenue = computed(() => Math.max(1, ...(dashboard.value?.sales?.chart || []).map((day: any) => Number(day.revenue || 0))));
const chartHeight = (value: unknown) => {
  const amount = Number(value || 0);
  if (amount <= 0) return 2;
  return Math.max(5, Math.round((amount / maxChartRevenue.value) * 100));
};

const prettyStatus = (value: unknown) => String(value || "pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusClass = (value: unknown) => {
  const status = String(value || "").toLowerCase();
  if (status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "shipping") return "bg-violet-100 text-violet-700";
  if (status === "processing") return "bg-amber-100 text-amber-700";
  if (status === "paid") return "bg-blue-100 text-blue-700";
  if (["cancelled", "refunded"].includes(status)) return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
};


async function loadDashboard() {
  loading.value = true;
  errorMessage.value = "";
  try {
    await checkAdmin();
    dashboard.value = await adminFetch("/api/admin/dashboard");
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to load dashboard data.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>
