<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8"
    >
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Administration
        </p>

        <h1 class="text-3xl font-bold text-slate-900 mt-1">
          Admin Dashboard
        </h1>

        <p class="text-slate-500 mt-2">
          Overview of your Kialla Computers online store.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span
          v-if="adminRole"
          class="rounded-full px-3 py-1.5 text-xs font-bold"
          :class="
            isSuperAdmin
              ? 'bg-violet-100 text-violet-700'
              : 'bg-blue-100 text-blue-700'
          "
        >
          {{ isSuperAdmin ? "SuperAdmin" : "Admin" }}
        </span>

        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          @click="loadDashboard"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- ========================================= -->
    <!-- ADMIN TOOLS -->
    <!-- ========================================= -->

    <section class="mb-8">
      <h2 class="text-lg font-bold text-slate-900 mb-4">
        Admin Tools
      </h2>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <NuxtLink
          to="/admin/products"
          class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition"
        >
          <p class="font-bold text-slate-900 group-hover:text-blue-600">
            Manage Products
          </p>

          <p class="text-sm text-slate-500 mt-1">
            Add products, edit pricing and update stock.
          </p>
        </NuxtLink>

        <NuxtLink
          to="/admin/categories"
          class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition"
        >
          <p class="font-bold text-slate-900 group-hover:text-blue-600">
            Manage Categories
          </p>

          <p class="text-sm text-slate-500 mt-1">
            Create and organise your shop categories.
          </p>
        </NuxtLink>

        <NuxtLink
          to="/admin/orders"
          class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition"
        >
          <p class="font-bold text-slate-900 group-hover:text-blue-600">
            Manage Orders
          </p>

          <p class="text-sm text-slate-500 mt-1">
            Review purchases and update order status.
          </p>
        </NuxtLink>

        <NuxtLink
          to="/admin/freight"
          class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-cyan-300 hover:shadow-md transition"
        >
          <p class="font-bold text-slate-900 group-hover:text-cyan-700">
            Manage Freight
          </p>

          <p class="text-sm text-slate-500 mt-1">
            Australia Post rates and $11/$16.50 local postcode delivery.
          </p>
        </NuxtLink>

        <NuxtLink
          v-if="isSuperAdmin"
          to="/admin/accounts"
          class="group rounded-xl border border-violet-200 bg-white p-5 shadow-sm hover:border-violet-400 hover:shadow-md transition"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="font-bold text-slate-900 group-hover:text-violet-700">
              Account Management
            </p>

            <span
              class="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold uppercase text-violet-700"
            >
              SuperAdmin
            </span>
          </div>

          <p class="text-sm text-slate-500 mt-1">
            Manage users and administrator roles.
          </p>
        </NuxtLink>
      </div>
    </section>

    <div
      v-if="errorMessage"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="loading && !dashboard"
      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
    >
      <div
        v-for="item in 4"
        :key="item"
        class="h-32 rounded-xl border border-slate-200 bg-white animate-pulse"
      />
    </div>

    <template v-else-if="dashboard">
      <section
        class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8"
      >
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Products</p>
          <p class="text-3xl font-bold text-slate-900 mt-2">
            {{ dashboard.stats.products }}
          </p>
          <p class="text-sm text-slate-500 mt-2">
            {{ dashboard.stats.activeProducts }} active
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Orders</p>
          <p class="text-3xl font-bold text-slate-900 mt-2">
            {{ dashboard.stats.orders }}
          </p>
          <p class="text-sm text-slate-500 mt-2">
            {{ dashboard.stats.paidOrders }} paid
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Paid Revenue</p>
          <p class="text-3xl font-bold text-slate-900 mt-2">
            {{ currency(dashboard.stats.paidRevenue) }}
          </p>
          <p class="text-sm text-slate-500 mt-2">
            From paid orders
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Low Stock</p>
          <p class="text-3xl font-bold text-slate-900 mt-2">
            {{ dashboard.stats.lowStock }}
          </p>
          <p class="text-sm text-slate-500 mt-2">
            {{ dashboard.stats.categories }} categories
          </p>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          class="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center justify-between border-b border-slate-200 px-5 py-4"
          >
            <div>
              <h2 class="text-lg font-bold text-slate-900">
                Recent Orders
              </h2>
              <p class="text-sm text-slate-500">
                Latest customer purchases
              </p>
            </div>

            <NuxtLink
              to="/admin/orders"
              class="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </NuxtLink>
          </div>

          <div
            v-if="dashboard.recentOrders.length === 0"
            class="p-8 text-center text-slate-500"
          >
            No orders have been placed yet.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-5 py-3">Order</th>
                  <th class="px-5 py-3">Customer</th>
                  <th class="px-5 py-3">Status</th>
                  <th class="px-5 py-3 text-right">Total</th>
                  <th class="px-5 py-3 text-right">Date</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="order in dashboard.recentOrders"
                  :key="order.id"
                >
                  <td class="px-5 py-4">
                    <NuxtLink
                      :to="`/admin/orders/${order.id}`"
                      class="font-semibold hover:text-blue-600"
                    >
                      #{{ order.id }}
                    </NuxtLink>
                  </td>

                  <td class="px-5 py-4">
                    {{ order.customer_name || "Customer" }}
                  </td>

                  <td class="px-5 py-4">
                    {{ order.status || "Pending" }}
                  </td>

                  <td class="px-5 py-4 text-right">
                    {{ currency(order.total) }}
                  </td>

                  <td class="px-5 py-4 text-right">
                    {{ formatDate(order.created_at) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-lg font-bold text-slate-900">
              Low Stock
            </h2>
            <p class="text-sm text-slate-500">
              5 units or fewer
            </p>
          </div>

          <div
            v-if="dashboard.lowStockProducts.length === 0"
            class="p-8 text-center text-slate-500"
          >
            Stock levels look good.
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="product in dashboard.lowStockProducts"
              :key="product.id"
              class="flex items-center justify-between gap-4 px-5 py-4"
            >
              <NuxtLink
                :to="`/admin/products/${product.id}`"
                class="truncate font-medium text-slate-900 hover:text-blue-600"
              >
                {{ product.name }}
              </NuxtLink>

              <span
                class="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700"
              >
                {{ Number(product.stock || 0) }} left
              </span>
            </div>
          </div>
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

const {
  adminFetch,
  checkAdmin,
  isSuperAdmin,
  adminRole,
} = useAdminFetch();

const dashboard =
  ref<DashboardData | null>(null);

const loading = ref(true);
const errorMessage = ref("");

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

const formatDate = (
  value?: string | null,
) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
};

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await checkAdmin();

    dashboard.value =
      await adminFetch<DashboardData>(
        "/api/admin/dashboard",
      );
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
