<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Administration
        </p>
        <h1 class="text-3xl font-bold text-slate-900 mt-1">Admin Dashboard</h1>
        <p class="text-slate-500 mt-2">
          Overview of your Kialla Computers online store.
        </p>
      </div>

      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 transition"
        @click="loadDashboard"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="h-4 w-4"
          :class="{ 'animate-spin': loading }"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992V4.356m-.39 14.885v-4.992h-4.992M4.929 4.929a10.5 10.5 0 0 1 17.011 3.12M19.071 19.071a10.5 10.5 0 0 1-17.011-3.12"
          />
        </svg>
        Refresh
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
    >
      <p class="font-semibold">Unable to load the dashboard.</p>
      <p class="text-sm mt-1">{{ errorMessage }}</p>
    </div>

    <div v-if="loading && !dashboard" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <div
        v-for="item in 4"
        :key="item"
        class="h-32 rounded-xl border border-slate-200 bg-white animate-pulse"
      />
    </div>

    <template v-else-if="dashboard">
      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-slate-500">Products</p>
              <p class="text-3xl font-bold text-slate-900 mt-2">{{ dashboard.stats.products }}</p>
              <p class="text-sm text-slate-500 mt-2">
                {{ dashboard.stats.activeProducts }} active
              </p>
            </div>
            <div class="rounded-lg bg-blue-50 p-3 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25M21 7.5v9l-9 5.25m0-9L3 7.5m9 5.25v9M3 7.5v9l9 5.25" />
              </svg>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-slate-500">Orders</p>
              <p class="text-3xl font-bold text-slate-900 mt-2">{{ dashboard.stats.orders }}</p>
              <p class="text-sm text-slate-500 mt-2">
                {{ dashboard.stats.paidOrders }} paid
              </p>
            </div>
            <div class="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-slate-500">Paid Revenue</p>
              <p class="text-3xl font-bold text-slate-900 mt-2">
                {{ currency(dashboard.stats.paidRevenue) }}
              </p>
              <p class="text-sm text-slate-500 mt-2">From paid orders</p>
            </div>
            <div class="rounded-lg bg-violet-50 p-3 text-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m3-9.75C15 7.007 13.657 6 12 6s-3 1.007-3 2.25 1.343 2.25 3 2.25 3 1.007 3 2.25S13.657 15 12 15s-3-1.007-3-2.25M3.75 12a8.25 8.25 0 1 0 16.5 0 8.25 8.25 0 0 0-16.5 0Z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-slate-500">Low Stock</p>
              <p class="text-3xl font-bold text-slate-900 mt-2">{{ dashboard.stats.lowStock }}</p>
              <p class="text-sm text-slate-500 mt-2">
                {{ dashboard.stats.categories }} categories
              </p>
            </div>
            <div class="rounded-lg bg-amber-50 p-3 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.38c.865-1.5 3.03-1.5 3.896 0l7.355 12.746ZM12 16.5h.008v.008H12V16.5Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Recent Orders</h2>
              <p class="text-sm text-slate-500">Latest customer purchases</p>
            </div>
          </div>

          <div v-if="dashboard.recentOrders.length === 0" class="p-8 text-center text-slate-500">
            No orders have been placed yet.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-5 py-3 font-semibold">Order</th>
                  <th class="px-5 py-3 font-semibold">Customer</th>
                  <th class="px-5 py-3 font-semibold">Status</th>
                  <th class="px-5 py-3 font-semibold text-right">Total</th>
                  <th class="px-5 py-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="order in dashboard.recentOrders" :key="order.id" class="hover:bg-slate-50/70">
                  <td class="px-5 py-4 font-semibold text-slate-900">#{{ order.id }}</td>
                  <td class="px-5 py-4">
                    <p class="font-medium text-slate-800">{{ order.customer_name || "Customer" }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ order.customer_email || "—" }}</p>
                  </td>
                  <td class="px-5 py-4">
                    <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClass(order.status)">
                      {{ order.status || "Pending" }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right font-semibold text-slate-900">{{ currency(order.total) }}</td>
                  <td class="px-5 py-4 text-right text-slate-500 whitespace-nowrap">{{ formatDate(order.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-lg font-bold text-slate-900">Low Stock</h2>
            <p class="text-sm text-slate-500">5 units or fewer</p>
          </div>

          <div v-if="dashboard.lowStockProducts.length === 0" class="p-8 text-center text-slate-500">
            Stock levels look good.
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div v-for="product in dashboard.lowStockProducts" :key="product.id" class="flex items-center justify-between gap-4 px-5 py-4">
              <div class="min-w-0">
                <p class="font-medium text-slate-900 truncate">{{ product.name }}</p>
                <p class="text-xs text-slate-500 mt-1">Product #{{ product.id }}</p>
              </div>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" :class="Number(product.stock || 0) === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'">
                {{ Number(product.stock || 0) }} left
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-slate-900 mb-4">Admin Tools</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink to="/admin/products" class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition">
            <p class="font-bold text-slate-900 group-hover:text-blue-600">Manage Products</p>
            <p class="text-sm text-slate-500 mt-1">Add products, edit pricing and update stock.</p>
          </NuxtLink>

          <NuxtLink to="/admin/categories" class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition">
            <p class="font-bold text-slate-900 group-hover:text-blue-600">Manage Categories</p>
            <p class="text-sm text-slate-500 mt-1">Create and organise your shop categories.</p>
          </NuxtLink>

          <NuxtLink to="/admin/orders" class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition">
            <p class="font-bold text-slate-900 group-hover:text-blue-600">Manage Orders</p>
            <p class="text-sm text-slate-500 mt-1">Review purchases and order status.</p>
          </NuxtLink>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

type DashboardData = {
  stats: {
    products: number;
    activeProducts: number;
    lowStock: number;
    categories: number;
    orders: number;
    paidOrders: number;
    paidRevenue: number;
  };
  lowStockProducts: Array<{
    id: number | string;
    name: string;
    stock: number | null;
    active?: boolean | null;
  }>;
  recentOrders: Array<{
    id: number | string;
    customer_email?: string | null;
    customer_name?: string | null;
    total?: number | string | null;
    status?: string | null;
    created_at?: string | null;
  }>;
};

const { adminFetch } = useAdminFetch();

const dashboard = ref<DashboardData | null>(null);
const loading = ref(true);
const errorMessage = ref("");

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const statusClass = (status?: string | null) => {
  switch (String(status || "").toLowerCase()) {
    case "paid":
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-700";
    case "processing":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = "";

  try {
    dashboard.value = await adminFetch<DashboardData>("/api/admin/dashboard");
  } catch (error: any) {
    console.error("ADMIN DASHBOARD ERROR:", error);
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
