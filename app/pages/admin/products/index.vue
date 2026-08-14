<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Products</h1>

        <p class="text-gray-500 mt-1">Manage your products and stock</p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        Add Product
      </NuxtLink>
    </div>

    <!-- Error -->
    <div
      v-if="errorMessage"
      class="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg"
    >
      {{ errorMessage }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-10">Loading products...</div>

    <!-- Products -->
    <div
      v-else-if="products.length"
      class="bg-white rounded-lg shadow overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="text-left p-4">Product</th>

              <th class="text-left p-4">Category</th>

              <th class="text-left p-4">Price</th>

              <th class="text-left p-4">Stock</th>

              <th class="text-right p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="product in products"
              :key="product.id"
              class="border-t hover:bg-gray-50"
            >
              <!-- Product -->
              <td class="p-4">
                <div class="flex items-center gap-4">
                  <img
                    v-if="getFirstImage(product)"
                    :src="getFirstImage(product)"
                    :alt="product.name"
                    class="w-16 h-16 object-contain rounded border bg-white"
                  />

                  <div
                    v-else
                    class="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border text-gray-400 text-xs"
                  >
                    No Image
                  </div>

                  <div>
                    <div class="font-semibold text-slate-800">
                      {{ product.name }}
                    </div>

                    <div class="text-sm text-gray-400">
                      ID: {{ product.id }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="p-4">
                <span class="text-gray-700">
                  {{ getCategoryName(product.category_id) }}
                </span>
              </td>

              <!-- Price -->
              <td class="p-4">${{ product.price }}</td>

              <!-- Stock -->
              <td class="p-4">
                <span
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                  :class="
                    product.stock > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  "
                >
                  {{ product.stock }}
                </span>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right">
                <NuxtLink
                  :to="`/admin/products/${product.id}`"
                  class="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Edit
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- No Products -->
    <div v-else class="bg-white rounded-lg shadow p-10 text-center">
      <p class="text-gray-500">No products found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

console.log("🔥🔥🔥 ADMIN PRODUCTS PAGE LOADING");

const { adminFetch } = useAdminFetch();

const products = ref<any[]>([]);
const categories = ref<any[]>([]);

const loading = ref(false);
const errorMessage = ref("");

// --------------------------------------------------
// GET FIRST PRODUCT IMAGE
// --------------------------------------------------

const getFirstImage = (product: any) => {
  if (!product?.images) {
    return "";
  }

  if (Array.isArray(product.images)) {
    return product.images[0] || "";
  }

  return "";
};

// --------------------------------------------------
// GET CATEGORY NAME
// --------------------------------------------------

const getCategoryName = (categoryId: any) => {
  if (!categoryId) {
    return "Uncategorised";
  }

  const category = categories.value.find(
    (category: any) => Number(category.id) === Number(categoryId),
  );

  return category?.name || "Uncategorised";
};

// --------------------------------------------------
// LOAD PRODUCTS
// --------------------------------------------------

const loadProducts = async () => {
  console.log("🔥🔥🔥 LOAD PRODUCTS STARTED");

  try {
    console.log("🔥 Calling /api/admin/products");

    const response = await adminFetch("/api/admin/products");

    console.log("🔥🔥🔥 ADMIN PRODUCTS RESPONSE:", response);

    products.value = response || [];

    console.log("🔥🔥🔥 PRODUCTS STORED:", products.value);
  } catch (error: any) {
    console.error("🔥🔥🔥 LOAD PRODUCTS ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to load products";
  }
};

// --------------------------------------------------
// LOAD CATEGORIES
// --------------------------------------------------

const loadCategories = async () => {
  console.log("🔥🔥🔥 LOADING CATEGORIES");

  try {
    console.log("🔥 Calling /api/admin/categories");

    const response = await adminFetch("/api/admin/categories");

    console.log("🔥🔥🔥 CATEGORIES RESPONSE:", response);

    categories.value = response || [];
  } catch (error: any) {
    console.error("🔥🔥🔥 LOAD CATEGORIES ERROR:", error);
  }
};

// --------------------------------------------------
// LOAD EVERYTHING
// --------------------------------------------------

const load = async () => {
  console.log("🔥🔥🔥 ADMIN LOAD STARTED");

  loading.value = true;
  errorMessage.value = "";

  try {
    await loadProducts();

    await loadCategories();

    console.log("🔥🔥🔥 ADMIN LOAD COMPLETE");
  } catch (error) {
    console.error("🔥🔥🔥 ADMIN LOAD ERROR:", error);
  } finally {
    loading.value = false;
  }
};

// --------------------------------------------------
// RUN AFTER PAGE MOUNTSs
// --------------------------------------------------

onMounted(() => {
  console.log("🔥🔥🔥 ADMIN PRODUCTS MOUNTED");

  load();
});
</script>
