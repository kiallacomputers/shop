<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- ========================================================= -->
    <!-- HEADER -->
    <!-- ========================================================= -->

    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-[#566C9D]">Products</h1>

        <p class="text-gray-500 mt-1">Manage products by category</p>
      </div>

      <NuxtLink
        to="/admin/products/create"
        class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- ========================================================= -->
    <!-- LOADING -->
    <!-- ========================================================= -->

    <div v-if="loading" class="bg-white rounded-xl shadow p-10 text-center">
      <div class="flex flex-col items-center gap-3">
        <div
          class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
        ></div>

        <p class="text-gray-500">Loading products...</p>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- ERROR -->
    <!-- ========================================================= -->

    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-5"
    >
      <p class="font-semibold">Unable to load products</p>

      <p class="text-sm mt-1">
        {{ errorMessage }}
      </p>
    </div>

    <!-- ========================================================= -->
    <!-- NO PRODUCTS -->
    <!-- ========================================================= -->

    <div
      v-else-if="groupedCategories.length === 0"
      class="bg-white rounded-xl shadow p-10 text-center"
    >
      <p class="text-gray-500">No products found.</p>
    </div>

    <!-- ========================================================= -->
    <!-- CATEGORY HIERARCHY -->
    <!-- ========================================================= -->

    <div v-else class="space-y-8">
      <!-- ======================================================= -->
      <!-- MAIN CATEGORY -->
      <!-- ======================================================= -->

      <section
        v-for="category in groupedCategories"
        :key="category.id"
        class="bg-white rounded-xl shadow overflow-hidden"
      >
        <!-- MAIN CATEGORY HEADER -->

        <div class="bg-[#566C9D] text-white px-6 py-4">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div>
              <h2 class="text-2xl font-bold">
                {{ category.name }}
              </h2>

              <p class="text-sm text-white/80 mt-1">
                {{ getCategoryProductCount(category) }}
                {{
                  getCategoryProductCount(category) === 1
                    ? "product"
                    : "products"
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- MAIN CATEGORY CONTENT -->

        <div class="p-5 space-y-6">
          <!-- ================================================= -->
          <!-- PRODUCTS DIRECTLY IN MAIN CATEGORY -->
          <!-- ================================================= -->

          <div v-if="category.products.length > 0" class="space-y-3">
            <div
              v-for="product in category.products"
              :key="product.id"
              class="border border-gray-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-gray-50 transition"
            >
              <!-- IMAGE -->

              <div
                class="w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
              >
                <img
                  v-if="getFirstImage(product)"
                  :src="getFirstImage(product)"
                  :alt="product.name"
                  class="w-full h-full object-contain p-2"
                />

                <span v-else class="text-xs text-gray-400"> No Image </span>
              </div>

              <!-- PRODUCT INFORMATION -->

              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-[#566C9D] text-lg">
                  {{ product.name }}
                </h3>

                <p
                  v-if="product.blurb"
                  class="text-sm text-gray-500 mt-1 line-clamp-2"
                >
                  {{ product.blurb }}
                </p>

                <!-- PRODUCT DETAILS -->

                <div class="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm">
                  <span class="text-gray-500">
                    Price:

                    <strong class="text-gray-700">
                      ${{ formatPrice(product.price) }}
                    </strong>
                  </span>

                  <span class="text-gray-500">
                    Stock:

                    <strong
                      :class="
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      "
                    >
                      {{ product.stock }}
                    </strong>
                  </span>

                  <span
                    :class="product.active ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ product.active ? "Active" : "Inactive" }}
                  </span>
                </div>
              </div>

              <!-- BADGES -->

              <div class="flex flex-wrap gap-2">
                <span
                  v-if="product.featured"
                  class="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full"
                >
                  Featured
                </span>

                <span
                  v-if="product.refurbished"
                  class="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full"
                >
                  Refurbished
                </span>
              </div>

              <!-- ACTIONS -->

              <div class="flex items-center gap-2 shrink-0">
                <NuxtLink
                  :to="`/admin/products/edit/${product.id}`"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Edit
                </NuxtLink>

                <button
                  type="button"
                  @click="deleteProduct(product)"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- ================================================= -->
          <!-- SUB CATEGORIES -->
          <!-- ================================================= -->

          <div
            v-for="subcategory in category.children"
            :key="subcategory.id"
            v-show="subcategory.products.length > 0"
            class="border border-gray-200 rounded-xl overflow-hidden"
          >
            <!-- SUB CATEGORY HEADER -->

            <div class="bg-gray-100 border-b border-gray-200 px-5 py-4">
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <h3 class="text-xl font-bold text-[#566C9D]">
                    {{ subcategory.name }}
                  </h3>

                  <p class="text-sm text-gray-500 mt-1">
                    {{ subcategory.products.length }}
                    {{
                      subcategory.products.length === 1 ? "product" : "products"
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- SUB CATEGORY PRODUCTS -->

            <div class="divide-y divide-gray-100">
              <div
                v-for="product in subcategory.products"
                :key="product.id"
                class="p-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-gray-50 transition"
              >
                <!-- IMAGE -->

                <div
                  class="w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
                >
                  <img
                    v-if="getFirstImage(product)"
                    :src="getFirstImage(product)"
                    :alt="product.name"
                    class="w-full h-full object-contain p-2"
                  />

                  <span v-else class="text-xs text-gray-400"> No Image </span>
                </div>

                <!-- PRODUCT INFORMATION -->

                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-[#566C9D] text-lg">
                    {{ product.name }}
                  </h4>

                  <p
                    v-if="product.blurb"
                    class="text-sm text-gray-500 mt-1 line-clamp-2"
                  >
                    {{ product.blurb }}
                  </p>

                  <!-- DETAILS -->

                  <div class="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm">
                    <span class="text-gray-500">
                      Price:

                      <strong class="text-gray-700">
                        ${{ formatPrice(product.price) }}
                      </strong>
                    </span>

                    <span class="text-gray-500">
                      Stock:

                      <strong
                        :class="
                          product.stock > 0 ? 'text-green-600' : 'text-red-600'
                        "
                      >
                        {{ product.stock }}
                      </strong>
                    </span>

                    <span
                      :class="
                        product.active ? 'text-green-600' : 'text-red-600'
                      "
                    >
                      {{ product.active ? "Active" : "Inactive" }}
                    </span>
                  </div>
                </div>

                <!-- BADGES -->

                <div class="flex flex-wrap gap-2">
                  <span
                    v-if="product.featured"
                    class="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full"
                  >
                    Featured
                  </span>

                  <span
                    v-if="product.refurbished"
                    class="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full"
                  >
                    Refurbished
                  </span>
                </div>

                <!-- ACTIONS -->

                <div class="flex items-center gap-2 shrink-0">
                  <NuxtLink
                    :to="`/admin/products/edit/${product.id}`"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Edit
                  </NuxtLink>

                  <button
                    type="button"
                    @click="deleteProduct(product)"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ======================================================= -->
      <!-- UNCATEGORISED -->
      <!-- ======================================================= -->

      <section
        v-if="uncategorisedProducts.length > 0"
        class="bg-white rounded-xl shadow overflow-hidden"
      >
        <div class="bg-gray-600 text-white px-6 py-4">
          <h2 class="text-2xl font-bold">Uncategorised</h2>

          <p class="text-sm text-white/80 mt-1">
            {{ uncategorisedProducts.length }}
            {{ uncategorisedProducts.length === 1 ? "product" : "products" }}
          </p>
        </div>

        <div class="divide-y divide-gray-100">
          <div
            v-for="product in uncategorisedProducts"
            :key="product.id"
            class="p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-gray-50"
          >
            <!-- IMAGE -->

            <div
              class="w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            >
              <img
                v-if="getFirstImage(product)"
                :src="getFirstImage(product)"
                :alt="product.name"
                class="w-full h-full object-contain p-2"
              />

              <span v-else class="text-xs text-gray-400"> No Image </span>
            </div>

            <!-- DETAILS -->

            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-[#566C9D] text-lg">
                {{ product.name }}
              </h3>

              <p v-if="product.blurb" class="text-sm text-gray-500 mt-1">
                {{ product.blurb }}
              </p>

              <div class="flex flex-wrap gap-5 mt-3 text-sm">
                <span>
                  Price:
                  <strong> ${{ formatPrice(product.price) }} </strong>
                </span>

                <span>
                  Stock:
                  <strong
                    :class="
                      product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    "
                  >
                    {{ product.stock }}
                  </strong>
                </span>
              </div>
            </div>

            <!-- ACTIONS -->

            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/admin/products/edit/${product.id}`"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
              >
                Edit
              </NuxtLink>

              <button
                type="button"
                @click="deleteProduct(product)"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/*
|--------------------------------------------------------------------------
| ADMIN PAGE
|--------------------------------------------------------------------------
*/

definePageMeta({
  middleware: "admin",
});

/*
|--------------------------------------------------------------------------
| ADMIN FETCH
|--------------------------------------------------------------------------
*/

const { useAdminFetch } = await import("~/composables/useAdminFetch");

const adminFetch = useAdminFetch();

/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

const loading = ref(true);

const errorMessage = ref("");

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

/*
|--------------------------------------------------------------------------
| LOAD PRODUCTS
|--------------------------------------------------------------------------
*/

const loadProducts = async () => {
  console.log("🔥 ADMIN PRODUCTS PAGE LOADING");

  try {
    const response = await adminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:", response);

    if (Array.isArray(response)) {
      products.value = response;
    } else if (response && Array.isArray(response.products)) {
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

/*
|--------------------------------------------------------------------------
| LOAD CATEGORIES
|--------------------------------------------------------------------------
*/

const loadCategories = async () => {
  console.log("🔥 LOADING CATEGORIES");

  try {
    const response = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:", response);

    if (Array.isArray(response)) {
      categories.value = response;
    } else if (response && Array.isArray(response.categories)) {
      categories.value = response.categories;
    } else {
      categories.value = [];
    }

    console.log("🔥 CATEGORIES STORED:", categories.value);
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| GET FIRST IMAGE
|--------------------------------------------------------------------------
|
| Handles:
|
| images: ["/images/products/test.png"]
|
| and:
|
| images: '["/images/products/test.png"]'
|
|--------------------------------------------------------------------------
*/

const getFirstImage = (product: any) => {
  if (!product?.images) {
    return "";
  }

  /*
   * Already an array
   */

  if (Array.isArray(product.images)) {
    return product.images[0] || "";
  }

  /*
   * JSON string
   */

  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);

      if (Array.isArray(parsed)) {
        return parsed[0] || "";
      }
    } catch {
      /*
       * If it is already a
       * normal image path
       */

      return product.images;
    }
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| SORT PRODUCTS
|--------------------------------------------------------------------------
*/

const sortProducts = (productList: any[]) => {
  return [...productList].sort((a, b) => {
    return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    });
  });
};

/*
|--------------------------------------------------------------------------
| CATEGORY HIERARCHY
|--------------------------------------------------------------------------
*/

const groupedCategories = computed(() => {
  /*
   * Create a map of categories
   */

  const categoryMap = new Map<number, any>();

  /*
   * Add categories to map
   */

  for (const category of categories.value) {
    categoryMap.set(Number(category.id), {
      id: Number(category.id),

      name: category.name,

      parent_id: category.parent_id ? Number(category.parent_id) : null,

      products: [],

      children: [],
    });
  }

  /*
   * Assign products
   */

  for (const product of products.value) {
    const categoryId = product.category_id ? Number(product.category_id) : null;

    if (!categoryId) {
      continue;
    }

    const category = categoryMap.get(categoryId);

    if (category) {
      category.products.push(product);
    }
  }

  /*
   * Build parent/child
   * relationship
   */

  for (const category of categoryMap.values()) {
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);

      if (parent) {
        parent.children.push(category);
      }
    }
  }

  /*
   * Sort products
   */

  for (const category of categoryMap.values()) {
    category.products = sortProducts(category.products);

    category.children.sort((a: any, b: any) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        sensitivity: "base",
      }),
    );
  }

  /*
   * Get MAIN categories
   */

  const mainCategories = Array.from(categoryMap.values()).filter(
    (category) => !category.parent_id,
  );

  /*
   * Sort MAIN categories
   */

  mainCategories.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    }),
  );

  /*
   * Only show categories
   * that contain products
   */

  return mainCategories.filter((category) => {
    const hasDirectProducts = category.products.length > 0;

    const hasChildProducts = category.children.some(
      (child: any) => child.products.length > 0,
    );

    return hasDirectProducts || hasChildProducts;
  });
});

/*
|--------------------------------------------------------------------------
| UNCATEGORISED PRODUCTS
|--------------------------------------------------------------------------
*/

const uncategorisedProducts = computed(() => {
  const categoryIds = new Set(
    categories.value.map((category) => Number(category.id)),
  );

  return sortProducts(
    products.value.filter((product) => {
      if (!product.category_id) {
        return true;
      }

      return !categoryIds.has(Number(product.category_id));
    }),
  );
});

/*
|--------------------------------------------------------------------------
| CATEGORY PRODUCT COUNT
|--------------------------------------------------------------------------
*/

const getCategoryProductCount = (category: any) => {
  let count = category.products.length;

  for (const child of category.children) {
    count += child.products.length;
  }

  return count;
};

/*
|--------------------------------------------------------------------------
| FORMAT PRICE
|--------------------------------------------------------------------------
*/

const formatPrice = (price: any) => {
  const value = Number(price);

  if (Number.isNaN(value)) {
    return "0.00";
  }

  return value.toFixed(2);
};

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/

const deleteProduct = async (product: any) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${product.name}"?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    console.log("🔥 DELETING PRODUCT:", product.id);

    await adminFetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });

    /*
     * Remove from local list
     */

    products.value = products.value.filter((item) => item.id !== product.id);

    console.log("✅ PRODUCT DELETED");
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    alert(
      error?.data?.statusMessage ||
        error?.message ||
        "Unable to delete product.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| LOAD PAGE
|--------------------------------------------------------------------------
*/

try {
  await Promise.all([loadProducts(), loadCategories()]);
} catch (error: any) {
  console.error("🔥 ADMIN PRODUCTS LOAD ERROR:", error);

  errorMessage.value =
    error?.data?.statusMessage || error?.message || "Unable to load products.";
} finally {
  loading.value = false;
}
</script>
