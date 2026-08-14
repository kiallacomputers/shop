<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const loading = ref(true);

const products = ref<any[]>([]);
const orders = ref<any[]>([]);
const categories = ref<any[]>([]);

const { adminFetch } = useAdminFetch();

// ----------------------------------------
// LOAD DASHBOARD DATA
// ----------------------------------------

const loadDashboard = async () => {
  loading.value = true;

  try {
    const [productData, orderData, categoryData] = await Promise.all([
      adminFetch("/api/admin/products"),

      adminFetch("/api/admin/orders"),

      adminFetch("/api/admin/categories"),
    ]);

    products.value = productData || [];

    orders.value = orderData || [];

    categories.value = categoryData || [];
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
  } finally {
    loading.value = false;
  }
};

// ----------------------------------------
// STATISTICS
// ----------------------------------------

const totalProducts = computed(() => {
  return products.value.length;
});

const totalCategories = computed(() => {
  return categories.value.length;
});

const totalOrders = computed(() => {
  return orders.value.length;
});

const lowStockProducts = computed(() => {
  return products.value.filter(
    (product) => Number(product.stock) > 0 && Number(product.stock) <= 5,
  );
});

const outOfStockProducts = computed(() => {
  return products.value.filter((product) => Number(product.stock) <= 0);
});

const pendingOrders = computed(() => {
  return orders.value.filter((order) => order.status === "pending");
});

// ----------------------------------------
// RECENT ORDERS
// ----------------------------------------

const recentOrders = computed(() => {
  return orders.value.slice(0, 5);
});

// ----------------------------------------
// DATE FORMAT
// ----------------------------------------

const formatDate = (date: string) => {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// ----------------------------------------
// LOAD
// ----------------------------------------

onMounted(() => {
  loadDashboard();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- ================================= -->
    <!-- HEADER -->
    <!-- ================================= -->

    <header class="bg-white border-b">
      <div
        class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

          <p class="text-sm text-gray-500 mt-1">Kialla Computers</p>
        </div>

        <NuxtLink
          to="/"
          class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Back to Shop
        </NuxtLink>
      </div>
    </header>

    <!-- ================================= -->
    <!-- MAIN -->
    <!-- ================================= -->

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- ================================= -->
      <!-- ADMIN NAVIGATION -->
      <!-- ================================= -->

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <!-- PRODUCTS -->

        <NuxtLink
          to="/admin/products"
          class="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition border border-transparent hover:border-blue-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Products</p>

              <p class="text-2xl font-bold mt-1">
                {{ totalProducts }}
              </p>
            </div>

            <div class="text-3xl">📦</div>
          </div>
        </NuxtLink>

        <!-- ORDERS -->

        <NuxtLink
          to="/admin/orders"
          class="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition border border-transparent hover:border-blue-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Orders</p>

              <p class="text-2xl font-bold mt-1">
                {{ totalOrders }}
              </p>
            </div>

            <div class="text-3xl">🛒</div>
          </div>
        </NuxtLink>

        <!-- CATEGORIES -->

        <NuxtLink
          to="/admin/categories"
          class="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition border border-transparent hover:border-blue-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Categories</p>

              <p class="text-2xl font-bold mt-1">
                {{ totalCategories }}
              </p>
            </div>

            <div class="text-3xl">📁</div>
          </div>
        </NuxtLink>
      </div>

      <!-- ================================= -->
      <!-- INVENTORY STATISTICS -->
      <!-- ================================= -->

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- TOTAL PRODUCTS -->

        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">Total Products</p>

          <p class="text-3xl font-bold mt-2 text-gray-800">
            {{ totalProducts }}
          </p>
        </div>

        <!-- LOW STOCK -->

        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">Low Stock</p>

          <p class="text-3xl font-bold mt-2 text-orange-500">
            {{ lowStockProducts.length }}
          </p>
        </div>

        <!-- OUT OF STOCK -->

        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">Out of Stock</p>

          <p class="text-3xl font-bold mt-2 text-red-500">
            {{ outOfStockProducts.length }}
          </p>
        </div>

        <!-- PENDING ORDERS -->

        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">Pending Orders</p>

          <p class="text-3xl font-bold mt-2 text-blue-600">
            {{ pendingOrders.length }}
          </p>
        </div>
      </div>

      <!-- ================================= -->
      <!-- LOWER CONTENT -->
      <!-- ================================= -->

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- ================================= -->
        <!-- LOW STOCK -->
        <!-- ================================= -->

        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="p-5 border-b flex items-center justify-between">
            <div>
              <h2 class="font-bold text-lg text-gray-800">Low Stock</h2>

              <p class="text-sm text-gray-500">Products that need attention</p>
            </div>

            <NuxtLink
              to="/admin/products"
              class="text-sm text-blue-600 hover:underline"
            >
              View Products
            </NuxtLink>
          </div>

          <div>
            <div
              v-for="product in lowStockProducts"
              :key="product.id"
              class="p-4 border-b flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-gray-800">
                  {{ product.name }}
                </p>

                <p class="text-xs text-gray-400 mt-1">
                  Product ID:
                  {{ product.id }}
                </p>
              </div>

              <span
                class="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold"
              >
                {{ product.stock }} left
              </span>
            </div>

            <div
              v-if="lowStockProducts.length === 0"
              class="p-8 text-center text-gray-500"
            >
              No low-stock products.
            </div>
          </div>
        </div>

        <!-- ================================= -->
        <!-- RECENT ORDERS -->
        <!-- ================================= -->

        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="p-5 border-b flex items-center justify-between">
            <div>
              <h2 class="font-bold text-lg text-gray-800">Recent Orders</h2>

              <p class="text-sm text-gray-500">Latest customer orders</p>
            </div>

            <NuxtLink
              to="/admin/orders"
              class="text-sm text-blue-600 hover:underline"
            >
              View Orders
            </NuxtLink>
          </div>

          <div>
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="p-4 border-b flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-gray-800">Order #{{ order.id }}</p>

                <p class="text-sm text-gray-500">
                  {{ order.customer_name }}
                </p>

                <p v-if="order.created_at" class="text-xs text-gray-400 mt-1">
                  {{ formatDate(order.created_at) }}
                </p>
              </div>

              <div class="text-right">
                <p class="font-semibold text-gray-800">
                  ${{ Number(order.total).toFixed(2) }}
                </p>

                <span class="text-xs capitalize text-gray-500">
                  {{ order.status }}
                </span>
              </div>
            </div>

            <div
              v-if="recentOrders.length === 0"
              class="p-8 text-center text-gray-500"
            >
              No orders yet.
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
