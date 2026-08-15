<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ========================================================= -->
    <!-- HEADER -->
    <!-- ========================================================= -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Products</h1>

        <p class="text-gray-500 mt-1">Manage your products by category.</p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- ========================================================= -->
    <!-- LOADING -->
    <!-- ========================================================= -->

    <div v-if="loading" class="bg-white rounded-xl shadow p-10 text-center">
      <div class="text-gray-500">Loading products...</div>
    </div>

    <!-- ========================================================= -->
    <!-- ERROR -->
    <!-- ========================================================= -->

    <div
      v-else-if="errorMessage"
      class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-5"
    >
      <p class="font-semibold">Unable to load products</p>

      <p class="mt-1">
        {{ errorMessage }}
      </p>
    </div>

    <!-- ========================================================= -->
    <!-- NO PRODUCTS -->
    <!-- ========================================================= -->

    <div
      v-else-if="products.length === 0"
      class="bg-white rounded-xl shadow p-10 text-center"
    >
      <p class="text-gray-500 text-lg">No products found.</p>

      <NuxtLink
        to="/admin/products/new"
        class="inline-block mt-4 text-blue-600 hover:text-blue-800"
      >
        Add your first product
      </NuxtLink>
    </div>

    <!-- ========================================================= -->
    <!-- PRODUCTS -->
    <!-- ========================================================= -->

    <div v-else class="space-y-6">
      <!-- ======================================================= -->
      <!-- MAIN CATEGORY -->
      <!-- ======================================================= -->

      <div
        v-for="category in categoryHierarchy"
        :key="category.id"
        class="bg-white rounded-xl shadow border border-gray-200"
      >
        <!-- ===================================================== -->
        <!-- MAIN CATEGORY HEADER -->
        <!-- ===================================================== -->

        <button
          type="button"
          @click="toggleCategory(category.id)"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition rounded-xl"
        >
          <div class="flex items-center gap-3">
            <!-- ARROW -->

            <svg
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{
                'rotate-90': openCategories.has(category.id),
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

            <!-- CATEGORY NAME -->

            <span class="text-xl font-bold text-slate-800">
              {{ category.name }}
            </span>

            <!-- COUNT -->

            <span
              class="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
            >
              {{ category.totalProducts }}
            </span>
          </div>

          <span class="text-sm text-gray-400">
            {{ openCategories.has(category.id) ? "Collapse" : "Expand" }}
          </span>
        </button>

        <!-- ===================================================== -->
        <!-- CATEGORY CONTENT -->
        <!-- ===================================================== -->

        <div
          v-if="openCategories.has(category.id)"
          class="border-t border-gray-200"
        >
          <!-- =================================================== -->
          <!-- PRODUCTS DIRECTLY UNDER MAIN CATEGORY -->
          <!-- =================================================== -->

          <div v-if="category.products.length" class="p-4 space-y-3">
            <div
              v-for="product in category.products"
              :key="product.id"
              class="relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-white hover:shadow-sm transition"
            >
              <ProductRow :product="product" />

              <!-- ================================================= -->
              <!-- ACTIONS -->
              <!-- ================================================= -->

              <div class="absolute right-4 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  :data-product-action="product.id"
                  @click.stop="toggleActionMenu(product.id)"
                  class="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition"
                  title="Actions"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="5" r="1.8" />

                    <circle cx="12" cy="12" r="1.8" />

                    <circle cx="12" cy="19" r="1.8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- =================================================== -->
          <!-- SUB CATEGORIES -->
          <!-- =================================================== -->

          <div
            v-for="subCategory in category.children"
            :key="subCategory.id"
            class="border-t border-gray-200"
          >
            <!-- SUB CATEGORY HEADER -->

            <div class="px-6 py-3 bg-gray-50">
              <div class="flex items-center gap-2">
                <span class="text-gray-400"> └─ </span>

                <span class="font-semibold text-slate-700">
                  {{ subCategory.name }}
                </span>

                <span
                  class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full"
                >
                  {{ subCategory.products.length }}
                </span>
              </div>
            </div>

            <!-- SUB CATEGORY PRODUCTS -->

            <div v-if="subCategory.products.length" class="p-4 space-y-3">
              <div
                v-for="product in subCategory.products"
                :key="product.id"
                class="relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-white hover:shadow-sm transition"
              >
                <ProductRow :product="product" />

                <!-- ACTIONS -->

                <div class="absolute right-4 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    :data-product-action="product.id"
                    @click.stop="toggleActionMenu(product.id)"
                    class="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition"
                    title="Actions"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="px-8 py-4 text-sm text-gray-400">
              No products in this subcategory.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- FIXED ACTION MENU -->
    <!-- ========================================================= -->

    <div
      v-if="openActionMenu !== null"
      class="fixed z-[99999] w-44 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden"
      :style="getMenuPosition(openActionMenu)"
      @click.stop
    >
      <!-- VIEW -->

      <NuxtLink
        v-if="selectedProduct"
        :to="`/product/${selectedProduct.slug}`"
        @click="closeActionMenu"
        class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />

          <circle cx="12" cy="12" r="3" />
        </svg>

        View
      </NuxtLink>

      <!-- EDIT -->

      <NuxtLink
        v-if="selectedProduct"
        :to="`/admin/products/edit/${selectedProduct.id}`"
        @click="closeActionMenu"
        class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h5"
          />

          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1-1-4 9.5-9.5z"
          />
        </svg>

        Edit
      </NuxtLink>

      <!-- DELETE -->

      <button
        v-if="selectedProduct"
        type="button"
        @click="confirmDelete(selectedProduct)"
        class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"
          />

          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 11v6M14 11v6"
          />

          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 7h16"
          />

          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 7V4h4v3"
          />
        </svg>

        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// =========================================================
// ADMIN MIDDLEWARE
// =========================================================

definePageMeta({
  middleware: "admin",
});

// =========================================================
// ADMIN FETCH
// =========================================================

const adminFetch = useAdminFetch();

// =========================================================
// STATE
// =========================================================

const loading = ref(true);

const errorMessage = ref("");

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const openCategories = ref<Set<number>>(new Set());

const openActionMenu = ref<number | null>(null);

const menuPositions = ref<Record<number, any>>({});

const selectedProduct = ref<any | null>(null);

const deleting = ref<number | null>(null);

// =========================================================
// LOAD PRODUCTS
// =========================================================

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

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load products.";
  }
};

// =========================================================
// LOAD CATEGORIES
// =========================================================

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
  }
};

// =========================================================
// CATEGORY HIERARCHY
// =========================================================

const categoryHierarchy = computed(() => {
  const mainCategories = categories.value
    .filter(
      (category) =>
        category.parent_id === null || category.parent_id === undefined,
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return mainCategories.map((parent) => {
    const children = categories.value
      .filter((category) => Number(category.parent_id) === Number(parent.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    const parentProducts = products.value
      .filter((product) => Number(product.category_id) === Number(parent.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    const mappedChildren = children.map((child) => {
      const childProducts = products.value
        .filter((product) => Number(product.category_id) === Number(child.id))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...child,
        products: childProducts,
      };
    });

    const childProductCount = mappedChildren.reduce(
      (total, child) => total + child.products.length,
      0,
    );

    return {
      ...parent,
      products: parentProducts,
      children: mappedChildren,
      totalProducts: parentProducts.length + childProductCount,
    };
  });
});

// =========================================================
// TOGGLE CATEGORY
// =========================================================

const toggleCategory = (categoryId: number) => {
  const newSet = new Set(openCategories.value);

  if (newSet.has(categoryId)) {
    newSet.delete(categoryId);
  } else {
    newSet.add(categoryId);
  }

  openCategories.value = newSet;
};

// =========================================================
// GET FIRST IMAGE
// =========================================================

const getFirstImage = (product: any) => {
  if (Array.isArray(product.images) && product.images.length) {
    return product.images[0];
  }

  return "";
};

// =========================================================
// ACTION MENU
// =========================================================

const toggleActionMenu = (productId: number) => {
  if (openActionMenu.value === productId) {
    closeActionMenu();

    return;
  }

  const product = products.value.find(
    (item) => Number(item.id) === Number(productId),
  );

  if (!product) {
    return;
  }

  selectedProduct.value = product;

  openActionMenu.value = productId;

  nextTick(() => {
    const button = document.querySelector(
      `[data-product-action="${productId}"]`,
    ) as HTMLElement | null;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();

    const menuWidth = 176;

    let left = rect.right - menuWidth;

    let top = rect.bottom + 6;

    // =====================================================
    // KEEP MENU ON SCREEN HORIZONTALLY
    // =====================================================

    if (left < 10) {
      left = 10;
    }

    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    // =====================================================
    // IF TOO LOW, DISPLAY ABOVE BUTTON
    // =====================================================

    const menuHeight = 140;

    if (top + menuHeight > window.innerHeight - 10) {
      top = rect.top - menuHeight - 6;
    }

    if (top < 10) {
      top = 10;
    }

    menuPositions.value[productId] = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
    };
  });
};

// =========================================================
// MENU POSITION
// =========================================================

const getMenuPosition = (productId: number) => {
  return (
    menuPositions.value[productId] || {
      position: "fixed",
      top: "10px",
      left: "10px",
    }
  );
};

// =========================================================
// CLOSE MENU
// =========================================================

const closeActionMenu = () => {
  openActionMenu.value = null;

  selectedProduct.value = null;
};

// =========================================================
// DELETE CONFIRMATION
// =========================================================

const confirmDelete = async (product: any) => {
  closeActionMenu();

  const confirmed = window.confirm(
    `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`,
  );

  if (!confirmed) {
    return;
  }

  await deleteProduct(product);
};

// =========================================================
// DELETE PRODUCT
// =========================================================

const deleteProduct = async (product: any) => {
  try {
    deleting.value = product.id;

    console.log("🔥 DELETING PRODUCT:", product.id);

    await adminFetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });

    // ===================================================
    // REMOVE FROM LOCAL ARRAY
    // ===================================================

    products.value = products.value.filter(
      (item) => Number(item.id) !== Number(product.id),
    );

    console.log("✅ PRODUCT DELETED");
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    alert(
      error?.data?.statusMessage ||
        error?.message ||
        "Unable to delete product.",
    );
  } finally {
    deleting.value = null;
  }
};

// =========================================================
// CLOSE MENU WHEN CLICKING ELSEWHERE
// =========================================================

const handleDocumentClick = () => {
  closeActionMenu();
};

// =========================================================
// LOAD
// =========================================================

onMounted(async () => {
  document.addEventListener("click", handleDocumentClick);

  try {
    await Promise.all([loadProducts(), loadCategories()]);
  } finally {
    loading.value = false;
  }
});

// =========================================================
// CLEANUP
// =========================================================

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<!-- ========================================================= -->
<!-- PRODUCT ROW COMPONENT -->
<!-- ========================================================= -->

<script lang="ts">

export default {
  components: {
    ProductRow: defineComponent({
      props: {
        product: {
          type: Object,
          required: true,
        },
      },

      setup(props) {

        const getFirstImage = (
          product: any
        ) => {

          if (
            Array.isArray(product.images) &&
            product.images.length
          ) {
            return product.images[0];
          }

          return "";
        };

        return {
          getFirstImage,
        };
      },

      template: `
        <div class="flex items-center gap-4 pr-12">

          <!-- IMAGE -->

          <div
            class="w-20 h-20 shrink-0 bg-white border rounded-lg flex items-center justify-center overflow-hidden"
          >

            <img
              v-if="getFirstImage(product)"
              :src="getFirstImage(product)"
              :alt="product.name"
              class="w-full h-full object-contain p-2"
            />

            <span
              v-else
              class="text-xs text-gray-400"
            >
              No Image
            </span>

          </div>

          <!-- PRODUCT -->

          <div class="flex-1 min-w-0">

            <h3
              class="font-semibold text-slate-800 truncate"
            >
              {{ product.name }}
            </h3>

            <p
              v-if="product.blurb"
              class="text-sm text-gray-500 line-clamp-1 mt-1"
            >
              {{ product.blurb }}
            </p>

            <div
              class="flex flex-wrap items-center gap-3 mt-2"
            >

              <span
                class="font-bold text-blue-600"
              >
                ${{ product.price }}
              </span>

              <span
                v-if="product.oldPrice"
                class="text-sm text-gray-400 line-through"
              >
                ${{ product.oldPrice }}
              </span>

              <span
                v-if="product.stock > 0"
                class="text-xs font-semibold text-green-600"
              >
                {{ product.stock }} in stock
              </span>

              <span
                v-else
                class="text-xs font-semibold text-red-600"
              >
                Out of stock
              </span>

              <span
                v-if="product.featured"
                class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
              >
                Featured
              </span>

              <span
                v-if="product.refurbished"
                class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
              >
                Refurbished
              </span>

              <span
                v-if="Array.isArray(product.images) && product.images.length > 1"
                class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                {{ product.images.length }} images
              </span>

            </div>

          </div>

        </div>
      `,
    }),
  },
};
</script>
