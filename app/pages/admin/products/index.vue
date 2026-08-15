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

        <p class="text-gray-500 mt-1">
          Manage products, categories, stock and pricing.
        </p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- ========================================================= -->
    <!-- SUCCESS MESSAGE -->
    <!-- ========================================================= -->

    <div
      v-if="successMessage"
      class="mb-6 bg-green-100 border border-green-300 text-green-700 rounded-lg p-4"
    >
      {{ successMessage }}
    </div>

    <!-- ========================================================= -->
    <!-- ERROR MESSAGE -->
    <!-- ========================================================= -->

    <div
      v-if="errorMessage"
      class="mb-6 bg-red-100 border border-red-300 text-red-700 rounded-lg p-4"
    >
      {{ errorMessage }}
    </div>

    <!-- ========================================================= -->
    <!-- ANIMATED LOADING -->
    <!-- ========================================================= -->

    <div
      v-if="loading"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-12"
    >
      <div class="flex flex-col items-center justify-center">
        <!-- Spinner -->
        <div
          class="w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"
        ></div>

        <p class="mt-5 text-lg font-semibold text-slate-700">
          Loading Products
        </p>

        <p class="mt-1 text-sm text-gray-500">
          Loading products and categories...
        </p>

        <!-- Animated dots -->
        <div class="flex gap-1 mt-4">
          <span
            class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style="animation-delay: 0ms"
          ></span>

          <span
            class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style="animation-delay: 150ms"
          ></span>

          <span
            class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style="animation-delay: 300ms"
          ></span>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- CONTENT -->
    <!-- ========================================================= -->

    <div v-else>
      <!-- ======================================================= -->
      <!-- SUMMARY -->
      <!-- ======================================================= -->

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl shadow-sm border p-5">
          <p class="text-sm text-gray-500">Products</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ products.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-5">
          <p class="text-sm text-gray-500">Categories</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ categories.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-5">
          <p class="text-sm text-gray-500">Main Categories</p>

          <p class="text-3xl font-bold text-slate-800 mt-1">
            {{ mainCategories.length }}
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

        <h2 class="text-xl font-bold text-slate-800">No Products</h2>

        <p class="text-gray-500 mt-2">
          There are currently no products to display.
        </p>
      </div>

      <!-- ======================================================= -->
      <!-- CATEGORY GROUPS -->
      <!-- ======================================================= -->

      <div v-for="category in categoryTree" :key="category.id" class="mb-8">
        <!-- ===================================================== -->
        <!-- MAIN CATEGORY HEADER -->
        <!-- ===================================================== -->

        <div
          class="relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible"
        >
          <button
            type="button"
            @click="toggleCategory(category.id)"
            class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition rounded-xl"
          >
            <div class="flex items-center gap-3">
              <!-- Arrow -->

              <span
                class="text-gray-500 transition-transform duration-200"
                :class="{
                  'rotate-90': openCategories.has(category.id),
                }"
              >
                ▶
              </span>

              <!-- Category -->

              <div class="text-left">
                <h2 class="text-xl font-bold text-slate-800">
                  {{ category.name }}
                </h2>

                <p class="text-sm text-gray-500">
                  {{ category.products.length }}
                  product{{ category.products.length === 1 ? "" : "s" }}

                  <span v-if="category.children.length">
                    · {{ category.children.length }} subcategor{{
                      category.children.length === 1 ? "y" : "ies"
                    }}
                  </span>
                </p>
              </div>
            </div>

            <span class="text-sm text-gray-400">
              {{ openCategories.has(category.id) ? "Collapse" : "Expand" }}
            </span>
          </button>

          <!-- =================================================== -->
          <!-- CATEGORY CONTENT -->
          <!-- =================================================== -->

          <div
            v-if="openCategories.has(category.id)"
            class="border-t border-gray-200"
          >
            <!-- ================================================= -->
            <!-- MAIN CATEGORY PRODUCTS -->
            <!-- ================================================= -->

            <div
              v-if="category.products.length"
              class="divide-y divide-gray-100"
            >
              <div
                v-for="product in category.products"
                :key="product.id"
                class="relative overflow-visible px-5 py-5 hover:bg-gray-50 transition"
              >
                <ProductDisplay
                  :product="product"
                  :open-menu="openMenu"
                  @toggle-menu="toggleMenu"
                  @close-menu="closeMenu"
                  @delete="confirmDelete"
                />
              </div>
            </div>

            <!-- ================================================= -->
            <!-- SUB CATEGORIES -->
            <!-- ================================================= -->

            <div
              v-for="child in category.children"
              :key="child.id"
              class="border-t border-gray-200"
            >
              <!-- Subcategory header -->

              <div class="bg-gray-50 px-5 py-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-semibold text-slate-700">
                      {{ child.name }}
                    </h3>

                    <p class="text-xs text-gray-500 mt-1">
                      {{ child.products.length }}
                      product{{ child.products.length === 1 ? "" : "s" }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Subcategory products -->

              <div
                v-if="child.products.length"
                class="divide-y divide-gray-100"
              >
                <div
                  v-for="product in child.products"
                  :key="product.id"
                  class="relative overflow-visible px-5 py-5 pl-8 hover:bg-gray-50 transition"
                >
                  <ProductDisplay
                    :product="product"
                    :open-menu="openMenu"
                    @toggle-menu="toggleMenu"
                    @close-menu="closeMenu"
                    @delete="confirmDelete"
                  />
                </div>
              </div>

              <!-- No products -->

              <div v-else class="px-8 py-5 text-sm text-gray-400 italic">
                No products in this subcategory.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- UNCATEGORISED -->
      <!-- ======================================================= -->

      <div v-if="uncategorisedProducts.length" class="mb-8">
        <div
          class="relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible"
        >
          <button
            type="button"
            @click="toggleCategory('uncategorised')"
            class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition rounded-xl"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-gray-500 transition-transform duration-200"
                :class="{
                  'rotate-90': openCategories.has('uncategorised'),
                }"
              >
                ▶
              </span>

              <div class="text-left">
                <h2 class="text-xl font-bold text-slate-800">Uncategorized</h2>

                <p class="text-sm text-gray-500">
                  {{ uncategorisedProducts.length }}
                  product{{ uncategorisedProducts.length === 1 ? "" : "s" }}
                </p>
              </div>
            </div>

            <span class="text-sm text-gray-400">
              {{ openCategories.has("uncategorised") ? "Collapse" : "Expand" }}
            </span>
          </button>

          <div
            v-if="openCategories.has('uncategorised')"
            class="border-t border-gray-200 divide-y divide-gray-100"
          >
            <div
              v-for="product in uncategorisedProducts"
              :key="product.id"
              class="relative overflow-visible px-5 py-5 hover:bg-gray-50"
            >
              <ProductDisplay
                :product="product"
                :open-menu="openMenu"
                @toggle-menu="toggleMenu"
                @close-menu="closeMenu"
                @delete="confirmDelete"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- DELETE CONFIRMATION -->
    <!-- ========================================================= -->

    <div
      v-if="deleteProduct"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-xl"
          >
            ⚠️
          </div>

          <div>
            <h2 class="text-xl font-bold text-slate-800">Delete Product?</h2>

            <p class="text-gray-600 mt-2">Are you sure you want to delete:</p>

            <p class="font-semibold text-slate-800 mt-2">
              {{ deleteProduct.name }}
            </p>

            <p class="text-sm text-red-600 mt-3">
              This action cannot be undone.
            </p>
          </div>
        </div>

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
            @click="deleteProductNow"
            :disabled="deleting"
            class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
          >
            {{ deleting ? "Deleting..." : "Yes, Delete" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* ============================================================
   ADMIN MIDDLEWARE
============================================================ */

definePageMeta({
  middleware: "admin",
});

/* ============================================================
   ADMIN FETCH
============================================================ */

const adminFetch = useAdminFetch();

/* ============================================================
   STATE
============================================================ */

const loading = ref(true);

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const errorMessage = ref("");

const successMessage = ref("");

const openCategories = ref<Set<number | string>>(new Set());

const openMenu = ref<number | null>(null);

const deleteProduct = ref<any | null>(null);

const deleting = ref(false);

/* ============================================================
   LOAD PRODUCTS
============================================================ */

const loadProducts = async () => {
  try {
    console.log("🔥 ADMIN PRODUCTS START");

    const response = await adminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:", response);

    if (Array.isArray(response)) {
      products.value = response;
    } else if (Array.isArray(response?.products)) {
      products.value = response.products;
    } else {
      products.value = [];
    }

    console.log("🔥 PRODUCTS LOADED:", products.value.length);
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCTS ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load products.";
  }
};

/* ============================================================
   LOAD CATEGORIES
============================================================ */

const loadCategories = async () => {
  try {
    console.log("🔥 LOADING CATEGORIES");

    const response = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:", response);

    if (Array.isArray(response)) {
      categories.value = response;
    } else if (Array.isArray(response?.categories)) {
      categories.value = response.categories;
    } else {
      categories.value = [];
    }

    console.log("🔥 CATEGORIES LOADED:", categories.value.length);
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load categories.";
  }
};

/* ============================================================
   MAIN CATEGORIES
============================================================ */

const mainCategories = computed(() => {
  return categories.value
    .filter(
      (category) =>
        category.parent_id === null || category.parent_id === undefined,
    )
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
});

/* ============================================================
   CATEGORY TREE
============================================================ */

const categoryTree = computed(() => {
  const parents = [...mainCategories.value];

  return parents.map((parent) => {
    const children = categories.value
      .filter((category) => Number(category.parent_id) === Number(parent.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const parentProducts = products.value
      .filter((product) => Number(product.category_id) === Number(parent.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const childTree = children.map((child) => {
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

    return {
      ...parent,
      products: parentProducts,
      children: childTree,
    };
  });
});

/* ============================================================
   UNCATEGORISED PRODUCTS
============================================================ */

const uncategorisedProducts = computed(() => {
  const categoryIds = new Set(
    categories.value.map((category) => Number(category.id)),
  );

  return products.value
    .filter((product) => {
      if (product.category_id === null || product.category_id === undefined) {
        return true;
      }

      return !categoryIds.has(Number(product.category_id));
    })
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
});

/* ============================================================
   CATEGORY TOGGLE
============================================================ */

const toggleCategory = (id: number | string) => {
  const newSet = new Set(openCategories.value);

  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }

  openCategories.value = newSet;
};

/* ============================================================
   PRODUCT MENU
============================================================ */

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

/* ============================================================
   DELETE CONFIRMATION
============================================================ */

const confirmDelete = (product: any) => {
  openMenu.value = null;

  deleteProduct.value = product;
};

const cancelDelete = () => {
  if (deleting.value) {
    return;
  }

  deleteProduct.value = null;
};

/* ============================================================
   DELETE PRODUCT
============================================================ */

const deleteProductNow = async () => {
  if (!deleteProduct.value) {
    return;
  }

  deleting.value = true;

  errorMessage.value = "";

  successMessage.value = "";

  try {
    const id = deleteProduct.value.id;

    console.log("🔥 DELETING PRODUCT:", id);

    await adminFetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    products.value = products.value.filter(
      (product) => Number(product.id) !== Number(id),
    );

    successMessage.value = "Product deleted successfully.";

    deleteProduct.value = null;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

/* ============================================================
   CLOSE MENU WHEN CLICKING ELSEWHERE
============================================================ */

const handleDocumentClick = () => {
  openMenu.value = null;
};

onMounted(async () => {
  document.addEventListener("click", handleDocumentClick);

  try {
    await Promise.all([loadProducts(), loadCategories()]);
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<!-- ============================================================
     PRODUCT DISPLAY COMPONENT
============================================================ -->

<script lang="ts">
export default {
  components: {
    ProductDisplay: {
      props: {
        product: {
          type: Object,
          required: true,
        },

        openMenu: {
          default: null,
        },
      },

      emits: [
        "toggle-menu",
        "close-menu",
        "delete",
      ],

      template: `
        <div class="flex flex-col sm:flex-row gap-5">

          <!-- PRODUCT IMAGE -->

          <div
            class="w-full sm:w-28 h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
          >
            <img
              v-if="product.images && product.images.length"
              :src="product.images[0]"
              :alt="product.name"
              class="w-full h-full object-contain p-2"
            />

            <span
              v-else
              class="text-gray-400 text-xs"
            >
              No Image
            </span>
          </div>

          <!-- PRODUCT INFORMATION -->

          <div class="flex-1 min-w-0">

            <div
              class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            >

              <div class="min-w-0">

                <h3
                  class="font-semibold text-slate-800 break-words"
                >
                  {{ product.name }}
                </h3>

                <p
                  v-if="product.blurb"
                  class="text-sm text-gray-500 mt-1 line-clamp-2"
                >
                  {{ product.blurb }}
                </p>

                <div
                  class="flex flex-wrap items-center gap-3 mt-3"
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
                    class="text-sm"
                    :class="
                      product.stock > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    "
                  >
                    Stock: {{ product.stock }}
                  </span>

                  <span
                    v-if="product.featured"
                    class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
                  >
                    Featured
                  </span>

                  <span
                    v-if="product.refurbished"
                    class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                  >
                    Refurbished
                  </span>

                </div>

              </div>

              <!-- ACTION MENU -->

              <div
                class="relative flex-shrink-0 self-start"
                @click.stop
              >

                <button
                  type="button"
                  @click.stop="$emit('toggle-menu', product.id)"
                  class="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
                  aria-label="Product actions"
                >
                  <span
                    class="text-xl leading-none tracking-[2px]"
                  >
                    •••
                  </span>
                </button>

                <div
                  v-if="openMenu === product.id"
                  class="absolute right-0 top-full mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-[80] overflow-hidden"
                >

                  <NuxtLink
                    :to="'/product/' + product.slug"
                    class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                    @click="$emit('close-menu')"
                  >
                    View
                  </NuxtLink>

                  <NuxtLink
                    :to="'/admin/products/edit/' + product.id"
                    class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                    @click="$emit('close-menu')"
                  >
                    Edit
                  </NuxtLink>

                  <button
                    type="button"
                    @click="$emit('delete', product)"
                    class="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      `,
    },
  },
};
</script>
