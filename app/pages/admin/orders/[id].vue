<template>
  <main class="min-h-screen bg-slate-50">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <!-- ========================================= -->
      <!-- BACK -->
      <!-- ========================================= -->

      <NuxtLink
        to="/admin/orders"
        class="text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        ← Back to Orders
      </NuxtLink>

      <!-- ========================================= -->
      <!-- ERROR -->
      <!-- ========================================= -->

      <div
        v-if="errorMessage"
        class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
      >
        {{ errorMessage }}
      </div>

      <!-- ========================================= -->
      <!-- LOADING -->
      <!-- ========================================= -->

      <div
        v-if="loading"
        class="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <p class="text-slate-500">
          Loading order...
        </p>
      </div>

      <!-- ========================================= -->
      <!-- ORDER -->
      <!-- ========================================= -->

      <div v-else-if="order" class="mt-6 space-y-6">
        <!-- Header -->
        <div
          class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"
        >
          <div>
            <p class="text-sm font-medium text-slate-500">
              Order
            </p>

            <h1 class="text-3xl font-bold text-slate-900">
              #{{ order.id }}
            </h1>

            <p class="mt-2 text-sm text-slate-500">
              {{ formatDate(order.created_at) }}
            </p>
          </div>

          <span
            class="inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-bold capitalize"
            :class="statusClass(order.status)"
          >
            {{ order.status || "Pending" }}
          </span>
        </div>

        <!-- ======================================= -->
        <!-- CUSTOMER + STATUS -->
        <!-- ======================================= -->

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section
            class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 class="text-lg font-bold text-slate-900">
              Customer Information
            </h2>

            <dl class="mt-5 space-y-4">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </dt>

                <dd class="mt-1 font-semibold text-slate-800">
                  {{ order.customer_name || "Not provided" }}
                </dd>
              </div>

              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </dt>

                <dd class="mt-1 break-all font-semibold text-slate-800">
                  {{ order.customer_email || "Not provided" }}
                </dd>
              </div>

              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  User ID
                </dt>

                <dd class="mt-1 break-all font-mono text-xs text-slate-600">
                  {{ order.user_id || "Not available" }}
                </dd>
              </div>
            </dl>
          </section>

          <section
            class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 class="text-lg font-bold text-slate-900">
              Order Status
            </h2>

            <p class="mt-2 text-sm text-slate-500">
              Update the fulfilment status for this order.
            </p>

            <div class="mt-5">
              <label class="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                v-model="selectedStatus"
                class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <button
                type="button"
                :disabled="savingStatus || !statusChanged"
                class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                @click="saveStatus"
              >
                {{ savingStatus ? "Saving..." : "Update Status" }}
              </button>

              <p
                v-if="statusMessage"
                class="mt-3 text-sm font-medium text-green-700"
              >
                {{ statusMessage }}
              </p>
            </div>
          </section>
        </div>

        <!-- ======================================= -->
        <!-- ORDER ITEMS -->
        <!-- ======================================= -->

        <section
          class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 class="text-lg font-bold text-slate-900">
              Order Items
            </h2>
          </div>

          <div
            v-if="order.items.length === 0"
            class="p-6 text-sm text-slate-500"
          >
            No order items were found.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[650px] text-left text-sm">
              <thead class="border-b border-slate-200">
                <tr>
                  <th class="px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Product
                  </th>

                  <th class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    Qty
                  </th>

                  <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Price
                  </th>

                  <th class="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in order.items"
                  :key="item.id"
                  class="border-b border-slate-100"
                >
                  <td class="px-6 py-4">
                    <p class="font-semibold text-slate-900">
                      {{ item.product_name || "Product" }}
                    </p>

                    <p
                      v-if="item.product_id"
                      class="mt-1 text-xs text-slate-400"
                    >
                      Product ID: {{ item.product_id }}
                    </p>
                  </td>

                  <td class="px-4 py-4 text-center font-semibold text-slate-700">
                    {{ Number(item.quantity || 0) }}
                  </td>

                  <td class="px-4 py-4 text-right text-slate-700">
                    {{ currency(item.price) }}
                  </td>

                  <td class="px-6 py-4 text-right font-bold text-slate-900">
                    {{
                      currency(
                        Number(item.price || 0) *
                          Number(item.quantity || 0),
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-5"
          >
            <div class="w-full max-w-sm space-y-2">
              <div class="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{{ currency(Math.max(0, Number(order.total || 0) - Number(order.shipping_cost || 0))) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm text-slate-600">
                <span>Delivery</span>
                <span>{{ Number(order.shipping_cost || 0) === 0 ? "FREE" : currency(order.shipping_cost) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm text-slate-600">
                <span>GST (10%)</span>
                <span>{{ currency(Number(order.total || 0) / 11) }}</span>
              </div>
              <div class="flex items-center justify-between border-t border-slate-300 pt-3">
                <span class="font-semibold text-slate-700">Order Total</span>
                <span class="text-2xl font-bold text-slate-900">{{ currency(order.total) }}</span>
              </div>
            </div>
          </div>
        </section>


        <!-- ======================================= -->
        <!-- DELIVERY INFORMATION -->
        <!-- ======================================= -->

        <section
          class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 class="text-lg font-bold text-slate-900">
            Delivery Information
          </h2>

          <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Postcode
              </dt>
              <dd class="mt-1 font-semibold text-slate-800">
                {{ order.shipping_postcode || "Not available" }}
              </dd>
            </div>

            <div>
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Delivery Method
              </dt>
              <dd class="mt-1 font-semibold text-slate-800">
                {{ order.shipping_method || "Not available" }}
              </dd>
            </div>

            <div>
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Freight
              </dt>
              <dd class="mt-1 font-semibold text-slate-800">
                {{
                  Number(order.shipping_cost || 0) === 0
                    ? "FREE"
                    : currency(order.shipping_cost)
                }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- ======================================= -->
        <!-- PAYMENT INFORMATION -->
        <!-- ======================================= -->

        <section
          class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 class="text-lg font-bold text-slate-900">
            Payment Information
          </h2>

          <div class="mt-5">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Stripe Checkout Session
            </p>

            <p
              class="mt-2 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-600"
            >
              {{ order.stripe_session_id || "Not available" }}
            </p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

type OrderItem = {
  id: string | number;
  order_id?: string | number;
  product_id?: string | number | null;
  product_name?: string | null;
  quantity?: number | string | null;
  price?: number | string | null;
};

type Order = {
  id: string | number;
  user_id?: string | null;
  stripe_session_id?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  total?: number | string | null;
  status?: string | null;
  shipping_postcode?: string | null;
  shipping_method?: string | null;
  shipping_service_code?: string | null;
  shipping_cost?: number | string | null;
  created_at?: string | null;
  items: OrderItem[];
};

const route = useRoute();
const { adminFetch } = useAdminFetch();

const order = ref<Order | null>(null);
const loading = ref(true);
const errorMessage = ref("");

const selectedStatus = ref("paid");
const savingStatus = ref(false);
const statusMessage = ref("");

const statusChanged = computed(() => {
  if (!order.value) {
    return false;
  }

  return (
    selectedStatus.value !==
    String(order.value.status || "paid").toLowerCase()
  );
});

const currency = (
  amount: number | string | null | undefined,
) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(amount || 0));

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
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

const loadOrder = async () => {
  loading.value = true;
  errorMessage.value = "";
  statusMessage.value = "";

  try {
    const id = String(route.params.id || "");

    if (!id) {
      throw new Error("Order ID is missing.");
    }

    const result = await adminFetch<Order>(
      `/api/admin/orders/${id}`,
    );

    order.value = result;
    selectedStatus.value = String(
      result.status || "paid",
    ).toLowerCase();
  } catch (error: any) {
    console.error("LOAD ADMIN ORDER ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load order.";
  } finally {
    loading.value = false;
  }
};

const saveStatus = async () => {
  if (!order.value || !statusChanged.value) {
    return;
  }

  savingStatus.value = true;
  errorMessage.value = "";
  statusMessage.value = "";

  try {
    const updated = await adminFetch<Order>(
      `/api/admin/orders/${order.value.id}`,
      {
        method: "PUT",
        body: {
          status: selectedStatus.value,
        },
      },
    );

    order.value = {
      ...order.value,
      ...updated,
      items: order.value.items,
    };

    statusMessage.value = "Order status updated.";
  } catch (error: any) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to update order status.";
  } finally {
    savingStatus.value = false;
  }
};

onMounted(loadOrder);
</script>
