<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ====================================================== -->
    <!-- HEADER -->
    <!-- ====================================================== -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Products</h1>

        <p class="text-gray-500 mt-1">
          Manage your products, categories, stock and pricing.
        </p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- ====================================================== -->
    <!-- ERROR -->
    <!-- ====================================================== -->

    <div
      v-if="errorMessage"
      class="mb-6 bg-red-100 border border-red-300 text-red-700 rounded-lg p-4"
    >
      {{ errorMessage }}
    </div>

    <!-- ====================================================== -->
    <!-- LOADING -->
    <!-- ====================================================== -->

    <div
      v-if="loading"
      class="bg-white rounded-xl shadow p-12 flex flex-col items-center justify-center min-h-[350px]"
    >
      <!-- Animated spinner -->

      <div class="relative w-20 h-20">
        <div
          class="absolute inset-0 rounded-full border-4 border-gray-200"
        ></div>

        <div
          class="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"
        ></div>
      </div>

      <p class="mt-6 text-lg font-semibold text-slate-700">
        Loading products...
      </p>

      <p class="mt-1 text-sm text-gray-500">
        Please wait while we load your products.
      </p>
    </div>

    <!-- ====================================================== -->
    <!-- CONTENT -->
    <!-- ====================================================== -->

    <div v-else>
      <!-- ==================================================== -->
      <!-- SUMMARY -->
      <!-- ==================================================== -->

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <!-- Products -->

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Products</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ products.length }}
          </p>
        </div>

        <!-- Categories -->

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Categories</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ categories.length }}
          </p>
        </div>

        <!-- Main Categories -->

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Main Categories</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ mainCategories.length }}
          </p>
        </div>
      </div>

      <!-- ==================================================== -->
      <!-- NO PRODUCTS -->
      <!-- ==================================================== -->

      <div
        v-if="products.length === 0"
        class="bg-white rounded-xl shadow p-12 text-center"
      >
        <div class="text-5xl mb-4">📦</div>

        <h2 class="text-xl font-bold text-slate-800">No products found</h2>

        <p class="text-gray-500 mt-2">
          There are currently no products to display.
        </p>

        <NuxtLink
          to="/admin/products/new"
          class="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
        >
          Add Your First Product
        </NuxtLink>
      </div>

      <!-- ==================================================== -->
      <!-- CATEGORY HIERARCHY -->
      <!-- ==================================================== -->

      <div v-else class="space-y-6">
        <!-- ================================================== -->
        <!-- MAIN CATEGORY -->
        <!-- ================================================== -->

        <div
          v-for="category in categoryHierarchy"
          :key="category.id"
          class="bg-white rounded-xl shadow overflow-visible"
        >
          <!-- ================================================ -->
          <!-- CATEGORY HEADER -->
          <!-- ================================================ -->

          <button
            type="button"
            @click="toggleCategory(category.id)"
            class="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition rounded-xl"
          >
            <div class="flex items-center gap-4">
              <!-- Arrow -->

              <span
                class="text-xl transition-transform duration-200"
                :class="{
                  'rotate-90': expandedCategories.has(category.id),
                }"
              >
                ▶
              </span>

              <!-- Category -->

              <div class="text-left">
                <h2 class="text-xl font-bold text-slate-800">
                  {{ category.name }}
                </h2>

                <p class="text-sm text-gray-500 mt-1">
                  {{ category.products.length }}

                  {{ category.products.length === 1 ? "product" : "products" }}

                  <span v-if="category.children.length">
                    ·

                    {{ category.children.length }}

                    {{
                      category.children.length === 1
                        ? "subcategory"
                        : "subcategories"
                    }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Product count -->

            <span
              class="hidden sm:inline-flex items-center justify-center min-w-10 h-10 px-3 bg-blue-100 text-blue-700 font-bold rounded-full"
            >
              {{ category.totalProducts }}
            </span>
          </button>

          <!-- ================================================ -->
          <!-- CATEGORY CONTENT -->
          <!-- ================================================ -->

          <div
            v-if="expandedCategories.has(category.id)"
            class="border-t border-gray-200"
          >
            <!-- ============================================== -->
            <!-- MAIN CATEGORY PRODUCTS -->
            <!-- ============================================== -->

            <div v-if="category.products.length" class="p-6">
              <h3
                class="text-sm uppercase tracking-wide font-bold text-gray-500 mb-4"
              >
                {{ category.name }}
              </h3>

              <div class="space-y-3">
                <ProductRow
                  v-for="product in category.products"
                  :key="product.id"
                  :product="product"
                  :menu-open="openMenuId === product.id"
                  @toggle-menu="toggleMenu(product.id)"
                  @delete="deleteProduct(product)"
                />
              </div>
            </div>

            <!-- ============================================== -->
            <!-- SUB CATEGORIES -->
            <!-- ============================================== -->

            <div v-if="category.children.length" class="px-6 pb-6 space-y-5">
              <div
                v-for="child in category.children"
                :key="child.id"
                class="border border-gray-200 rounded-xl overflow-visible"
              >
                <!-- ========================================== -->
                <!-- SUB CATEGORY HEADER -->
                <!-- ========================================== -->

                <div
                  class="bg-gray-50 px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <h3 class="font-bold text-slate-700">
                      {{ child.name }}
                    </h3>

                    <p class="text-sm text-gray-500 mt-1">
                      {{ child.products.length }}

                      {{ child.products.length === 1 ? "product" : "products" }}
                    </p>
                  </div>

                  <span
                    class="inline-flex items-center justify-center min-w-9 h-9 px-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-full"
                  >
                    {{ child.products.length }}
                  </span>
                </div>

                <!-- ========================================== -->
                <!-- SUB CATEGORY PRODUCTS -->
                <!-- ========================================== -->

                <div v-if="child.products.length" class="p-5 space-y-3">
                  <ProductRow
                    v-for="product in child.products"
                    :key="product.id"
                    :product="product"
                    :menu-open="openMenuId === product.id"
                    @toggle-menu="toggleMenu(product.id)"
                    @delete="deleteProduct(product)"
                  />
                </div>

                <!-- ========================================== -->
                <!-- EMPTY SUB CATEGORY -->
                <!-- ========================================== -->

                <div v-else class="p-5 text-sm text-gray-400">
                  No products in this category.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====================================================== -->
    <!-- DELETE CONFIRMATION -->
    <!-- ====================================================== -->

    <div
      v-if="productToDelete"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl"
          >
            ⚠
          </div>

          <div>
            <h2 class="text-xl font-bold text-slate-800">Delete Product?</h2>

            <p class="text-gray-600 mt-2">
              Are you sure you really want to delete this product?
            </p>

            <p class="font-semibold text-slate-800 mt-3">
              {{ productToDelete.name }}
            </p>

            <p class="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            @click="cancelDelete"
            :disabled="deleting"
            class="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            @click="confirmDelete"
            :disabled="deleting"
            class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
          >
            {{ deleting ? "Deleting..." : "Yes, Delete Product" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ======================================================
// PAGE META
// ======================================================

definePageMeta({
  middleware: "admin",
});

// ======================================================
// ADMIN FETCH
// ======================================================

const adminFetch = useAdminFetch();

// ======================================================
// STATE
// ======================================================

const loading = ref(true);

const errorMessage = ref("");

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

// ======================================================
// MENU
// ======================================================

// Only one product menu can be open at a time.

const openMenuId = ref<number | null>(null);

// ======================================================
// CATEGORY EXPANSION
// ======================================================

// Categories start collapsed.

const expandedCategories = ref<Set<number>>(new Set());

// ======================================================
// DELETE
// ======================================================

const productToDelete = ref<any | null>(null);

const deleting = ref(false);

// ======================================================
// MAIN CATEGORIES
// ======================================================

const mainCategories = computed(() => {
  return categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
});

// ======================================================
// CATEGORY HIERARCHY
// ======================================================

const categoryHierarchy = computed(() => {
  const parents = categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  return parents.map((parent) => {
    // ----------------------------------------------
    // Products directly in main category
    // ----------------------------------------------

    const parentProducts = products.value
      .filter((product) => Number(product.category_id) === Number(parent.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    // ----------------------------------------------
    // Sub categories
    // ----------------------------------------------

    const children = categories.value
      .filter((category) => Number(category.parent_id) === Number(parent.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
      .map((child) => {
        const childProducts = products.value
          .filter((product) => Number(product.category_id) === Number(child.id))
          .sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || "")),
          );

        return {
          ...child,
          products: childProducts,
        };
      });

    // ----------------------------------------------
    // Total products including children
    // ----------------------------------------------

    const totalProducts =
      parentProducts.length +
      children.reduce((total, child) => total + child.products.length, 0);

    return {
      ...parent,
      products: parentProducts,
      children,
      totalProducts,
    };
  });
});

// ======================================================
// TOGGLE CATEGORY
// ======================================================

const toggleCategory = (categoryId: number) => {
  const newSet = new Set(expandedCategories.value);

  if (newSet.has(categoryId)) {
    newSet.delete(categoryId);
  } else {
    newSet.add(categoryId);
  }

  expandedCategories.value = newSet;
};

// ======================================================
// TOGGLE PRODUCT MENU
// ======================================================

const toggleMenu = (productId: number) => {
  if (openMenuId.value === productId) {
    // Close current menu

    openMenuId.value = null;
  } else {
    // Close previous menu and open new one

    openMenuId.value = productId;
  }
};

// ======================================================
// LOAD PRODUCTS
// ======================================================

const loadProducts = async () => {
  try {
    console.log("🔥 LOAD PRODUCTS STARTED");

    const response = await adminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:", response);

    if (Array.isArray(response)) {
      products.value = response;
    } else if (response?.products) {
      products.value = response.products;
    } else {
      products.value = [];
    }

    console.log("🔥 PRODUCTS STORED:", products.value);
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCTS ERROR:", error);

    throw error;
  }
};

// ======================================================
// LOAD CATEGORIES
// ======================================================

const loadCategories = async () => {
  try {
    console.log("🔥 LOADING CATEGORIES");

    const response = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:", response);

    if (Array.isArray(response)) {
      categories.value = response;
    } else if (response?.categories) {
      categories.value = response.categories;
    } else {
      categories.value = [];
    }
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    throw error;
  }
};

// ======================================================
// DELETE REQUEST
// ======================================================

const deleteProduct = (product: any) => {
  // Close product menu

  openMenuId.value = null;

  // Open confirmation dialog

  productToDelete.value = product;
};

// ======================================================
// CANCEL DELETE
// ======================================================

const cancelDelete = () => {
  if (deleting.value) {
    return;
  }

  productToDelete.value = null;
};

// ======================================================
// CONFIRM DELETE
// ======================================================

const confirmDelete = async () => {
  if (!productToDelete.value) {
    return;
  }

  deleting.value = true;

  errorMessage.value = "";

  try {
    const id = productToDelete.value.id;

    console.log("🔥 DELETING PRODUCT:", id);

    await adminFetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    // ----------------------------------------------
    // Remove product locally
    // ----------------------------------------------

    products.value = products.value.filter(
      (product) => Number(product.id) !== Number(id),
    );

    console.log("✅ PRODUCT DELETED:", id);

    // Close confirmation

    productToDelete.value = null;
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete product.";
  } finally {
    deleting.value = false;
  }
};

// ======================================================
// LOAD PAGE
// ======================================================

const load = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    await Promise.all([loadProducts(), loadCategories()]);
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

// ======================================================
// MOUNT
// ======================================================

onMounted(() => {
  load();
});
</script>
