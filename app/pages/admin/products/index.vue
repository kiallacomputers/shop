<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-[#566C9D]">Products</h1>
        <p class="text-gray-500 mt-1">Manage your products by category</p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
    >
      <p class="text-gray-500">Loading products...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5"
    >
      {{ errorMessage }}
    </div>

    <!-- No Products -->
    <div
      v-else-if="mainCategories.length === 0"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
    >
      <p class="text-gray-500">No products found.</p>
    </div>

    <!-- Categories -->
    <div v-else class="space-y-4">
      <div
        v-for="category in mainCategories"
        :key="category.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <!-- Main Category Header -->
        <button
          type="button"
          @click="toggleCategory(category.id)"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
        >
          <div class="flex items-center gap-3">
            <!-- Arrow -->
            <svg
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-90': isCategoryOpen(category.id) }"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>

            <div>
              <h2 class="text-lg font-bold text-[#566C9D]">
                {{ category.name }}
              </h2>

              <p class="text-xs text-gray-500">
                {{ categoryProductCount(category) }}
                product{{ categoryProductCount(category) === 1 ? "" : "s" }}
              </p>
            </div>
          </div>

          <span class="text-sm text-gray-400">
            {{ isCategoryOpen(category.id) ? "Collapse" : "Expand" }}
          </span>
        </button>

        <!-- Main Category Content -->
        <div
          v-if="isCategoryOpen(category.id)"
          class="border-t border-gray-200"
        >
          <!-- Direct products belonging to main category -->
          <div v-if="category.products.length" class="p-4">
            <div class="mb-3">
              <h3 class="font-semibold text-gray-700">Products</h3>
            </div>

            <ProductTable :products="category.products" />
          </div>

          <!-- Sub Categories -->
          <div
            v-for="subcategory in category.children"
            :key="subcategory.id"
            class="border-t border-gray-200"
          >
            <!-- Sub Category Header -->
            <button
              type="button"
              @click="toggleCategory(subcategory.id)"
              class="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition text-left"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="w-4 h-4 text-gray-500 transition-transform duration-200"
                  :class="{
                    'rotate-90': isCategoryOpen(subcategory.id),
                  }"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>

                <div>
                  <h3 class="font-semibold text-[#566C9D]">
                    {{ subcategory.name }}
                  </h3>

                  <p class="text-xs text-gray-500">
                    {{ subcategory.products.length }}
                    product{{ subcategory.products.length === 1 ? "" : "s" }}
                  </p>
                </div>
              </div>

              <span class="text-sm text-gray-400">
                {{ isCategoryOpen(subcategory.id) ? "Collapse" : "Expand" }}
              </span>
            </button>

            <!-- Sub Category Products -->
            <div v-if="isCategoryOpen(subcategory.id)" class="p-4">
              <ProductTable
                v-if="subcategory.products.length"
                :products="subcategory.products"
              />

              <p v-else class="text-sm text-gray-500 py-3">
                No products in this category.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: "admin",
});

const { useAdminFetch } = await import("~/composables/useAdminFetch");

const loading = ref(true);
const errorMessage = ref("");

const products = ref([]);
const categories = ref([]);

const openCategories = ref(new Set());

/*
|--------------------------------------------------------------------------
| Load Products
|--------------------------------------------------------------------------
*/

const loadProducts = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const response = await useAdminFetch("/api/admin/products");

    products.value = Array.isArray(response) ? response : response?.data || [];

    console.log("ADMIN PRODUCTS:", products.value);
  } catch (error) {
    console.error("ADMIN PRODUCTS LOAD ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load products.";
  }
};

/*
|--------------------------------------------------------------------------
| Load Categories
|--------------------------------------------------------------------------
*/

const loadCategories = async () => {
  try {
    const response = await useAdminFetch("/api/admin/categories");

    categories.value = Array.isArray(response)
      ? response
      : response?.data || [];

    console.log("ADMIN CATEGORIES:", categories.value);
  } catch (error) {
    console.error("ADMIN CATEGORIES LOAD ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load categories.";
  }
};

/*
|--------------------------------------------------------------------------
| Build Category Hierarchy
|--------------------------------------------------------------------------
*/

const mainCategories = computed(() => {
  const categoryMap = new Map();

  /*
   * Create category objects
   */
  categories.value.forEach((category) => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      products: [],
    });
  });

  /*
   * Put products into their category
   */
  products.value.forEach((product) => {
    const categoryId = Number(product.category_id);

    const category = categoryMap.get(categoryId);

    if (category) {
      category.products.push(product);
    }
  });

  /*
   * Build parent / child hierarchy
   */
  categories.value.forEach((category) => {
    if (category.parent_id !== null) {
      const parent = categoryMap.get(Number(category.parent_id));

      const child = categoryMap.get(category.id);

      if (parent && child) {
        parent.children.push(child);
      }
    }
  });

  /*
   * Only return main categories
   */
  const main = [];

  categoryMap.forEach((category) => {
    if (category.parent_id === null || category.parent_id === undefined) {
      main.push(category);
    }
  });

  /*
   * Sort main categories
   */
  main.sort((a, b) => a.name.localeCompare(b.name));

  /*
   * Sort subcategories
   */
  main.forEach((category) => {
    category.children.sort((a, b) => a.name.localeCompare(b.name));

    /*
     * Sort products directly inside main category
     */
    category.products.sort((a, b) => a.name.localeCompare(b.name));

    /*
     * Sort products inside subcategories
     */
    category.children.forEach((child) => {
      child.products.sort((a, b) => a.name.localeCompare(b.name));
    });
  });

  return main;
});

/*
|--------------------------------------------------------------------------
| Category Product Count
|--------------------------------------------------------------------------
*/

const categoryProductCount = (category) => {
  let count = category.products.length;

  category.children.forEach((child) => {
    count += child.products.length;
  });

  return count;
};

/*
|--------------------------------------------------------------------------
| Collapse / Expand
|--------------------------------------------------------------------------
*/

const toggleCategory = (id) => {
  const newSet = new Set(openCategories.value);

  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }

  openCategories.value = newSet;
};

const isCategoryOpen = (id) => {
  return openCategories.value.has(id);
};

/*
|--------------------------------------------------------------------------
| Load Page
|--------------------------------------------------------------------------
*/

const load = async () => {
  try {
    await Promise.all([loadProducts(), loadCategories()]);
  } finally {
    loading.value = false;
  }
};

await load();
</script>
