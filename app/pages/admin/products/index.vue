<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Products</h1>

        <p class="text-gray-500 mt-1">Manage your products and stock.</p>
      </div>

      <NuxtLink
        to="/admin/products/create"
        class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        <span class="text-xl">+</span>
        Add Product
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
      <p class="text-gray-500">Loading products...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- Products -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <!-- DESKTOP -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left px-6 py-4 font-semibold text-gray-700">
                Product
              </th>

              <th class="text-left px-6 py-4 font-semibold text-gray-700">
                Category
              </th>

              <th class="text-left px-6 py-4 font-semibold text-gray-700">
                Price
              </th>

              <th class="text-left px-6 py-4 font-semibold text-gray-700">
                Stock
              </th>

              <th class="text-left px-6 py-4 font-semibold text-gray-700">
                Status
              </th>

              <th class="text-right px-6 py-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody class="divide-y">
            <tr
              v-for="product in products"
              :key="product.id"
              class="hover:bg-gray-50"
            >
              <!-- PRODUCT -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <img
                    v-if="getFirstImage(product.image)"
                    :src="getFirstImage(product.image)"
                    :alt="product.name"
                    class="w-14 h-14 object-contain rounded border bg-white"
                  />

                  <div
                    v-else
                    class="w-14 h-14 flex items-center justify-center bg-gray-100 rounded border text-gray-400 text-xs"
                  >
                    No Image
                  </div>

                  <div>
                    <p class="font-semibold text-gray-800">
                      {{ product.name }}
                    </p>

                    <p class="text-sm text-gray-500">ID: {{ product.id }}</p>
                  </div>
                </div>
              </td>

              <!-- CATEGORY -->
              <td class="px-6 py-4">
                <span
                  v-if="getCategoryName(product.category_id)"
                  class="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                >
                  {{ getCategoryName(product.category_id) }}
                </span>

                <span v-else class="text-gray-400"> Uncategorised </span>
              </td>

              <!-- PRICE -->
              <td class="px-6 py-4 font-semibold">
                ${{ Number(product.price || 0).toFixed(2) }}
              </td>

              <!-- STOCK -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="product.stock"
                    type="number"
                    min="0"
                    class="w-20 border rounded-lg px-3 py-2 text-center"
                    @change="updateStock(product)"
                  />

                  <span
                    v-if="product.stock <= 0"
                    class="text-xs font-semibold text-red-600"
                  >
                    Out
                  </span>

                  <span
                    v-else-if="product.stock <= 5"
                    class="text-xs font-semibold text-orange-600"
                  >
                    Low
                  </span>
                </div>
              </td>

              <!-- STATUS -->
              <td class="px-6 py-4">
                <span
                  v-if="product.stock > 0"
                  class="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"
                >
                  In Stock
                </span>

                <span
                  v-else
                  class="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"
                >
                  Out of Stock
                </span>
              </td>

              <!-- ACTIONS -->
              <td class="px-6 py-4">
                <div class="flex justify-end gap-2">
                  <NuxtLink
                    :to="`/admin/products/edit/${product.id}`"
                    class="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    Edit
                  </NuxtLink>

                  <button
                    @click="deleteProduct(product)"
                    class="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MOBILE -->
      <div class="md:hidden divide-y">
        <div v-for="product in products" :key="product.id" class="p-5">
          <div class="flex gap-4">
            <img
              v-if="getFirstImage(product.image)"
              :src="getFirstImage(product.image)"
              :alt="product.name"
              class="w-14 h-14 object-contain rounded border bg-white"
            />

            <div
              v-else
              class="w-20 h-20 flex items-center justify-center bg-gray-100 rounded border text-gray-400 text-xs"
            >
              No Image
            </div>

            <div class="flex-1">
              <h2 class="font-semibold text-gray-800">
                {{ product.name }}
              </h2>

              <p class="text-sm text-gray-500 mt-1">
                Category:

                <span class="font-medium text-gray-700">
                  {{ getCategoryName(product.category_id) || "Uncategorised" }}
                </span>
              </p>

              <p class="font-semibold mt-2">
                ${{ Number(product.price || 0).toFixed(2) }}
              </p>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <label class="font-semibold text-gray-700"> Stock </label>

            <input
              v-model.number="product.stock"
              type="number"
              min="0"
              class="w-24 border rounded-lg px-3 py-2 text-center"
              @change="updateStock(product)"
            />
          </div>

          <div class="mt-4 flex gap-2">
            <NuxtLink
              :to="`/admin/products/edit/${product.id}`"
              class="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </NuxtLink>

            <button
              @click="deleteProduct(product)"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- NO PRODUCTS -->
      <div v-if="products.length === 0" class="p-10 text-center text-gray-500">
        No products found.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ----------------------------------------
// ADMIN AUTH
// ----------------------------------------

definePageMeta({
  middleware: "admin",
});

// ----------------------------------------
// ADMIN FETCH
// ----------------------------------------

const { adminFetch } = useAdminFetch();

// ----------------------------------------
// STATE
// ----------------------------------------

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const loading = ref(true);

const errorMessage = ref("");

// ----------------------------------------
// FIRST PRODUCT IMAGE
// ----------------------------------------

const getFirstImage = (images: any) => {
  if (!images) {
    return "";
  }

  // Already an array
  if (Array.isArray(images)) {
    return images[0] || "";
  }

  // JSON string containing an array
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);

      if (Array.isArray(parsed)) {
        return parsed[0] || "";
      }

      return images;
    } catch {
      return images;
    }
  }

  return "";
};

// ----------------------------------------
// GET CATEGORY NAME
// ----------------------------------------

const getCategoryName = (categoryId: any) => {
  if (categoryId === null || categoryId === undefined || categoryId === "") {
    return "";
  }

  const category = categories.value.find(
    (item) => String(item.id) === String(categoryId),
  );

  if (!category) {
    return "";
  }

  console.log("✅ CATEGORY FOUND:", JSON.parse(JSON.stringify(category)));

  return (
    category.name ??
    category.category_name ??
    category.title ??
    category.category ??
    ""
  );
};
// ----------------------------------------
// LOAD PRODUCTS
// ----------------------------------------

const loadProducts = async () => {
  console.log("🔥 LOAD PRODUCTS STARTED");

  try {
    const data = await adminFetch<any[]>("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:");
    console.log(data);

    products.value = data || [];

    console.log(
      "🔥 PRODUCT IMAGES:",
      products.value.map((product) => ({
        id: product.id,
        name: product.name,
        image: product.image,
        firstImage: getFirstImage(product.image),
      })),
    );

    console.log("🔥 PRODUCTS STORED:", products.value);
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCTS ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load products.";

    throw error;
  }
};

// ----------------------------------------
// LOAD CATEGORIES
// ----------------------------------------

const loadCategories = async () => {
  console.log("🔥 LOADING CATEGORIES");

  try {
    const data = await adminFetch<any[]>("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:");
    console.table(data);

    categories.value = data || [];
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    throw error;
  }
};

// ----------------------------------------
// UPDATE STOCK
// ----------------------------------------

const updateStock = async (product: any) => {
  try {
    const stock = Math.max(0, Number(product.stock) || 0);

    product.stock = stock;

    await adminFetch(`/api/admin/products/${product.id}`, {
      method: "PUT",

      body: {
        name: product.name,

        price: Number(product.price),

        stock: stock,

        category: product.category_id,

        image: Array.isArray(product.image) ? product.image : [],

        description: Array.isArray(product.description)
          ? product.description
          : [],
      },
    });
  } catch (error: any) {
    console.error("STOCK UPDATE ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to update stock.";

    await loadProducts();
  }
};

// ----------------------------------------
// DELETE PRODUCT
// ----------------------------------------

const deleteProduct = async (product: any) => {
  const confirmed = confirm(
    `Are you sure you want to delete "${product.name}"?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    await adminFetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });

    products.value = products.value.filter((item) => item.id !== product.id);
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to delete product.";
  }
};

// ----------------------------------------
// LOAD EVERYTHING
// ----------------------------------------

const load = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    await Promise.all([loadProducts(), loadCategories()]);
  } catch (error: any) {
    console.error("ADMIN PRODUCTS LOAD ERROR:", error);

    errorMessage.value =
      error?.data?.message ||
      error?.message ||
      "Unable to load products or categories.";
  } finally {
    loading.value = false;
  }
};

console.log("🔥 ADMIN PRODUCTS PAGE LOADING");

await load();
</script>
