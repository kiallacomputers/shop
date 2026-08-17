<template>
  <main class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- ========================================= -->
      <!-- HEADER -->
      <!-- ========================================= -->

      <div
        class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <NuxtLink
            to="/admin"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Admin Dashboard
          </NuxtLink>

          <h1 class="mt-3 text-3xl font-bold text-slate-900">
            Manage Orders
          </h1>

          <p class="mt-1 text-slate-500">
            View customer orders and manage order status.
          </p>
        </div>

        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          @click="loadOrders"
        >
          Refresh Orders
        </button>
      </div>

      <!-- ========================================= -->
      <!-- SUMMARY -->
      <!-- ========================================= -->

      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">
            Total Orders
          </p>

          <p class="mt-2 text-3xl font-bold text-slate-900">
            {{ orders.length }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">
            Order Revenue
          </p>

          <p class="mt-2 text-3xl font-bold text-slate-900">
            {{ currency(totalRevenue) }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">
            Processing
          </p>

          <p class="mt-2 text-3xl font-bold text-amber-600">
            {{ processingCount }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-500">
            Completed
          </p>

          <p class="mt-2 text-3xl font-bold text-emerald-600">
            {{ completedCount }}
          </p>
        </div>
      </div>

      <!-- ========================================= -->
      <!-- FILTERS -->
      <!-- ========================================= -->

      <div
        class="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">
              Search Orders
            </label>

            <input
              v-model="search"
              type="text"
              placeholder="Order, customer or email..."
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">
              Status
            </label>

            <select
              v-model="statusFilter"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">
              Date
            </label>

            <select
              v-model="dateFilter"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>

        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
        >
          <p class="text-sm text-slate-500">
            Showing
            <span class="font-semibold text-slate-800">
              {{ filteredOrders.length }}
            </span>
            of
            <span class="font-semibold text-slate-800">
              {{ orders.length }}
            </span>
            orders
          </p>

          <button
            v-if="hasFilters"
            type="button"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700"
            @click="clearFilters"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- ========================================= -->
      <!-- ERROR -->
      <!-- ========================================= -->

      <div
        v-if="errorMessage"
        class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
      >
        {{ errorMessage }}
      </div>

      <!-- ========================================= -->
      <!-- LOADING -->
      <!-- ========================================= -->

      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <p class="text-slate-500">
          Loading orders...
        </p>
      </div>

      <!-- ========================================= -->
      <!-- EMPTY -->
      <!-- ========================================= -->

      <div
        v-else-if="filteredOrders.length === 0"
        class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <h2 class="text-lg font-bold text-slate-800">
          No orders found
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          There are no orders matching the current filters.
        </p>
      </div>

      <!-- ========================================= -->
      <!-- ORDERS -->
      <!-- ========================================= -->

      <div
        v-else
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Order
                </th>

                <th class="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th class="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total
                </th>

                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="order in filteredOrders"
                :key="order.id"
                class="border-b border-slate-100 hover:bg-slate-50"
              >
                <td class="px-4 py-4">
                  <p class="font-bold text-slate-900">
                    #{{ order.id }}
                  </p>

                  <p
                    v-if="order.stripe_session_id"
                    class="mt-1 max-w-[170px] truncate font-mono text-[10px] text-slate-400"
                    :title="order.stripe_session_id"
                  >
                    {{ order.stripe_session_id }}
                  </p>
                </td>

                <td class="px-4 py-4">
                  <p class="max-w-[220px] truncate font-semibold text-slate-800">
                    {{ order.customer_name || "Customer" }}
                  </p>

                  <p
                    class="mt-1 max-w-[220px] truncate text-xs text-slate-500"
                    :title="order.customer_email || ''"
                  >
                    {{ order.customer_email || "No email" }}
                  </p>
                </td>

                <td class="px-4 py-4 whitespace-nowrap text-slate-600">
                  {{ formatDate(order.created_at) }}
                </td>

                <td class="px-4 py-4 text-center">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize"
                    :class="statusClass(order.status)"
                  >
                    {{ order.status || "Pending" }}
                  </span>
                </td>

                <td class="px-4 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                  {{ currency(order.total) }}
                </td>

                <td class="px-4 py-4 text-right">
                  <NuxtLink
                    :to="`/admin/orders/${order.id}`"
                    class="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  >
                    View
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

type Order = {
  id: string | number;
  user_id?: string | null;
  stripe_session_id?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  total?: number | string | null;
  status?: string | null;
  created_at?: string | null;
};

const { adminFetch } = useAdminFetch();

const orders = ref<Order[]>([]);
const loading = ref(true);
const errorMessage = ref("");

const search = ref("");
const statusFilter = ref("");
const dateFilter = ref("");

const filteredOrders = computed(() => {
  const term = search.value.trim().toLowerCase();

  return orders.value.filter((order) => {
    if (term) {
      const haystack = [
        String(order.id ?? ""),
        order.customer_name ?? "",
        order.customer_email ?? "",
        order.stripe_session_id ?? "",
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(term)) {
        return false;
      }
    }

    if (
      statusFilter.value &&
      String(order.status || "").toLowerCase() !== statusFilter.value
    ) {
      return false;
    }

    if (dateFilter.value && order.created_at) {
      const created = new Date(order.created_at);
      const now = new Date();

      if (dateFilter.value === "today") {
        if (
          created.getFullYear() !== now.getFullYear() ||
          created.getMonth() !== now.getMonth() ||
          created.getDate() !== now.getDate()
        ) {
          return false;
        }
      } else {
        const days = Number(dateFilter.value);

        if (Number.isFinite(days)) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);

          if (created < cutoff) {
            return false;
          }
        }
      }
    }

    return true;
  });
});

const hasFilters = computed(
  () =>
    Boolean(search.value) ||
    Boolean(statusFilter.value) ||
    Boolean(dateFilter.value),
);

const totalRevenue = computed(() =>
  orders.value.reduce((sum, order) => {
    const status = String(order.status || "").toLowerCase();

    if (status === "cancelled" || status === "refunded") {
      return sum;
    }

    return sum + Number(order.total || 0);
  }, 0),
);

const processingCount = computed(() =>
  orders.value.filter(
    (order) =>
      String(order.status || "").toLowerCase() === "processing",
  ).length,
);

const completedCount = computed(() =>
  orders.value.filter(
    (order) =>
      String(order.status || "").toLowerCase() === "completed",
  ).length,
);

const clearFilters = () => {
  search.value = "";
  statusFilter.value = "";
  dateFilter.value = "";
};

const currency = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(amount || 0));

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const statusClass = (status?: string | null) => {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return "bg-blue-100 text-blue-700";

    case "processing":
      return "bg-amber-100 text-amber-700";

    case "shipped":
      return "bg-purple-100 text-purple-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "refunded":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const loadOrders = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    orders.value =
      (await adminFetch<Order[]>("/api/admin/orders")) || [];
  } catch (error: any) {
    console.error("LOAD ADMIN ORDERS ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load orders.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadOrders);
</script>
