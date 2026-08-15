<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Page Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-[#566C9D]">Products</h1>

        <p class="text-gray-500 mt-1">Manage your products by category</p>
      </div>

      <NuxtLink
        to="/admin/products/create"
        class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-xl shadow p-8 text-center">
      <p class="text-gray-500">Loading products...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4"
    >
      {{ errorMessage }}
    </div>

    <!-- No Products -->
    <div
      v-else-if="groupedProducts.length === 0"
      class="bg-white rounded-xl shadow p-8 text-center"
    >
      <p class="text-gray-500">No products found.</p>
    </div>

    <!-- Product Categories -->
    <div v-else class="space-y-8">
      <!-- Category -->
      <section
        v-for="category in groupedProducts"
        :key="category.id"
        class="bg-white rounded-xl shadow overflow-hidden"
      >
        <!-- Category Header -->
        <div
          class="bg-gray-100 border-b border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        >
          <div>
            <h2 class="text-xl font-bold text-[#566C9D]">
              {{ category.name }}
            </h2>

            <p class="text-sm text-gray-500">
              {{ category.products.length }}
              {{ category.products.length === 1 ? "product" : "products" }}
            </p>
          </div>
        </div>

        <!-- Products -->
        <div class="divide-y divide-gray-100">
          <div
            v-for="product in category.products"
            :key="product.id"
            class="p-5 flex flex-col lg:flex-row lg:items-center gap-5 hover:bg-gray-50 transition"
          >
            <!-- Product Image -->
            <div
              class="w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            >
              <img
                v-if="getFirstImage(product)"
                :src="getFirstImage(product)"
                :alt="product.name"
                class="w-full h-full object-contain p-2"
              />

              <span v-else class="text-xs text-gray-400"> No Image </span>
            </div>

            <!-- Product Details -->
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-[#566C9D] text-lg truncate">
                {{ product.name }}
              </h3>

              <p
                v-if="product.blurb"
                class="text-sm text-gray-500 mt-1 line-clamp-2"
              >
                {{ product.blurb }}
              </p>

              <div class="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm">
                <span>
                  <strong>ID:</strong>
                  {{ product.id }}
                </span>

                <span>
                  <strong>Price:</strong>
                  ${{ Number(product.price).toFixed(2) }}
                </span>

                <span>
                  <strong>Stock:</strong>

                  <span
                    :class="
                      product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    "
                  >
                    {{ product.stock }}
                  </span>
                </span>

                <span>
                  <strong>Status:</strong>

                  <span
                    :class="product.active ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ product.active ? "Active" : "Inactive" }}
                  </span>
                </span>
              </div>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              <span
                v-if="product.featured"
                class="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full"
              >
                Featured
              </span>

              <span
                v-if="product.refurbished"
                class="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full"
              >
                Refurbished
              </span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <NuxtLink
                :to="`/admin/products/edit/${product.id}`"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Edit
              </NuxtLink>

              <button
                type="button"
                @click="deleteProduct(product)"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: "admin",
});

const adminFetch = useAdminFetch();

const loading = ref(true);
const errorMessage = ref("");

const products = ref([]);
const categories = ref([]);

/*
|--------------------------------------------------------------------------
| Load Products
|--------------------------------------------------------------------------
*/

const loadProducts = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    console.log("🔥 ADMIN PRODUCTS LOADING");

    const response = await adminFetch("/api/admin/products");

    products.value = Array.isArray(response)
      ? response
      : response?.products || [];

    console.log("🔥 ADMIN PRODUCTS:", products.value);
  } catch (error) {
    console.error("🔥 LOAD PRODUCTS ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load products.";
  } finally {
    loading.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| Load Categories
|--------------------------------------------------------------------------
*/

const loadCategories = async () => {
  try {
    console.log("🔥 LOADING CATEGORIES");

    const response = await $fetch("/api/admin/categories");

    categories.value = Array.isArray(response)
      ? response
      : response?.categories || [];

    console.log("🔥 ADMIN CATEGORIES:", categories.value);
  } catch (error) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Category Name
|--------------------------------------------------------------------------
*/

const getCategoryName = (categoryId) => {
  if (!categoryId) {
    return "Uncategorised";
  }

  const category = categories.value.find(
    (category) => Number(category.id) === Number(categoryId),
  );

  return category?.name || "Uncategorised";
};

/*
|--------------------------------------------------------------------------
| Get First Product Image
|--------------------------------------------------------------------------
*/

const getFirstImage = (product) => {
  if (!product?.images) {
    return "";
  }

  // Already an array
  if (Array.isArray(product.images)) {
    return product.images[0] || "";
  }

  // JSON string
  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);

      if (Array.isArray(parsed)) {
        return parsed[0] || "";
      }
    } catch (error) {
      console.error("IMAGE PARSE ERROR:", error);
    }
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| Group Products By Category
|--------------------------------------------------------------------------
*/

const groupedProducts = computed(() => {
  const groups = {};

  /*
   * Create category groups
   */

  for (const category of categories.value) {
    groups[category.id] = {
      id: category.id,
      name: category.name,
      products: [],
    };
  }

  /*
   * Add products to categories
   */

  for (const product of products.value) {
    const categoryId = product.category_id;

    /*
     * If category exists
     */

    if (categoryId && groups[categoryId]) {
      groups[categoryId].products.push(product);
    } else {
      /*
       * Uncategorised
       */

      if (!groups.uncategorised) {
        groups.uncategorised = {
          id: "uncategorised",
          name: "Uncategorised",
          products: [],
        };
      }

      groups.uncategorised.products.push(product);
    }
  }

  /*
   * Sort products inside each category
   */

  Object.values(groups).forEach((group) => {
    group.products.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        sensitivity: "base",
      }),
    );
  });

  /*
   * Convert object to array
   */

  const result = Object.values(groups);

  /*
   * Remove empty categories
   */

  const nonEmpty = result.filter((group) => group.products.length > 0);

  /*
   * Sort categories alphabetically
   *
   * Uncategorised goes to the bottom.
   */

  nonEmpty.sort((a, b) => {
    if (a.id === "uncategorised") {
      return 1;
    }

    if (b.id === "uncategorised") {
      return -1;
    }

    return String(a.name).localeCompare(String(b.name), undefined, {
      sensitivity: "base",
    });
  });

  return nonEmpty;
});

/*
|--------------------------------------------------------------------------
| Delete Product
|--------------------------------------------------------------------------
*/

const deleteProduct = async (product) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${product.name}"?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    await $fetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });

    /*
     * Remove product locally
     */

    products.value = products.value.filter((item) => item.id !== product.id);
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    alert(
      error?.data?.statusMessage ||
        error?.message ||
        "Unable to delete product.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| Load Data
|--------------------------------------------------------------------------
*/

await Promise.all([loadProducts(), loadCategories()]);
</script>
