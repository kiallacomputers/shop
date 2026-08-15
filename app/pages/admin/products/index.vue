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
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition"
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
      v-else-if="products.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-8 text-center"
    >
      <p class="text-gray-500">No products found.</p>

      <p class="text-sm text-gray-400 mt-2">
        Products loaded: {{ products.length }}
      </p>

      <p class="text-sm text-gray-400">
        Categories loaded: {{ categories.length }}
      </p>
    </div>

    <!-- Category hierarchy -->
    <div v-else class="space-y-4">
      <!-- MAIN CATEGORY -->
      <div
        v-for="category in categoryHierarchy"
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
                'rotate-90': isOpen(category.id),
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
                {{ getTotalProducts(category) }}
                product{{ getTotalProducts(category) === 1 ? "" : "s" }}
              </p>
            </div>
          </div>

          <span class="text-sm text-gray-400">
            {{ isOpen(category.id) ? "Collapse" : "Expand" }}
          </span>
        </button>

        <!-- Main category content -->
        <div v-if="isOpen(category.id)" class="border-t border-gray-200">
          <!-- Products directly in main category -->
          <div v-if="category.products.length" class="p-4">
            <AdminProductTable :products="category.products" />
          </div>

          <!-- Sub categories -->
          <div
            v-for="subcategory in category.children"
            :key="subcategory.id"
            class="border-t border-gray-200"
          >
            <!-- Sub category header -->
            <button
              type="button"
              @click="toggleCategory(subcategory.id)"
              class="w-full flex items-center justify-between px-8 py-4 bg-gray-50 hover:bg-gray-100 transition text-left"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="w-4 h-4 text-gray-500 transition-transform duration-200"
                  :class="{
                    'rotate-90': isOpen(subcategory.id),
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
                {{ isOpen(subcategory.id) ? "Collapse" : "Expand" }}
              </span>
            </button>

            <!-- Sub category products -->
            <div v-if="isOpen(subcategory.id)" class="p-4">
              <AdminProductTable
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

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

/*
|--------------------------------------------------------------------------
| Admin fetch
|--------------------------------------------------------------------------
*/

const adminFetch = useAdminFetch();

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const loading = ref(true);

const errorMessage = ref("");

const openCategories = ref<Set<number>>(new Set());

/*
|--------------------------------------------------------------------------
| Load Products
|--------------------------------------------------------------------------
*/

const loadProducts = async () => {
  console.log("🔥 LOAD PRODUCTS STARTED");

  try {
    const response = await adminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:", response);

    /*
     * Your API returns the array directly.
     */
    if (Array.isArray(response)) {
      products.value = response;
    } else if (response && Array.isArray(response.products)) {
      products.value = response.products;
    } else if (response && Array.isArray(response.data)) {
      products.value = response.data;
    } else {
      products.value = [];
    }

    console.log("🔥 PRODUCTS STORED:", products.value);
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCTS ERROR:", error);

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
  console.log("🔥 LOADING CATEGORIES");

  try {
    const response = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:", response);

    /*
     * Your categories API returns an array.
     */
    if (Array.isArray(response)) {
      categories.value = response;
    } else if (response && Array.isArray(response.categories)) {
      categories.value = response.categories;
    } else if (response && Array.isArray(response.data)) {
      categories.value = response.data;
    } else {
      categories.value = [];
    }

    console.log("🔥 CATEGORIES STORED:", categories.value);
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load categories.";
  }
};

/*
|--------------------------------------------------------------------------
| Build hierarchy
|--------------------------------------------------------------------------
*/

const categoryHierarchy = computed(() => {
  if (!categories.value.length) {
    return [];
  }

  /*
   * Create category objects
   */
  const map = new Map<number, any>();

  categories.value.forEach((category) => {
    map.set(Number(category.id), {
      ...category,
      id: Number(category.id),
      parent_id:
        category.parent_id === null || category.parent_id === undefined
          ? null
          : Number(category.parent_id),
      products: [],
      children: [],
    });
  });

  /*
   * Put products into categories
   */
  products.value.forEach((product) => {
    const categoryId = Number(product.category_id);

    const category = map.get(categoryId);

    if (category) {
      category.products.push(product);
    } else {
      console.warn(
        "⚠️ CATEGORY NOT FOUND FOR PRODUCT:",
        product.name,
        product.category_id,
      );
    }
  });

  /*
   * Build parent/child hierarchy
   */
  map.forEach((category) => {
    if (category.parent_id !== null) {
      const parent = map.get(category.parent_id);

      if (parent) {
        parent.children.push(category);
      }
    }
  });

  /*
   * Get main categories
   */
  const mainCategories = Array.from(map.values()).filter(
    (category) => category.parent_id === null,
  );

  /*
   * Sort main categories
   */
  mainCategories.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  /*
   * Sort everything
   */
  mainCategories.forEach((category) => {
    category.products.sort(sortProducts);

    category.children.sort(sortCategories);

    category.children.forEach((child: any) => {
      child.products.sort(sortProducts);
    });
  });

  console.log("🔥 CATEGORY HIERARCHY:", mainCategories);

  return mainCategories;
});

/*
|--------------------------------------------------------------------------
| Sort categories
|--------------------------------------------------------------------------
*/

const sortCategories = (a: any, b: any) => {
  return String(a.name || "").localeCompare(String(b.name || ""));
};

/*
|--------------------------------------------------------------------------
| Sort products
|--------------------------------------------------------------------------
*/

const sortProducts = (a: any, b: any) => {
  return String(a.name || "").localeCompare(String(b.name || ""));
};

/*
|--------------------------------------------------------------------------
| Toggle category
|--------------------------------------------------------------------------
*/

const toggleCategory = (id: number) => {
  const updated = new Set(openCategories.value);

  if (updated.has(id)) {
    updated.delete(id);
  } else {
    updated.add(id);
  }

  openCategories.value = updated;
};

/*
|--------------------------------------------------------------------------
| Is open
|--------------------------------------------------------------------------
*/

const isOpen = (id: number) => {
  return openCategories.value.has(id);
};

/*
|--------------------------------------------------------------------------
| Product count
|--------------------------------------------------------------------------
*/

const getTotalProducts = (category: any) => {
  let count = category.products.length;

  category.children.forEach((child: any) => {
    count += child.products.length;
  });

  return count;
};

/*
|--------------------------------------------------------------------------
| Load
|--------------------------------------------------------------------------
*/

const load = async () => {
  loading.value = true;

  errorMessage.value = "";

  await Promise.all([loadProducts(), loadCategories()]);

  loading.value = false;
};

await load();
</script>
