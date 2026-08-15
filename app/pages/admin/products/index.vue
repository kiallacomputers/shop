<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ================================================= -->
    <!-- HEADER -->
    <!-- ================================================= -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Products</h1>

        <p class="text-gray-500 mt-1">
          Manage your products, stock, images and descriptions.
        </p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
      >
        <span class="text-xl">+</span>
        Add Product
      </NuxtLink>
    </div>

    <!-- ================================================= -->
    <!-- LOADING -->
    <!-- ================================================= -->

    <div
      v-if="loading"
      class="bg-white rounded-xl shadow p-12 flex flex-col items-center justify-center"
    >
      <div
        class="w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"
      ></div>

      <p class="mt-5 text-gray-600 font-medium">Loading products...</p>

      <p class="text-sm text-gray-400 mt-1">Please wait</p>
    </div>

    <!-- ================================================= -->
    <!-- ERROR -->
    <!-- ================================================= -->

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

    <!-- ================================================= -->
    <!-- CONTENT -->
    <!-- ================================================= -->

    <div v-else>
      <!-- ================================================= -->
      <!-- SUMMARY -->
      <!-- ================================================= -->

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Products</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ products.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Categories</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ categories.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Main Categories</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ mainCategories.length }}
          </p>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- NO PRODUCTS -->
      <!-- ================================================= -->

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
          class="inline-block mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
        >
          Add Product
        </NuxtLink>
      </div>

      <!-- ================================================= -->
      <!-- CATEGORY GROUPS -->
      <!-- ================================================= -->

      <div v-else class="space-y-6">
        <section
          v-for="category in categoryGroups"
          :key="category.id"
          class="bg-white rounded-xl shadow overflow-visible"
        >
          <!-- ================================================= -->
          <!-- MAIN CATEGORY HEADER -->
          <!-- ================================================= -->

          <button
            type="button"
            @click="toggleCategory(category.id)"
            class="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition text-left"
          >
            <div class="flex items-center gap-3">
              <!-- Arrow -->

              <span
                class="w-6 h-6 flex items-center justify-center text-gray-500 transition-transform duration-200"
                :class="{
                  'rotate-90': !collapsedCategories.has(category.id),
                }"
              >
                ▶
              </span>

              <div>
                <h2 class="text-xl font-bold text-slate-800">
                  {{ category.name }}
                </h2>

                <p class="text-sm text-gray-500">
                  {{ category.totalProducts }}
                  {{ category.totalProducts === 1 ? "product" : "products" }}
                </p>
              </div>
            </div>

            <span class="text-sm text-gray-400">
              {{ category.children.length }}
              {{
                category.children.length === 1 ? "subcategory" : "subcategories"
              }}
            </span>
          </button>

          <!-- ================================================= -->
          <!-- MAIN CATEGORY CONTENT -->
          <!-- ================================================= -->

          <div
            v-show="!collapsedCategories.has(category.id)"
            class="border-t border-gray-200"
          >
            <!-- ================================================= -->
            <!-- PRODUCTS DIRECTLY IN MAIN CATEGORY -->
            <!-- ================================================= -->

            <div v-if="category.products.length" class="p-4">
              <div
                class="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3"
              >
                {{ category.name }}
              </div>

              <div class="space-y-2">
                <ProductItem
                  v-for="product in category.products"
                  :key="product.id"
                  :product="product"
                  :open-menu-id="openMenuId"
                  @toggle-menu="toggleMenu"
                  @delete="deleteProduct"
                />
              </div>
            </div>

            <!-- ================================================= -->
            <!-- SUBCATEGORIES -->
            <!-- ================================================= -->

            <div
              v-for="subcategory in category.children"
              :key="subcategory.id"
              class="border-t border-gray-100"
            >
              <!-- Subcategory heading -->

              <div class="px-6 py-4 bg-gray-50">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-slate-700">
                    <span class="text-gray-400 mr-2"> └─ </span>

                    {{ subcategory.name }}
                  </h3>

                  <span class="text-sm text-gray-400">
                    {{ subcategory.products.length }}
                    {{
                      subcategory.products.length === 1 ? "product" : "products"
                    }}
                  </span>
                </div>
              </div>

              <!-- Subcategory products -->

              <div v-if="subcategory.products.length" class="p-4">
                <div class="space-y-2">
                  <ProductItem
                    v-for="product in subcategory.products"
                    :key="product.id"
                    :product="product"
                    :open-menu-id="openMenuId"
                    @toggle-menu="toggleMenu"
                    @delete="deleteProduct"
                  />
                </div>
              </div>

              <div v-else class="px-6 py-4 text-sm text-gray-400">
                No products in this subcategory.
              </div>
            </div>

            <!-- ================================================= -->
            <!-- EMPTY CATEGORY -->
            <!-- ================================================= -->

            <div
              v-if="
                category.products.length === 0 && category.children.length === 0
              "
              class="p-8 text-center text-gray-400"
            >
              No products in this category.
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- DELETE CONFIRMATION -->
    <!-- ================================================= -->

    <div
      v-if="deleteDialog"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <!-- Background -->

      <div class="absolute inset-0 bg-black/50" @click="cancelDelete"></div>

      <!-- Dialog -->

      <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div
          class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mb-4"
        >
          🗑
        </div>

        <h2 class="text-xl font-bold text-slate-800">Delete Product?</h2>

        <p class="text-gray-600 mt-2">
          Are you sure you really want to delete this product?
        </p>

        <p v-if="productToDelete" class="font-semibold text-slate-800 mt-3">
          {{ productToDelete.name }}
        </p>

        <p class="text-sm text-red-600 mt-3">This action cannot be undone.</p>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            @click="cancelDelete"
            :disabled="deleting"
            class="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Cancel
          </button>

          <button
            type="button"
            @click="confirmDelete"
            :disabled="deleting"
            class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {{ deleting ? "Deleting..." : "Yes, Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- DELETE ERROR -->
    <!-- ================================================= -->

    <div
      v-if="deleteError"
      class="fixed bottom-6 right-6 z-[110] bg-red-600 text-white px-5 py-4 rounded-lg shadow-xl max-w-sm"
    >
      <div class="font-semibold">Delete failed</div>

      <div class="text-sm mt-1">
        {{ deleteError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const errorMessage = ref("");

const openMenuId = ref<number | null>(null);

const collapsedCategories = ref<Set<number>>(new Set());

const deleteDialog = ref(false);

const productToDelete = ref<any | null>(null);

const deleting = ref(false);

const deleteError = ref("");

// ======================================================
// MAIN CATEGORIES
// ======================================================

const mainCategories = computed(() => {
  return categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
});

// ======================================================
// CATEGORY GROUPS
// ======================================================

const categoryGroups = computed(() => {
  const parents = mainCategories.value;

  return parents.map((parent) => {
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

    const parentProducts = products.value
      .filter((product) => Number(product.category_id) === Number(parent.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

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
// LOAD DATA
// ======================================================

const loadData = async () => {
  loading.value = true;

  errorMessage.value = "";

  openMenuId.value = null;

  try {
    console.log("🔥 ADMIN PRODUCTS: Loading...");

    const [productResponse, categoryResponse] = await Promise.all([
      adminFetch("/api/admin/products"),
      adminFetch("/api/admin/categories"),
    ]);

    console.log("🔥 PRODUCTS RESPONSE:", productResponse);

    console.log("🔥 CATEGORIES RESPONSE:", categoryResponse);

    // ----------------------------------------------
    // PRODUCTS
    // ----------------------------------------------

    if (Array.isArray(productResponse)) {
      products.value = productResponse;
    } else if (productResponse && Array.isArray(productResponse.products)) {
      products.value = productResponse.products;
    } else if (productResponse && Array.isArray(productResponse.data)) {
      products.value = productResponse.data;
    } else {
      products.value = [];
    }

    // ----------------------------------------------
    // CATEGORIES
    // ----------------------------------------------

    if (Array.isArray(categoryResponse)) {
      categories.value = categoryResponse;
    } else if (categoryResponse && Array.isArray(categoryResponse.categories)) {
      categories.value = categoryResponse.categories;
    } else if (categoryResponse && Array.isArray(categoryResponse.data)) {
      categories.value = categoryResponse.data;
    } else {
      categories.value = [];
    }

    console.log(`🔥 ${products.value.length} products loaded`);

    console.log(`🔥 ${categories.value.length} categories loaded`);

    console.log(`🔥 ${mainCategories.value.length} main categories loaded`);

    // Start all categories collapsed.

    collapsedCategories.value = new Set(
      mainCategories.value.map((category) => Number(category.id)),
    );
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
// CATEGORY TOGGLE
// ======================================================

const toggleCategory = (id: number) => {
  const next = new Set(collapsedCategories.value);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  collapsedCategories.value = next;
};

// ======================================================
// PRODUCT MENU
// ======================================================

const toggleMenu = (id: number) => {
  if (openMenuId.value === id) {
    openMenuId.value = null;
  } else {
    // This automatically closes any other open menu.
    openMenuId.value = id;
  }
};

// ======================================================
// VIEW
// ======================================================

const viewProduct = (product: any) => {
  openMenuId.value = null;

  if (product?.slug) {
    navigateTo(`/product/${product.slug}`);
  } else {
    navigateTo(`/product/${product.id}`);
  }
};

// ======================================================
// EDIT
// ======================================================

const editProduct = (product: any) => {
  openMenuId.value = null;

  navigateTo(`/admin/products/edit/${product.id}`);
};

// ======================================================
// DELETE
// ======================================================

const deleteProduct = (product: any) => {
  openMenuId.value = null;

  productToDelete.value = product;

  deleteDialog.value = true;

  deleteError.value = "";
};

// ======================================================
// CANCEL DELETE
// ======================================================

const cancelDelete = () => {
  if (deleting.value) {
    return;
  }

  deleteDialog.value = false;

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

  deleteError.value = "";

  try {
    const id = productToDelete.value.id;

    console.log("🔥 DELETING PRODUCT:", id);

    await adminFetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    // Remove from local list immediately.

    products.value = products.value.filter(
      (product) => Number(product.id) !== Number(id),
    );

    deleteDialog.value = false;

    productToDelete.value = null;

    console.log("🔥 PRODUCT DELETED:", id);
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    deleteError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete product.";
  } finally {
    deleting.value = false;
  }
};

// ======================================================
// CLOSE MENU WHEN CLICKING OUTSIDE
// ======================================================

const handleDocumentClick = () => {
  openMenuId.value = null;
};

onMounted(async () => {
  document.addEventListener("click", handleDocumentClick);

  await loadData();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<!-- ================================================== -->
<!-- PRODUCT ITEM COMPONENT -->
<!-- ================================================== -->

<script lang="ts">
export default {
  components: {
    ProductItem: {
      props: {
        product: {
          type: Object,
          required: true,
        },

        openMenuId: {
          type: [Number, null],
          default: null,
        },
      },

      emits: [
        "toggle-menu",
        "delete",
      ],

      template: `
        <div
          class="relative flex items-center gap-4 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
          @click.stop
        >
          <!-- IMAGE -->

          <div
            class="w-16 h-16 shrink-0 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center"
          >
            <img
              v-if="
                product.images &&
                Array.isArray(product.images) &&
                product.images.length
              "
              :src="product.images[0]"
              :alt="product.name"
              class="w-full h-full object-contain p-1"
            />

            <span
              v-else
              class="text-gray-400 text-xs"
            >
              No image
            </span>
          </div>

          <!-- PRODUCT DETAILS -->

          <div class="flex-1 min-w-0">
            <div
              class="font-semibold text-slate-800 truncate"
            >
              {{ product.name }}
            </div>

            <div
              class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm"
            >
              <span
                class="font-bold text-blue-600"
              >
                ${{ product.price }}
              </span>

              <span
                v-if="product.stock > 0"
                class="text-green-600"
              >
                {{ product.stock }} in stock
              </span>

              <span
                v-else
                class="text-red-600"
              >
                Out of stock
              </span>

              <span
                v-if="product.featured"
                class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
              >
                Featured
              </span>

              <span
                v-if="product.refurbished"
                class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
              >
                Refurbished
              </span>

              <span
                v-if="product.active === false"
                class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded"
              >
                Inactive
              </span>
            </div>
          </div>

          <!-- ================================================= -->
          <!-- THREE DOTS -->
          <!-- ================================================= -->

          <div
            class="relative shrink-0"
          >
            <button
              type="button"
              class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition"
              title="Product actions"
              @click.stop="$emit('toggle-menu', product.id)"
            >
              <span
                class="text-xl font-bold leading-none tracking-[3px]"
              >
                •••
              </span>
            </button>

            <!-- ================================================= -->
            <!-- ACTION MENU -->
            <!-- ================================================= -->

            <div
              v-if="openMenuId === product.id"
              class="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-2xl z-[80] overflow-hidden"
              @click.stop
            >
              <!-- VIEW -->

              <button
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition"
                @click="
                  $emit('toggle-menu', null);
                  $router.push(
                    product.slug
                      ? '/product/' + product.slug
                      : '/product/' + product.id
                  );
                "
              >
                <svg
                  class="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>

                <span>View</span>
              </button>

              <!-- EDIT -->

              <button
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition"
                @click="
                  $emit('toggle-menu', null);
                  $router.push(
                    '/admin/products/edit/' + product.id
                  );
                "
              >
                <svg
                  class="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  />
                </svg>

                <span>Edit</span>
              </button>

              <!-- DIVIDER -->

              <div
                class="border-t border-gray-100"
              ></div>

              <!-- DELETE -->

              <button
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition"
                @click="
                  $emit('delete', product)
                "
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-8 0h10"
                  />
                </svg>

                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      `,
    },
  },
};
</script>
