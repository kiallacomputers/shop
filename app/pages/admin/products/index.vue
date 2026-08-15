<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ========================================================= -->
    <!-- HEADER -->
    <!-- ========================================================= -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Product Management</h1>

        <p class="text-gray-500 mt-1">
          Manage products, stock, images and descriptions.
        </p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg transition"
      >
        <span class="text-xl">+</span>
        Add Product
      </NuxtLink>
    </div>

    <!-- ========================================================= -->
    <!-- LOADING -->
    <!-- ========================================================= -->

    <div
      v-if="loading"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center"
    >
      <div
        class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
      ></div>

      <p class="mt-5 text-gray-600 font-medium">Loading products...</p>

      <p class="text-sm text-gray-400 mt-1">
        Please wait while we load your catalogue.
      </p>
    </div>

    <!-- ========================================================= -->
    <!-- ERROR -->
    <!-- ========================================================= -->

    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5"
    >
      <div class="font-semibold mb-1">Unable to load products</div>

      <div class="text-sm">
        {{ errorMessage }}
      </div>

      <button
        type="button"
        @click="loadData"
        class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
      >
        Try Again
      </button>
    </div>

    <!-- ========================================================= -->
    <!-- CONTENT -->
    <!-- ========================================================= -->

    <div v-else>
      <!-- SUMMARY -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">Products</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ products.length }}
          </p>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">Categories</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ mainCategories.length }}
          </p>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">In Stock</p>

          <p class="text-3xl font-bold text-green-600 mt-1">
            {{ inStockCount }}
          </p>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- NO PRODUCTS -->
      <!-- ======================================================= -->

      <div
        v-if="products.length === 0"
        class="bg-white rounded-xl border border-gray-200 p-12 text-center"
      >
        <div class="text-5xl mb-4">📦</div>

        <h2 class="text-xl font-bold text-slate-800">No products found</h2>

        <p class="text-gray-500 mt-2">
          There are currently no products to display.
        </p>
      </div>

      <!-- ======================================================= -->
      <!-- CATEGORY HIERARCHY -->
      <!-- ======================================================= -->

      <div v-else class="space-y-6">
        <div
          v-for="mainCategory in sortedCategoryTree"
          :key="mainCategory.id"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible"
        >
          <!-- =================================================== -->
          <!-- MAIN CATEGORY HEADER -->
          <!-- =================================================== -->

          <button
            type="button"
            @click="toggleCategory(mainCategory.id)"
            class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition rounded-xl"
          >
            <div class="flex items-center gap-3">
              <!-- Chevron -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-gray-500 transition-transform duration-200"
                :class="{
                  'rotate-90': isCategoryOpen(mainCategory.id),
                }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>

              <!-- Folder -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                />
              </svg>

              <div class="text-left">
                <h2 class="font-bold text-lg text-slate-800">
                  {{ mainCategory.name }}
                </h2>

                <p class="text-xs text-gray-500">
                  {{ mainCategory.totalProducts }}
                  {{
                    mainCategory.totalProducts === 1 ? "product" : "products"
                  }}
                </p>
              </div>
            </div>

            <span
              class="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
            >
              {{ mainCategory.totalProducts }}
            </span>
          </button>

          <!-- =================================================== -->
          <!-- MAIN CATEGORY CONTENT -->
          <!-- =================================================== -->

          <div
            v-if="isCategoryOpen(mainCategory.id)"
            class="px-4 pb-5 overflow-visible"
          >
            <!-- =============================================== -->
            <!-- DIRECT PRODUCTS -->
            <!-- =============================================== -->

            <div v-if="mainCategory.products.length" class="mb-5">
              <div
                class="text-sm font-semibold text-gray-500 px-3 py-2 border-b border-gray-200"
              >
                {{ mainCategory.name }}
              </div>

              <div class="space-y-2 mt-2">
                <ProductItem
                  v-for="product in mainCategory.products"
                  :key="product.id"
                  :product="product"
                  :open-menu="openMenu"
                  @toggle-menu="toggleMenu"
                  @close-menu="closeMenu"
                  @delete="confirmDelete"
                />
              </div>
            </div>

            <!-- =============================================== -->
            <!-- SUB CATEGORIES -->
            <!-- =============================================== -->

            <div
              v-for="subCategory in mainCategory.children"
              :key="subCategory.id"
              class="mb-4 overflow-visible"
            >
              <!-- Subcategory heading -->
              <div
                class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 13h6m-3-3v6m-7 5h14a2 2 0 002-2V8.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 0014.172 2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>

                <div>
                  <h3 class="font-semibold text-slate-700">
                    {{ subCategory.name }}
                  </h3>

                  <p class="text-xs text-gray-500">
                    {{ subCategory.products.length }}
                    {{
                      subCategory.products.length === 1 ? "product" : "products"
                    }}
                  </p>
                </div>
              </div>

              <!-- Subcategory products -->
              <div
                v-if="subCategory.products.length"
                class="space-y-2 mt-2 ml-3 overflow-visible"
              >
                <ProductItem
                  v-for="product in subCategory.products"
                  :key="product.id"
                  :product="product"
                  :open-menu="openMenu"
                  @toggle-menu="toggleMenu"
                  @close-menu="closeMenu"
                  @delete="confirmDelete"
                />
              </div>

              <div v-else class="ml-3 px-4 py-3 text-sm text-gray-400">
                No products in this sub-category.
              </div>
            </div>

            <!-- No products anywhere -->
            <div
              v-if="
                mainCategory.products.length === 0 &&
                mainCategory.children.every(
                  (child) => child.products.length === 0,
                )
              "
              class="text-sm text-gray-400 px-3 py-4"
            >
              No products in this category.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- DELETE CONFIRMATION -->
    <!-- ========================================================= -->

    <div
      v-if="deleteProductTarget"
      class="fixed inset-0 z-[100000] bg-black/50 flex items-center justify-center px-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86l-7.1 12.27A2 2 0 004.92 19h14.16a2 2 0 001.73-2.87l-7.1-12.27a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>

          <div>
            <h2 class="text-xl font-bold text-slate-800">Delete Product?</h2>

            <p class="text-gray-600 mt-2">
              Are you sure you really want to delete:
            </p>

            <p class="font-semibold text-slate-800 mt-2">
              {{ deleteProductTarget.name }}
            </p>

            <p class="text-sm text-red-600 mt-3">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-7">
          <button
            type="button"
            @click="cancelDelete"
            class="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            @click="deleteProduct"
            :disabled="deleting"
            class="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white transition"
          >
            {{ deleting ? "Deleting..." : "Yes, Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MESSAGE -->
    <!-- ========================================================= -->

    <div
      v-if="successMessage"
      class="fixed bottom-6 right-6 z-[100001] bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl"
    >
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

import ProductItem from "~/components/admin/ProductItem.vue";

const adminFetch = useAdminFetch();

const products = ref<any[]>([]);
const categories = ref<any[]>([]);

const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

const openCategories = ref<number[]>([]);

const openMenu = ref<number | null>(null);

const deleteProductTarget = ref<any | null>(null);

const deleting = ref(false);

/* ================================================================
   LOAD DATA
================================================================ */

const loadData = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    console.log("🔥 ADMIN PRODUCTS: Loading products");

    const [productResponse, categoryResponse] = await Promise.all([
      adminFetch("/api/admin/products"),
      adminFetch("/api/admin/categories"),
    ]);

    console.log("🔥 PRODUCTS RESPONSE:", productResponse);
    console.log("🔥 CATEGORIES RESPONSE:", categoryResponse);

    products.value = Array.isArray(productResponse)
      ? productResponse
      : productResponse?.products || [];

    categories.value = Array.isArray(categoryResponse)
      ? categoryResponse
      : categoryResponse?.categories || [];

    console.log("🔥 PRODUCTS LOADED:", products.value.length);

    console.log("🔥 CATEGORIES LOADED:", categories.value.length);
  } catch (error: any) {
    console.error("🔥 ADMIN PRODUCTS LOAD ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load products.";
  } finally {
    loading.value = false;
  }
};

/* ================================================================
   CATEGORY TREE
================================================================ */

const sortedCategoryTree = computed(() => {
  const parents = categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  return parents.map((parent) => {
    const children = categories.value
      .filter((category) => category.parent_id === parent.id)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const directProducts = products.value
      .filter((product) => product.category_id === parent.id)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const childCategories = children.map((child) => {
      const childProducts = products.value
        .filter((product) => product.category_id === child.id)
        .sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || "")),
        );

      return {
        ...child,
        products: childProducts,
      };
    });

    const totalProducts =
      directProducts.length +
      childCategories.reduce(
        (total, child) => total + child.products.length,
        0,
      );

    return {
      ...parent,
      products: directProducts,
      children: childCategories,
      totalProducts,
    };
  });
});

/* ================================================================
   MAIN CATEGORIES
================================================================ */

const mainCategories = computed(() => {
  return sortedCategoryTree.value;
});

/* ================================================================
   STOCK COUNT
================================================================ */

const inStockCount = computed(() => {
  return products.value.filter((product) => Number(product.stock || 0) > 0)
    .length;
});

/* ================================================================
   CATEGORY COLLAPSE
================================================================ */

const toggleCategory = (id: number) => {
  const index = openCategories.value.indexOf(id);

  if (index === -1) {
    openCategories.value.push(id);
  } else {
    openCategories.value.splice(index, 1);
  }
};

const isCategoryOpen = (id: number) => {
  return openCategories.value.includes(id);
};

/* ================================================================
   MENU
================================================================ */

const toggleMenu = (id: number) => {
  if (openMenu.value === id) {
    openMenu.value = null;
  } else {
    openMenu.value = id;
  }
};

const closeMenu = () => {
  openMenu.value = null;
};

/* ================================================================
   DELETE
================================================================ */

const confirmDelete = (product: any) => {
  closeMenu();

  deleteProductTarget.value = product;
};

const cancelDelete = () => {
  if (deleting.value) {
    return;
  }

  deleteProductTarget.value = null;
};

const deleteProduct = async () => {
  if (!deleteProductTarget.value) {
    return;
  }

  deleting.value = true;

  try {
    const product = deleteProductTarget.value;

    console.log("🔥 DELETING PRODUCT:", product.id);

    await adminFetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });

    products.value = products.value.filter((item) => item.id !== product.id);

    successMessage.value = "Product deleted successfully.";

    deleteProductTarget.value = null;

    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete product.";

    deleteProductTarget.value = null;
  } finally {
    deleting.value = false;
  }
};

/* ================================================================
   CLOSE MENU WHEN CLICKING OUTSIDE
================================================================ */

const handleDocumentClick = () => {
  closeMenu();
};

/* ================================================================
   LOAD
================================================================ */

onMounted(async () => {
  document.addEventListener("click", handleDocumentClick);

  await loadData();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>
