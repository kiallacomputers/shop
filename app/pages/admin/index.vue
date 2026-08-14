<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const products = ref<any[]>([]);
const orders = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(true);

const loadDashboard = async () => {
  loading.value = true;

  try {
    const [productData, orderData, categoryData] = await Promise.all([
      $fetch("/api/admin/products"),
      $fetch("/api/admin/orders"),
      $fetch("/api/admin/categories"),
    ]);

    products.value = productData;
    orders.value = orderData;
    categories.value = categoryData;
  } catch (error) {
    console.error("Dashboard error:", error);
  } finally {
    loading.value = false;
  }
};

const lowStock = computed(
  () =>
    products.value.filter(
      (product) => Number(product.stock) > 0 && Number(product.stock) <= 5,
    ).length,
);

const outOfStock = computed(
  () => products.value.filter((product) => Number(product.stock) <= 0).length,
);

const pendingOrders = computed(
  () => orders.value.filter((order) => order.status === "pending").length,
);

onMounted(loadDashboard);
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->

    <header class="bg-white border-b">
      <div
        class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

          <p class="text-sm text-gray-500">Kialla Computers</p>
        </div>

        <NuxtLink to="/" class="text-gray-600 hover:text-blue-600">
          View Shop
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Navigation -->

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <NuxtLink
          to="/admin/products"
          class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
        >
          <div class="text-3xl mb-3">📦</div>

          <h2 class="font-bold text-lg">Products</h2>

          <p class="text-gray-500 text-sm">{{ products.length }} products</p>
        </NuxtLink>

        <NuxtLink
          to="/admin/orders"
          class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
        >
          <div class="text-3xl mb-3">🛒</div>

          <h2 class="font-bold text-lg">Orders</h2>

          <p class="text-gray-500 text-sm">{{ pendingOrders }} pending</p>
        </NuxtLink>

        <NuxtLink
          to="/admin/categories"
          class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
        >
          <div class="text-3xl mb-3">📁</div>

          <h2 class="font-bold text-lg">Categories</h2>

          <p class="text-gray-500 text-sm">
            {{ categories.length }} categories
          </p>
        </NuxtLink>
      </div>

      <!-- Statistics -->

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl p-5 shadow-sm">
          <p class="text-sm text-gray-500">Products</p>

          <p class="text-3xl font-bold mt-2">
            {{ products.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm">
          <p class="text-sm text-gray-500">Categories</p>

          <p class="text-3xl font-bold mt-2">
            {{ categories.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm">
          <p class="text-sm text-gray-500">Low Stock</p>

          <p class="text-3xl font-bold text-orange-500 mt-2">
            {{ lowStock }}
          </p>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm">
          <p class="text-sm text-gray-500">Out of Stock</p>

          <p class="text-3xl font-bold text-red-500 mt-2">
            {{ outOfStock }}
          </p>
        </div>
      </div>

      <!-- Low stock -->

      <div class="bg-white rounded-xl shadow-sm">
        <div class="p-5 border-b">
          <h2 class="font-bold text-lg">Low Stock Products</h2>
        </div>

        <div class="divide-y">
          <div
            v-for="product in products.filter((p) => Number(p.stock) <= 5)"
            :key="product.id"
            class="p-4 flex items-center justify-between"
          >
            <div>
              <p class="font-semibold">
                {{ product.name }}
              </p>

              <p class="text-sm text-gray-500">Product ID: {{ product.id }}</p>
            </div>

            <span
              class="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold"
            >
              {{ product.stock }} left
            </span>
          </div>

          <div
            v-if="!products.some((p) => Number(p.stock) <= 5)"
            class="p-6 text-center text-gray-500"
          >
            All products have healthy stock levels.
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
