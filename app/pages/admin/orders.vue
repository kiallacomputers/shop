<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const orders = ref<any[]>([]);
const loading = ref(true);
const filter = ref("all");

const loadOrders = async () => {
  loading.value = true;

  try {
    orders.value = await $fetch("/api/admin/orders");
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const filteredOrders = computed(() => {
  if (filter.value === "all") {
    return orders.value;
  }

  return orders.value.filter((order) => order.status === filter.value);
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

onMounted(loadOrders);
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white border-b">
      <div
        class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between"
      >
        <div>
          <h1 class="text-2xl font-bold">Orders</h1>

          <p class="text-sm text-gray-500">Manage customer orders</p>
        </div>

        <NuxtLink
          to="/admin"
          class="px-4 py-2 bg-gray-800 text-white rounded-lg"
        >
          Dashboard
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Filters -->

      <div class="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-2">
        <button
          v-for="status in [
            'all',
            'pending',
            'paid',
            'processing',
            'shipped',
            'completed',
            'cancelled',
          ]"
          :key="status"
          @click="filter = status"
          :class="[
            'px-4 py-2 rounded-lg capitalize',
            filter === status
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700',
          ]"
        >
          {{ status }}
        </button>
      </div>

      <!-- Orders -->

      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left p-4">Order</th>

                <th class="text-left p-4">Customer</th>

                <th class="text-left p-4">Date</th>

                <th class="text-right p-4">Total</th>

                <th class="text-center p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="order in filteredOrders"
                :key="order.id"
                class="border-b hover:bg-gray-50"
              >
                <td class="p-4">
                  <p class="font-semibold">#{{ order.id }}</p>
                </td>

                <td class="p-4">
                  <p class="font-semibold">
                    {{ order.customer_name }}
                  </p>

                  <p class="text-sm text-gray-500">
                    {{ order.customer_email }}
                  </p>
                </td>

                <td class="p-4 text-sm text-gray-600">
                  {{ formatDate(order.created_at) }}
                </td>

                <td class="p-4 text-right font-semibold">
                  ${{ Number(order.total).toFixed(2) }}
                </td>

                <td class="p-4 text-center">
                  <span
                    class="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize bg-gray-100"
                  >
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>
