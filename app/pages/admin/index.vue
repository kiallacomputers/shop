<template>
  <main class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.16em] text-blue-600">Administration</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
        <p class="mt-2 max-w-3xl text-slate-500">
          What needs attention across orders, stock, customers and day-to-day store operations.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
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
          class="admin-btn-secondary"
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
        <div v-for="item in 4" :key="item" class="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div class="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div class="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>

    <template v-else-if="dashboard">
      <!-- ATTENTION STRIP -->
      <section class="mb-7">
        <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Needs Attention</h2>
            <p class="text-sm text-slate-500">The items most likely to need action first.</p>
          </div>
          <p class="text-xs text-slate-400">Updated {{ formatDateTime(dashboard.generated_at) }}</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NuxtLink
            to="/admin/orders"
            class="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            :class="ordersRequiringAction ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-slate-700">Orders to Process</p>
                <p class="mt-2 text-3xl font-black text-slate-900">{{ ordersRequiringAction }}</p>
              </div>
              <span class="rounded-xl bg-white p-2 text-blue-700 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7h18l-2 13H5L3 7Zm4 0 2-3h6l2 3" /></svg>
              </span>
            </div>
            <div class="mt-4 flex flex-wrap gap-1.5 text-xs">
              <span class="rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-700">{{ dashboard.orders.newPaid }} paid</span>
              <span class="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-700">{{ dashboard.orders.processing }} processing</span>
              <span class="rounded-full bg-violet-100 px-2.5 py-1 font-bold text-violet-700">{{ dashboard.orders.shipping }} shipping</span>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/admin/inventory"
            class="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            :class="inventoryAttentionCount ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-slate-700">Stock Attention</p>
                <p class="mt-2 text-3xl font-black text-slate-900">{{ inventoryAttentionCount }}</p>
              </div>
              <span class="rounded-xl bg-white p-2 text-amber-700 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M5 7l1 13h12l1-13M9 11v5m6-5v5" /></svg>
              </span>
            </div>
            <div class="mt-4 flex flex-wrap gap-1.5 text-xs">
              <span class="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-700">{{ dashboard.inventory.lowStock }} low</span>
              <span class="rounded-full bg-red-100 px-2.5 py-1 font-bold text-red-700">{{ dashboard.inventory.outOfStock }} out</span>
              <span v-if="dashboard.inventory.waitingCustomers" class="rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-700">{{ dashboard.inventory.waitingCustomers }} waiting</span>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/admin/back-in-stock"
            class="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            :class="dashboard.inventory.waitingCustomers ? 'border-cyan-200 bg-cyan-50/60' : 'border-slate-200 bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-slate-700">Customers Waiting</p>
                <p class="mt-2 text-3xl font-black text-slate-900">{{ dashboard.inventory.waitingCustomers }}</p>
              </div>
              <span class="rounded-xl bg-white p-2 text-cyan-700 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M5 20h14" /></svg>
              </span>
            </div>
            <p class="mt-4 text-xs text-slate-500">Back-in-stock notifications currently waiting.</p>
          </NuxtLink>

          <NuxtLink
            to="/admin/orders"
            class="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            :class="dashboard.orders.backorderRisk ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-slate-700">Backorder Risk</p>
                <p class="mt-2 text-3xl font-black" :class="dashboard.orders.backorderRisk ? 'text-red-700' : 'text-slate-900'">{{ dashboard.orders.backorderRisk }}</p>
              </div>
              <span class="rounded-xl bg-white p-2 text-red-700 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.6 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /></svg>
              </span>
            </div>
            <p class="mt-4 text-xs text-slate-500">Open orders containing products with no stock available.</p>
          </NuxtLink>
        </div>
      </section>

      <!-- QUICK ACTIONS -->
      <section class="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p class="text-sm text-slate-500">Common store tasks without hunting through the menu.</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <QuickAction to="/admin/products/new" label="Add Product" icon="M12 5v14M5 12h14" />
          <QuickAction to="/admin/categories/new" label="Add Main Category" icon="M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v4H4v-4Zm10 0h6v4h-6v-4Z" />
          <QuickAction to="/admin/inventory" label="Inventory" icon="M4 7h16M5 7l1 13h12l1-13M9 11v5m6-5v5" />
          <QuickAction to="/admin/freight" label="Freight & Pickup" icon="M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6" />
          <QuickAction to="/admin/ads" label="New Advertisement" icon="M3 5h18v14H3V5Zm4 10 3-3 2 2 3-4 3 5" />
          <QuickAction to="/admin/orders" label="Manage Orders" icon="M3 7h18l-2 13H5L3 7Zm4 0 2-3h6l2 3" />
        </div>
      </section>

      <!-- KPI SUMMARY -->
      <section class="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-500">Today</p>
          <p class="mt-2 text-3xl font-black text-slate-900">{{ currency(dashboard.sales.periods.today.revenue) }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ dashboard.sales.periods.today.orders }} order{{ dashboard.sales.periods.today.orders === 1 ? '' : 's' }}</p>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-500">Last 30 Days</p>
          <p class="mt-2 text-3xl font-black text-slate-900">{{ currency(dashboard.sales.last30.revenue) }}</p>
          <p class="mt-2 text-xs text-slate-500">Est. gross profit <strong class="text-emerald-700">{{ currency(dashboard.sales.last30.estimatedGrossProfitExGst) }}</strong> ex GST*</p>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-500">Inventory Value</p>
          <p class="mt-2 text-3xl font-black text-slate-900">{{ currency(dashboard.inventory.stockValueExGst) }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ number(dashboard.inventory.stockUnits) }} units on hand · ex GST cost</p>
        </article>

        <NuxtLink
          v-if="isSuperAdmin"
          to="/admin/accounts"
          class="rounded-2xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm transition hover:border-violet-400"
        >
          <p class="text-sm font-semibold text-violet-700">Customers</p>
          <p class="mt-2 text-3xl font-black text-slate-900">{{ dashboard.customers.total }}</p>
          <p class="mt-2 text-xs text-slate-500"><strong class="text-violet-700">+{{ dashboard.customers.new30d }}</strong> new in the last 30 days</p>
        </NuxtLink>

        <article v-else class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-500">Active Products</p>
          <p class="mt-2 text-3xl font-black text-slate-900">{{ dashboard.inventory.activeProducts }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ dashboard.inventory.categories }} categories</p>
        </article>
      </section>

      <!-- OPERATIONS -->
      <section class="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Recent Orders</h2>
              <p class="text-sm text-slate-500">Latest customer purchases.</p>
            </div>
            <NuxtLink to="/admin/orders" class="text-sm font-bold text-blue-600 hover:text-blue-700">View all →</NuxtLink>
          </div>

          <div v-if="!dashboard.recentOrders.length" class="p-8 text-center text-slate-500">
            No orders have been placed yet.
          </div>
          <div v-else class="divide-y divide-slate-100">
            <NuxtLink
              v-for="order in dashboard.recentOrders.slice(0, 6)"
              :key="order.id"
              :to="`/admin/orders/${order.id}`"
              class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4 transition hover:bg-slate-50"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-bold text-slate-900">Order #{{ order.id }}</p>
                  <span :class="statusClass(order.status)" class="rounded-full px-2.5 py-1 text-[11px] font-bold">{{ prettyStatus(order.status) }}</span>
                </div>
                <p class="mt-1 truncate text-sm text-slate-600">{{ order.customer_name || order.customer_email || "Customer" }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ formatDate(order.created_at) }}</p>
              </div>
              <div class="text-right">
                <p class="font-black text-slate-900">{{ currency(order.total) }}</p>
                <p class="mt-1 text-xs font-semibold text-blue-600">Open →</p>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Stock & Backorders</h2>
              <p class="text-sm text-slate-500">Products that need replenishment or have customer demand.</p>
            </div>
            <NuxtLink to="/admin/inventory" class="text-sm font-bold text-amber-700 hover:text-amber-800">Inventory →</NuxtLink>
          </div>

          <div v-if="!dashboard.inventory.attention.length" class="p-8 text-center text-slate-500">
            Stock levels look good.
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="item in dashboard.inventory.attention.slice(0, 7)"
              :key="`${item.product_id}:${item.variant_id || 'base'}`"
              class="flex items-center gap-4 px-5 py-4"
            >
              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="item.variant_id ? `/admin/products/${item.product_id}/variants` : `/admin/products/${item.product_id}`"
                  class="block truncate font-semibold text-slate-900 hover:text-blue-600"
                >
                  {{ item.name }}<span v-if="item.variant_name" class="font-normal text-slate-500"> — {{ item.variant_name }}</span>
                </NuxtLink>
                <p v-if="item.code" class="mt-0.5 truncate text-xs text-slate-400">{{ item.code }}</p>
              </div>

              <div class="flex shrink-0 flex-wrap justify-end gap-1.5 text-xs">
                <span :class="item.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'" class="rounded-full px-2.5 py-1 font-bold">
                  {{ item.stock }} stock
                </span>
                <span v-if="item.waiting_customers" class="rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-700">
                  {{ item.waiting_customers }} waiting
                </span>
                <span v-if="item.open_order_qty" class="rounded-full bg-violet-100 px-2.5 py-1 font-bold text-violet-700">
                  {{ item.open_order_qty }} ordered
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- WORKFLOW + SALES -->
      <section class="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-lg font-bold text-slate-900">Order Workflow</h2>
            <p class="text-sm text-slate-500">Current order status counts.</p>
          </div>
          <div class="space-y-3 p-5">
            <StatusRow label="Paid / New" :value="dashboard.orders.newPaid" tone="blue" />
            <StatusRow label="Processing" :value="dashboard.orders.processing" tone="amber" />
            <StatusRow label="Shipping" :value="dashboard.orders.shipping" tone="violet" />
            <StatusRow label="Delivered" :value="dashboard.orders.delivered" tone="green" />
            <StatusRow label="Backorder stock risk" :value="dashboard.orders.backorderRisk" tone="red" />
          </div>
          <div class="border-t border-slate-100 px-5 py-4">
            <NuxtLink to="/admin/orders" class="text-sm font-bold text-blue-600 hover:text-blue-700">Manage orders →</NuxtLink>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">30-Day Sales Trend</h2>
              <p class="text-sm text-slate-500">Daily revenue from paid and active orders.</p>
            </div>
            <p class="text-sm text-slate-500">All-time <strong class="text-slate-900">{{ currency(dashboard.sales.allTimeRevenue) }}</strong></p>
          </div>

          <div class="overflow-x-auto pb-2">
            <div class="flex h-52 min-w-[640px] items-end gap-1.5 border-b border-slate-200 px-1">
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
            <div class="mt-2 flex min-w-[640px] justify-between text-[10px] text-slate-400">
              <span>{{ shortDate(dashboard.sales.chart[0]?.date) }}</span>
              <span>{{ shortDate(dashboard.sales.chart[14]?.date) }}</span>
              <span>{{ shortDate(dashboard.sales.chart[29]?.date) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- BUSINESS INSIGHTS -->
      <section class="mb-7 grid grid-cols-1 gap-6" :class="isSuperAdmin ? 'xl:grid-cols-3' : ''">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" :class="isSuperAdmin ? 'xl:col-span-2' : ''">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Top-Selling Products</h2>
              <p class="text-sm text-slate-500">By units sold over the last 90 days.</p>
            </div>
            <NuxtLink to="/admin/products" class="text-sm font-bold text-blue-600 hover:text-blue-700">Products →</NuxtLink>
          </div>

          <div v-if="!dashboard.topProducts.length" class="p-8 text-center text-slate-500">
            No sales data yet.
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="(item, index) in dashboard.topProducts.slice(0, 6)"
              :key="`${item.product_id}:${item.variant_id || 'base'}`"
              class="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5"
            >
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{{ index + 1 }}</span>
              <div class="min-w-0">
                <NuxtLink :to="`/admin/products/${item.product_id}`" class="block truncate font-semibold text-slate-900 hover:text-blue-600">
                  {{ item.name }}<span v-if="item.variant_name" class="font-normal text-slate-500"> — {{ item.variant_name }}</span>
                </NuxtLink>
                <p class="mt-0.5 text-xs text-slate-400">{{ item.code || "No product code" }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-slate-900">{{ item.quantity }} sold</p>
                <p class="text-xs text-slate-500">{{ currency(item.revenue) }}</p>
              </div>
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
          <div class="border-t border-violet-100 px-5 py-4">
            <NuxtLink to="/admin/quotes" class="text-sm font-bold text-violet-700 hover:text-violet-800">Manage quotes →</NuxtLink>
          </div>
        </div>
      </section>

      <p class="mb-6 text-xs text-slate-400">
        * Estimated gross profit is product sales ex GST less the current Buy Price ex GST. Freight, payment fees and other business costs are not deducted.
      </p>
    </template>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, resolveComponent } from "vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const { adminFetch, checkAdmin, isSuperAdmin, adminRole } = useAdminFetch();

const dashboard = ref<any>(null);
const loading = ref(true);
const errorMessage = ref("");

const toneMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
};

const StatusRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    tone: { type: String, default: "blue" },
  },
  setup(props) {
    return () =>
      h("div", { class: "flex items-center justify-between gap-3" }, [
        h("span", { class: "text-sm text-slate-600" }, props.label),
        h(
          "span",
          { class: `min-w-9 rounded-full px-2.5 py-1 text-center text-xs font-bold ${toneMap[props.tone] || toneMap.blue}` },
          String(props.value),
        ),
      ]);
  },
});

const QuoteStat = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    tone: { type: String, default: "blue" },
  },
  setup(props) {
    return () =>
      h("div", { class: "rounded-xl bg-slate-50 p-3" }, [
        h("p", { class: "text-xs text-slate-500" }, props.label),
        h("p", { class: `mt-1 text-2xl font-bold ${(toneMap[props.tone] || toneMap.blue).split(" ")[1]}` }, String(props.value)),
      ]);
  },
});

const QuickAction = defineComponent({
  props: {
    to: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h(
        resolveComponent("NuxtLink"),
        {
          to: props.to,
          class:
            "group flex min-h-24 flex-col items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50",
        },
        {
          default: () => [
            h(
              "span",
              { class: "rounded-lg bg-white p-2 text-slate-600 shadow-sm transition group-hover:text-blue-700" },
              [
                h(
                  "svg",
                  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", class: "h-5 w-5" },
                  [h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d: props.icon })],
                ),
              ],
            ),
            h("span", { class: "mt-3 text-sm font-bold text-slate-800 group-hover:text-blue-700" }, props.label),
          ],
        },
      );
  },
});

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));

const number = (value: unknown) =>
  new Intl.NumberFormat("en-AU").format(Number(value || 0));

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "—";

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value))
    : "—";

const shortDate = (value?: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(year, month - 1, day));
};

const ordersRequiringAction = computed(() => {
  if (!dashboard.value?.orders) return 0;
  return (
    Number(dashboard.value.orders.newPaid || 0) +
    Number(dashboard.value.orders.processing || 0) +
    Number(dashboard.value.orders.shipping || 0)
  );
});

const inventoryAttentionCount = computed(() => {
  if (!dashboard.value?.inventory) return 0;
  return Number(dashboard.value.inventory.lowStock || 0) + Number(dashboard.value.inventory.outOfStock || 0);
});

const maxChartRevenue = computed(() =>
  Math.max(1, ...(dashboard.value?.sales?.chart || []).map((day: any) => Number(day.revenue || 0))),
);

const chartHeight = (value: unknown) => {
  const amount = Number(value || 0);
  if (amount <= 0) return 3;
  return Math.max(5, Math.round((amount / maxChartRevenue.value) * 100));
};

const prettyStatus = (value: unknown) =>
  String(value || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusClass = (value: unknown) => {
  const status = String(value || "").toLowerCase();
  if (["delivered", "completed"].includes(status)) return "bg-emerald-100 text-emerald-700";
  if (["shipping", "shipped"].includes(status)) return "bg-violet-100 text-violet-700";
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
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load dashboard data.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>
