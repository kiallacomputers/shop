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
          Manage your products, categories, stock and pricing.
        </p>
      </div>

      <div class="flex gap-3">
        <NuxtLink
          to="/admin"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          ← Admin
        </NuxtLink>

        <NuxtLink
          to="/admin/products/new"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          + Add Product
        </NuxtLink>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- SUCCESS -->
    <!-- ================================================= -->

    <div
      v-if="successMessage"
      class="mb-6 bg-green-100 border border-green-300 text-green-700 rounded-lg p-4"
    >
      {{ successMessage }}
    </div>

    <!-- ================================================= -->
    <!-- ERROR -->
    <!-- ================================================= -->

    <div
      v-if="errorMessage"
      class="mb-6 bg-red-100 border border-red-300 text-red-700 rounded-lg p-4"
    >
      {{ errorMessage }}
    </div>

    <!-- ================================================= -->
    <!-- LOADING -->
    <!-- ================================================= -->

    <div v-if="loading" class="bg-white rounded-xl shadow p-10 text-center">
      <div class="text-gray-500">Loading products...</div>
    </div>

    <!-- ================================================= -->
    <!-- LOADED -->
    <!-- ================================================= -->

    <div v-else>
      <!-- ================================================= -->
      <!-- SUMMARY -->
      <!-- ================================================= -->

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Products</p>

          <p class="text-3xl font-bold text-slate-800">
            {{ products.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Categories</p>

          <p class="text-3xl font-bold text-slate-800">
            {{ categories.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Main Categories</p>

          <p class="text-3xl font-bold text-slate-800">
            {{ mainCategories.length }}
          </p>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- NO PRODUCTS -->
      <!-- ================================================= -->

      <div
        v-if="products.length === 0"
        class="bg-white rounded-xl shadow p-10 text-center"
      >
        <p class="text-gray-500">No products found.</p>
      </div>

      <!-- ================================================= -->
      <!-- PRODUCTS -->
      <!-- ================================================= -->

      <div v-else class="space-y-6">
        <!-- ================================================= -->
        <!-- MAIN CATEGORY -->
        <!-- ================================================= -->

        <section
          v-for="mainCategory in mainCategories"
          :key="mainCategory.id"
          class="bg-white rounded-xl shadow overflow-hidden"
        >
          <!-- MAIN CATEGORY HEADER -->

          <button
            type="button"
            @click="toggleCategory(mainCategory.id)"
            class="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-xl font-bold text-slate-700 transition-transform"
                :class="{
                  'rotate-90': isCategoryOpen(mainCategory.id),
                }"
              >
                ▶
              </span>

              <div class="text-left">
                <h2 class="text-xl font-bold text-slate-800">
                  {{ mainCategory.name }}
                </h2>

                <p class="text-sm text-gray-500">
                  {{ getMainCategoryProductCount(mainCategory.id) }}
                  product(s)
                </p>
              </div>
            </div>

            <span class="text-sm text-gray-400">
              {{ isCategoryOpen(mainCategory.id) ? "Collapse" : "Expand" }}
            </span>
          </button>

          <!-- MAIN CATEGORY CONTENT -->

          <div v-if="isCategoryOpen(mainCategory.id)" class="border-t">
            <!-- ================================================= -->
            <!-- DIRECT PRODUCTS -->
            <!-- ================================================= -->

            <div
              v-if="getProductsForCategory(mainCategory.id).length"
              class="p-6"
            >
              <h3
                class="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4"
              >
                {{ mainCategory.name }}
              </h3>

              <div class="space-y-3">
                <ProductRow
                  v-for="product in getProductsForCategory(mainCategory.id)"
                  :key="product.id"
                  :product="product"
                  :deleting-id="deletingId"
                  @delete="deleteProduct"
                />
              </div>
            </div>

            <!-- ================================================= -->
            <!-- SUB CATEGORIES -->
            <!-- ================================================= -->

            <div
              v-for="child in getChildren(mainCategory.id)"
              :key="child.id"
              class="border-t"
            >
              <!-- SUB CATEGORY HEADER -->

              <div
                class="bg-gray-50 px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <h3 class="font-semibold text-slate-700">
                    {{ child.name }}
                  </h3>

                  <p class="text-xs text-gray-500">
                    {{ getProductsForCategory(child.id).length }}
                    product(s)
                  </p>
                </div>
              </div>

              <!-- SUB CATEGORY PRODUCTS -->

              <div
                v-if="getProductsForCategory(child.id).length"
                class="p-6 space-y-3"
              >
                <ProductRow
                  v-for="product in getProductsForCategory(child.id)"
                  :key="product.id"
                  :product="product"
                  :deleting-id="deletingId"
                  @delete="deleteProduct"
                />
              </div>

              <div v-else class="px-6 py-4 text-sm text-gray-400">
                No products in this category.
              </div>
            </div>
          </div>
        </section>

        <!-- ================================================= -->
        <!-- PRODUCTS WITH NO CATEGORY -->
        <!-- ================================================= -->

        <section
          v-if="uncategorisedProducts.length"
          class="bg-white rounded-xl shadow overflow-hidden"
        >
          <div class="px-6 py-5 bg-gray-50 border-b">
            <h2 class="text-xl font-bold text-slate-700">Uncategorised</h2>

            <p class="text-sm text-gray-500">
              {{ uncategorisedProducts.length }}
              product(s)
            </p>
          </div>

          <div class="p-6 space-y-3">
            <ProductRow
              v-for="product in uncategorisedProducts"
              :key="product.id"
              :product="product"
              :deleting-id="deletingId"
              @delete="deleteProduct"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// =====================================================
// ADMIN MIDDLEWARE
// =====================================================

definePageMeta({
  middleware: "admin",
});

// =====================================================
// ADMIN FETCH
// =====================================================
//
// IMPORTANT:
// useAdminFetch() returns the function directly.
//
// DO NOT use:
// const { adminFetch } = useAdminFetch();
//
// =====================================================

const adminFetch = useAdminFetch();

const route = useRoute();

// =====================================================
// STATE
// =====================================================

const loading = ref(true);

const deletingId = ref<number | null>(null);

const errorMessage = ref("");

const successMessage = ref("");

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const openCategories = ref<number[]>([]);

// =====================================================
// MAIN CATEGORIES
// =====================================================

const mainCategories = computed(() => {
  return categories.value
    .filter((category: any) => !category.parent_id)
    .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
});

// =====================================================
// CHILD CATEGORIES
// =====================================================

const getChildren = (parentId: number) => {
  return categories.value
    .filter((category: any) => Number(category.parent_id) === Number(parentId))
    .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
};

// =====================================================
// CATEGORY PRODUCTS
// =====================================================

const getProductsForCategory = (categoryId: number) => {
  return products.value
    .filter(
      (product: any) => Number(product.category_id) === Number(categoryId),
    )
    .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
};

// =====================================================
// UNCATEGORISED
// =====================================================

const uncategorisedProducts = computed(() => {
  return products.value
    .filter((product: any) => {
      if (
        product.category_id === null ||
        product.category_id === undefined ||
        product.category_id === ""
      ) {
        return true;
      }

      const categoryExists = categories.value.some(
        (category: any) => Number(category.id) === Number(product.category_id),
      );

      return !categoryExists;
    })
    .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
});

// =====================================================
// PRODUCT COUNT
// =====================================================

const getMainCategoryProductCount = (mainCategoryId: number) => {
  const childIds = getChildren(mainCategoryId).map((child: any) =>
    Number(child.id),
  );

  return products.value.filter((product: any) => {
    const categoryId = Number(product.category_id);

    return (
      categoryId === Number(mainCategoryId) || childIds.includes(categoryId)
    );
  }).length;
};

// =====================================================
// CATEGORY OPEN/CLOSED
// =====================================================

const isCategoryOpen = (categoryId: number) => {
  return openCategories.value.includes(categoryId);
};

const toggleCategory = (categoryId: number) => {
  const index = openCategories.value.indexOf(categoryId);

  if (index === -1) {
    openCategories.value.push(categoryId);
  } else {
    openCategories.value.splice(index, 1);
  }
};

// =====================================================
// LOAD PRODUCTS
// =====================================================

const loadProducts = async () => {
  console.log("🔥 LOAD PRODUCTS STARTED");

  try {
    const response = await adminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:", response);

    if (Array.isArray(response)) {
      products.value = response;
    } else if (Array.isArray(response?.products)) {
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

// =====================================================
// LOAD CATEGORIES
// =====================================================

const loadCategories = async () => {
  console.log("🔥 LOADING CATEGORIES");

  try {
    const response = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:", response);

    if (Array.isArray(response)) {
      categories.value = response;
    } else if (Array.isArray(response?.categories)) {
      categories.value = response.categories;
    } else {
      categories.value = [];
    }

    console.log("🔥 CATEGORIES STORED:", categories.value);
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load categories.";
  }
};

// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteProduct = async (product: any) => {
  if (!product?.id) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete "${product.name}"?\n\nThis cannot be undone.`,
  );

  if (!confirmed) {
    return;
  }

  try {
    deletingId.value = product.id;

    errorMessage.value = "";

    successMessage.value = "";

    console.log("🔥 DELETING PRODUCT:", product.id);

    await adminFetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });

    console.log("✅ PRODUCT DELETED:", product.id);

    // Remove product from local array

    products.value = products.value.filter(
      (item: any) => Number(item.id) !== Number(product.id),
    );

    successMessage.value = `"${product.name}" has been deleted successfully.`;

    // Clear success message

    setTimeout(() => {
      successMessage.value = "";
    }, 4000);
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete product.";
  } finally {
    deletingId.value = null;
  }
};

// =====================================================
// LOAD PAGE
// =====================================================

const load = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    await Promise.all([loadProducts(), loadCategories()]);

    console.log("=================================");

    console.log("🔥 FINAL PRODUCTS:", products.value.length);

    console.log("🔥 FINAL CATEGORIES:", categories.value.length);

    console.log("🔥 MAIN CATEGORIES:", mainCategories.value.length);

    console.log("=================================");
  } catch (error: any) {
    console.error("🔥 ADMIN PRODUCTS LOAD ERROR:", error);
  } finally {
    loading.value = false;
  }
};

// =====================================================
// ON MOUNT
// =====================================================

onMounted(() => {
  load();
});
</script>
