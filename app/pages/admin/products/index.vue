<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ===================================================== -->
    <!-- HEADER -->
    <!-- ===================================================== -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Products</h1>

        <p class="text-gray-500 mt-1">
          Manage your products, stock, pricing and product information.
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

    <!-- ===================================================== -->
    <!-- LOADING -->
    <!-- ===================================================== -->

    <div
      v-if="loading"
      class="bg-white rounded-xl shadow-sm p-12 flex flex-col items-center justify-center"
    >
      <div
        class="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"
      ></div>

      <p class="mt-5 text-gray-600 font-medium">Loading products...</p>

      <p class="text-sm text-gray-400 mt-1">Please wait</p>
    </div>

    <!-- ===================================================== -->
    <!-- ERROR -->
    <!-- ===================================================== -->

    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5"
    >
      <div class="flex items-start gap-3">
        <span class="text-xl">⚠️</span>

        <div>
          <p class="font-semibold">Unable to load products</p>

          <p class="text-sm mt-1">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- NO PRODUCTS -->
    <!-- ===================================================== -->

    <div
      v-else-if="mainCategories.length === 0"
      class="bg-white rounded-xl shadow-sm p-12 text-center"
    >
      <div class="text-5xl mb-4">📦</div>

      <h2 class="text-xl font-semibold text-gray-700">No products found</h2>

      <p class="text-gray-500 mt-2">
        There are currently no products to display.
      </p>
    </div>

    <!-- ===================================================== -->
    <!-- CATEGORY LIST -->
    <!-- ===================================================== -->

    <div v-else class="space-y-5">
      <!-- =================================================== -->
      <!-- MAIN CATEGORY -->
      <!-- =================================================== -->

      <div
        v-for="category in mainCategories"
        :key="category.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible"
      >
        <!-- ================================================= -->
        <!-- MAIN CATEGORY HEADER -->
        <!-- ================================================= -->

        <button
          type="button"
          @click="toggleCategory(category.id)"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition rounded-xl"
        >
          <div class="flex items-center gap-3">
            <!-- Expand icon -->

            <span
              class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold transition-transform"
              :class="{
                'rotate-90': isCategoryOpen(category.id),
              }"
            >
              ›
            </span>

            <div class="text-left">
              <h2 class="text-lg font-bold text-slate-800">
                {{ category.name }}
              </h2>

              <p class="text-xs text-gray-500">
                {{ category.productCount }}
                {{ category.productCount === 1 ? "product" : "products" }}
              </p>
            </div>
          </div>

          <!-- Main category total -->

          <div class="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <span>
              {{ category.children.length }}
              {{
                category.children.length === 1 ? "subcategory" : "subcategories"
              }}
            </span>
          </div>
        </button>

        <!-- ================================================= -->
        <!-- MAIN CATEGORY CONTENT -->
        <!-- ================================================= -->

        <div
          v-if="isCategoryOpen(category.id)"
          class="border-t border-gray-200 p-4 space-y-4"
        >
          <!-- =============================================== -->
          <!-- PRODUCTS DIRECTLY IN MAIN CATEGORY -->
          <!-- =============================================== -->

          <div v-if="category.products.length" class="space-y-2">
            <div
              class="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-500"
            >
              <span>Products</span>

              <span class="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                {{ category.products.length }}
              </span>
            </div>

            <div
              v-for="product in category.products"
              :key="product.id"
              class="relative"
            >
              <!-- PRODUCT -->

              <div
                class="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition bg-white"
              >
                <!-- IMAGE -->

                <div
                  class="w-full md:w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden"
                >
                  <img
                    v-if="getFirstImage(product)"
                    :src="getFirstImage(product)"
                    :alt="product.name"
                    class="max-w-full max-h-full object-contain p-2"
                  />

                  <span v-else class="text-gray-300 text-3xl"> 📦 </span>
                </div>

                <!-- PRODUCT INFO -->

                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-slate-800 truncate">
                    {{ product.name }}
                  </h3>

                  <p
                    v-if="product.slug"
                    class="text-xs text-gray-400 mt-1 truncate"
                  >
                    {{ product.slug }}
                  </p>

                  <div class="flex flex-wrap items-center gap-3 mt-2">
                    <!-- PRICE -->

                    <span class="font-bold text-blue-600">
                      <span>$</span>{{ product.price }}
                    </span>

                    <!-- OLD PRICE -->

                    <span
                      v-if="product.oldPrice"
                      class="text-sm text-gray-400 line-through"
                    >
                      <span>$</span>{{ product.oldPrice }}
                    </span>

                    <!-- STOCK -->

                    <span
                      class="text-sm"
                      :class="
                        Number(product.stock) > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      "
                    >
                      {{ product.stock }} in stock
                    </span>

                    <!-- ACTIVE -->

                    <span
                      v-if="product.active"
                      class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                    >
                      Active
                    </span>

                    <span
                      v-else
                      class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"
                    >
                      Inactive
                    </span>
                  </div>
                </div>

                <!-- ACTIONS -->

                <div class="relative flex-shrink-0 self-start md:self-center">
                  <!-- THREE DOTS -->

                  <button
                    type="button"
                    @click.stop="toggleMenu(product.id)"
                    class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition"
                    aria-label="Product actions"
                  >
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    </span>
                  </button>

                  <!-- ACTION MENU -->

                  <div
                    v-if="openMenu === product.id"
                    class="absolute right-0 top-0 z-[9999] w-44 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                    @click.stop
                  >
                    <!-- VIEW -->

                    <button
                      type="button"
                      @click="viewProduct(product)"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span class="w-5 text-center text-blue-600"> 👁 </span>

                      <span> View </span>
                    </button>

                    <!-- EDIT -->

                    <button
                      type="button"
                      @click="editProduct(product)"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span class="w-5 text-center text-green-600"> ✎ </span>

                      <span> Edit </span>
                    </button>

                    <!-- DELETE -->

                    <button
                      type="button"
                      @click="confirmDelete(product)"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <span class="w-5 text-center"> 🗑 </span>

                      <span> Delete </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- =============================================== -->
          <!-- SUBCATEGORIES -->
          <!-- =============================================== -->

          <div
            v-for="subcategory in category.children"
            :key="subcategory.id"
            class="border border-gray-200 rounded-lg overflow-visible"
          >
            <!-- SUBCATEGORY HEADER -->

            <button
              type="button"
              @click="toggleCategory(subcategory.id)"
              class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition rounded-lg"
            >
              <div class="flex items-center gap-3">
                <span
                  class="text-blue-600 font-bold transition-transform"
                  :class="{
                    'rotate-90': isCategoryOpen(subcategory.id),
                  }"
                >
                  ›
                </span>

                <span class="font-semibold text-slate-700">
                  {{ subcategory.name }}
                </span>

                <span class="text-xs text-gray-400">
                  {{ subcategory.products.length }}
                  {{
                    subcategory.products.length === 1 ? "product" : "products"
                  }}
                </span>
              </div>
            </button>

            <!-- SUBCATEGORY PRODUCTS -->

            <div v-if="isCategoryOpen(subcategory.id)" class="p-3 space-y-2">
              <div
                v-if="subcategory.products.length === 0"
                class="text-sm text-gray-400 text-center py-4"
              >
                No products in this category.
              </div>

              <div
                v-for="product in subcategory.products"
                :key="product.id"
                class="relative"
              >
                <div
                  class="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition bg-white"
                >
                  <!-- IMAGE -->

                  <div
                    class="w-full md:w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden"
                  >
                    <img
                      v-if="getFirstImage(product)"
                      :src="getFirstImage(product)"
                      :alt="product.name"
                      class="max-w-full max-h-full object-contain p-2"
                    />

                    <span v-else class="text-gray-300 text-3xl"> 📦 </span>
                  </div>

                  <!-- INFO -->

                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-slate-800 truncate">
                      {{ product.name }}
                    </h3>

                    <p
                      v-if="product.slug"
                      class="text-xs text-gray-400 mt-1 truncate"
                    >
                      {{ product.slug }}
                    </p>

                    <div class="flex flex-wrap items-center gap-3 mt-2">
                      <span class="font-bold text-blue-600">
                        <span>$</span>{{ product.price }}
                      </span>

                      <span
                        v-if="product.oldPrice"
                        class="text-sm text-gray-400 line-through"
                      >
                        <span>$</span>{{ product.oldPrice }}
                      </span>

                      <span
                        class="text-sm"
                        :class="
                          Number(product.stock) > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        "
                      >
                        {{ product.stock }} in stock
                      </span>

                      <span
                        v-if="product.active"
                        class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                      >
                        Active
                      </span>

                      <span
                        v-else
                        class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"
                      >
                        Inactive
                      </span>
                    </div>
                  </div>

                  <!-- ACTIONS -->

                  <div class="relative flex-shrink-0 self-start md:self-center">
                    <!-- DOTS -->

                    <button
                      type="button"
                      @click.stop="toggleMenu(product.id)"
                      class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition"
                      aria-label="Product actions"
                    >
                      <span class="flex items-center gap-1">
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-current"
                        ></span>
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-current"
                        ></span>
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-current"
                        ></span>
                      </span>
                    </button>

                    <!-- MENU -->

                    <div
                      v-if="openMenu === product.id"
                      class="absolute right-0 top-0 z-[9999] w-44 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                      @click.stop
                    >
                      <button
                        type="button"
                        @click="viewProduct(product)"
                        class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span class="w-5 text-center text-blue-600"> 👁 </span>

                        View
                      </button>

                      <button
                        type="button"
                        @click="editProduct(product)"
                        class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span class="w-5 text-center text-green-600"> ✎ </span>

                        Edit
                      </button>

                      <button
                        type="button"
                        @click="confirmDelete(product)"
                        class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <span class="w-5 text-center"> 🗑 </span>

                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- DELETE CONFIRMATION -->
    <!-- ===================================================== -->

    <div
      v-if="productToDelete"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl flex-shrink-0"
          >
            🗑
          </div>

          <div>
            <h2 class="text-xl font-bold text-slate-800">Delete Product?</h2>

            <p class="text-gray-600 mt-2">
              Are you sure you really want to delete
              <strong>
                {{ productToDelete.name }}
              </strong>
              ?
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
            class="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            @click="deleteProduct"
            :disabled="deleting"
            class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            {{ deleting ? "Deleting..." : "Yes, Delete" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================================
// PAGE META
// ============================================================

definePageMeta({
  middleware: "admin",
});

// ============================================================
// ADMIN FETCH
// ============================================================

const adminFetch = useAdminFetch();

// ============================================================
// ROUTER
// ============================================================

const router = useRouter();

// ============================================================
// STATE
// ============================================================

const loading = ref(true);

const errorMessage = ref("");

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const openMenu = ref<number | null>(null);

const openCategories = ref<Set<number>>(new Set());

const productToDelete = ref<any | null>(null);

const deleting = ref(false);

// ============================================================
// LOAD DATA
// ============================================================

const loadData = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    console.log("🔥 ADMIN PRODUCTS LOADING");

    const [productResponse, categoryResponse] = await Promise.all([
      adminFetch("/api/admin/products"),
      adminFetch("/api/admin/categories"),
    ]);

    console.log("🔥 PRODUCTS RESPONSE:", productResponse);

    console.log("🔥 CATEGORIES RESPONSE:", categoryResponse);

    // --------------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------------

    if (Array.isArray(productResponse)) {
      products.value = productResponse;
    } else if (productResponse && Array.isArray(productResponse.products)) {
      products.value = productResponse.products;
    } else {
      products.value = [];
    }

    // --------------------------------------------------------
    // CATEGORIES
    // --------------------------------------------------------

    if (Array.isArray(categoryResponse)) {
      categories.value = categoryResponse;
    } else if (categoryResponse && Array.isArray(categoryResponse.categories)) {
      categories.value = categoryResponse.categories;
    } else {
      categories.value = [];
    }

    console.log(`🔥 ${products.value.length} products loaded`);

    console.log(`🔥 ${categories.value.length} categories loaded`);
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

// ============================================================
// GET FIRST IMAGE
// ============================================================

const getFirstImage = (product: any) => {
  if (Array.isArray(product?.images) && product.images.length) {
    return product.images[0];
  }

  if (typeof product?.images === "string" && product.images) {
    return product.images;
  }

  return null;
};

// ============================================================
// SORTED PRODUCTS
// ============================================================

const sortedProducts = computed(() => {
  return [...products.value].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || "")),
  );
});

// ============================================================
// MAIN CATEGORIES
// ============================================================

const mainCategories = computed(() => {
  const parentCategories = categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  return parentCategories.map((parent) => {
    const children = categories.value
      .filter((category) => Number(category.parent_id) === Number(parent.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const parentProducts = sortedProducts.value.filter(
      (product) => Number(product.category_id) === Number(parent.id),
    );

    const childCategories = children.map((child) => {
      const childProducts = sortedProducts.value.filter(
        (product) => Number(product.category_id) === Number(child.id),
      );

      return {
        ...child,
        products: childProducts,
      };
    });

    const productCount =
      parentProducts.length +
      childCategories.reduce(
        (total, child) => total + child.products.length,
        0,
      );

    return {
      ...parent,
      products: parentProducts,
      children: childCategories,
      productCount,
    };
  });
});

// ============================================================
// TOGGLE CATEGORY
// ============================================================

const toggleCategory = (categoryId: number) => {
  const newSet = new Set(openCategories.value);

  if (newSet.has(categoryId)) {
    newSet.delete(categoryId);
  } else {
    newSet.add(categoryId);
  }

  openCategories.value = newSet;
};

// ============================================================
// CATEGORY OPEN
// ============================================================

const isCategoryOpen = (categoryId: number) => {
  return openCategories.value.has(categoryId);
};

// ============================================================
// TOGGLE PRODUCT MENU
// ============================================================

const toggleMenu = (productId: number) => {
  if (openMenu.value === productId) {
    openMenu.value = null;
  } else {
    openMenu.value = productId;
  }
};

// ============================================================
// CLOSE MENU WHEN CLICKING OUTSIDE
// ============================================================

const closeMenu = () => {
  openMenu.value = null;
};

onMounted(() => {
  document.addEventListener("click", closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenu);
});

// ============================================================
// VIEW PRODUCT
// ============================================================

const viewProduct = (product: any) => {
  openMenu.value = null;

  if (product?.slug) {
    router.push(`/product/${product.slug}`);
  }
};

// ============================================================
// EDIT PRODUCT
// ============================================================

const editProduct = (product: any) => {
  openMenu.value = null;

  router.push(`/admin/products/edit/${product.id}`);
};

// ============================================================
// CONFIRM DELETE
// ============================================================

const confirmDelete = (product: any) => {
  openMenu.value = null;

  productToDelete.value = product;
};

// ============================================================
// CANCEL DELETE
// ============================================================

const cancelDelete = () => {
  productToDelete.value = null;
};

// ============================================================
// DELETE PRODUCT
// ============================================================

const deleteProduct = async () => {
  if (!productToDelete.value) {
    return;
  }

  deleting.value = true;

  try {
    const id = productToDelete.value.id;

    console.log("🔥 DELETING PRODUCT:", id);

    await adminFetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    // Remove from local list immediately

    products.value = products.value.filter(
      (product) => Number(product.id) !== Number(id),
    );

    productToDelete.value = null;
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete product.";

    productToDelete.value = null;
  } finally {
    deleting.value = false;
  }
};

// ============================================================
// LOAD
// ============================================================

onMounted(async () => {
  await loadData();
});
</script>
