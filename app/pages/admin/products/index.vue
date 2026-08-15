<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-[#566C9D]">Products</h1>

        <p class="text-gray-500 mt-1">Manage products by category</p>
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
      class="bg-white rounded-xl border border-gray-200 p-8 text-center"
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

    <!-- No products -->
    <div
      v-else-if="mainCategories.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-8"
    >
      <p class="text-gray-500 text-center">No products found.</p>

      <!-- Debug information -->
      <div class="mt-6 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
        <p>
          Products loaded:
          <strong>{{ products.length }}</strong>
        </p>

        <p>
          Categories loaded:
          <strong>{{ categories.length }}</strong>
        </p>

        <p>
          Main categories:
          <strong>{{ mainCategories.length }}</strong>
        </p>
      </div>
    </div>

    <!-- Categories -->
    <div v-else class="space-y-4">
      <!-- MAIN CATEGORY -->
      <div
        v-for="category in mainCategories"
        :key="category.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <!-- Main category header -->
        <button
          type="button"
          @click="toggleCategory(category.id)"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
        >
          <div class="flex items-center gap-3">
            <!-- Arrow -->
            <svg
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{
                'rotate-90': isCategoryOpen(category.id),
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

        <!-- Main category content -->
        <div
          v-if="isCategoryOpen(category.id)"
          class="border-t border-gray-200"
        >
          <!-- Products directly assigned to main category -->
          <div v-if="category.products.length > 0" class="p-4">
            <h3 class="font-semibold text-gray-700 mb-3">Products</h3>

            <AdminProductTable :products="category.products" />
          </div>

          <!-- SUB CATEGORIES -->
          <div
            v-for="subcategory in category.children"
            :key="subcategory.id"
            class="border-t border-gray-200"
          >
            <!-- Sub category header -->
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

            <!-- Subcategory products -->
            <div v-if="isCategoryOpen(subcategory.id)" class="p-4">
              <AdminProductTable
                v-if="subcategory.products.length > 0"
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

/*
|--------------------------------------------------------------------------
| Admin Fetch
|--------------------------------------------------------------------------
*/

const { useAdminFetch } = await import("~/composables/useAdminFetch");

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const loading = ref(true);

const errorMessage = ref("");

const products = ref([]);

const categories = ref([]);

const openCategories = ref(new Set());

/*
|--------------------------------------------------------------------------
| Extract Array
|--------------------------------------------------------------------------
|
| Handles all of these possible responses:
|
| []
|
| { data: [] }
|
| { products: [] }
|
| { categories: [] }
|
|--------------------------------------------------------------------------
*/

const extractArray = (response, property = null) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response) {
    return [];
  }

  if (property && Array.isArray(response[property])) {
    return response[property];
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Load Products
|--------------------------------------------------------------------------
*/

const loadProducts = async () => {
  console.log("🔥 ADMIN PRODUCTS - LOADING");

  try {
    const response = await useAdminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RAW RESPONSE:", response);

    const result = extractArray(response, "products");

    console.log("🔥 ADMIN PRODUCTS ARRAY:", result);

    products.value = result;

    console.log("🔥 PRODUCTS COUNT:", products.value.length);
  } catch (error) {
    console.error("🔥 ADMIN PRODUCTS ERROR:", error);

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
  console.log("🔥 ADMIN CATEGORIES - LOADING");

  try {
    /*
     * IMPORTANT:
     *
     * This is the endpoint we have been using for
     * the admin categories.
     */
    const response = await useAdminFetch("/api/admin/categories");

    console.log("🔥 ADMIN CATEGORIES RAW RESPONSE:", response);

    const result = extractArray(response, "categories");

    console.log("🔥 ADMIN CATEGORIES ARRAY:", result);

    categories.value = result;

    console.log("🔥 CATEGORIES COUNT:", categories.value.length);
  } catch (error) {
    console.error("🔥 ADMIN CATEGORIES ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load categories.";
  }
};

/*
|--------------------------------------------------------------------------
| Category Hierarchy
|--------------------------------------------------------------------------
*/

const mainCategories = computed(() => {
  console.log("🔥 BUILDING CATEGORY HIERARCHY");

  console.log("PRODUCTS:", products.value);

  console.log("CATEGORIES:", categories.value);

  if (!products.value.length || !categories.value.length) {
    return [];
  }

  /*
   * Map categories by ID
   */
  const categoryMap = new Map();

  categories.value.forEach((category) => {
    categoryMap.set(Number(category.id), {
      ...category,
      id: Number(category.id),
      parent_id:
        category.parent_id === null || category.parent_id === undefined
          ? null
          : Number(category.parent_id),
      children: [],
      products: [],
    });
  });

  /*
   * Put products into categories
   */
  products.value.forEach((product) => {
    const categoryId = Number(product.category_id);

    const category = categoryMap.get(categoryId);

    if (category) {
      category.products.push(product);
    } else {
      console.warn(
        "⚠️ PRODUCT CATEGORY NOT FOUND:",
        product.name,
        product.category_id,
      );
    }
  });

  /*
   * Build parent / child relationship
   */
  categories.value.forEach((category) => {
    const current = categoryMap.get(Number(category.id));

    if (!current) {
      return;
    }

    if (category.parent_id !== null && category.parent_id !== undefined) {
      const parent = categoryMap.get(Number(category.parent_id));

      if (parent) {
        parent.children.push(current);
      }
    }
  });

  /*
   * Main categories
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
  main.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  /*
   * Sort children and products
   */
  main.forEach((category) => {
    category.children.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );

    category.products.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );

    category.children.forEach((subcategory) => {
      subcategory.products.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
    });
  });

  console.log("🔥 FINAL CATEGORY HIERARCHY:", main);

  return main;
});

/*
|--------------------------------------------------------------------------
| Product Count
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
| Toggle Category
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

/*
|--------------------------------------------------------------------------
| Is Category Open
|--------------------------------------------------------------------------
*/

const isCategoryOpen = (id) => {
  return openCategories.value.has(id);
};

/*
|--------------------------------------------------------------------------
| Load Everything
|--------------------------------------------------------------------------
*/

const load = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    await Promise.all([loadProducts(), loadCategories()]);
  } finally {
    loading.value = false;
  }
};

await load();
</script>
