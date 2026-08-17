<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- ========================================= -->
      <!-- PAGE HEADER -->
      <!-- ========================================= -->

      <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8"
      >
        <div>
          <h1 class="text-3xl font-bold text-slate-900">
            Manage Products
          </h1>

          <p class="mt-1 text-slate-500">
            Add, edit and manage products in your store.
          </p>
        </div>

        <NuxtLink
          to="/admin/products/new"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition"
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
              d="M12 4v16m8-8H4"
            />
          </svg>

          Add Product
        </NuxtLink>
      </div>

      <!-- ========================================= -->
      <!-- FILTERS -->
      <!-- ========================================= -->

      <div
        class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <div>
            <label
              for="product-search"
              class="block text-sm font-semibold text-slate-700 mb-2"
            >
              Search Products
            </label>

            <input
              id="product-search"
              v-model="search"
              type="text"
              placeholder="Search by product name..."
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <!-- Category -->
          <div>
            <label
              for="category-filter"
              class="block text-sm font-semibold text-slate-700 mb-2"
            >
              Category
            </label>

            <select
              id="category-filter"
              v-model="categoryFilter"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">
                All Categories
              </option>

              <option
                v-for="category in sortedCategories"
                :key="category.id"
                :value="String(category.id)"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Stock -->
          <div>
            <label
              for="stock-filter"
              class="block text-sm font-semibold text-slate-700 mb-2"
            >
              Stock
            </label>

            <select
              id="stock-filter"
              v-model="stockFilter"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">
                All Stock
              </option>

              <option value="in-stock">
                In Stock
              </option>

              <option value="low-stock">
                Low Stock
              </option>

              <option value="out-of-stock">
                Out of Stock
              </option>
            </select>
          </div>
        </div>

        <!-- Filter Summary -->
        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
        >
          <p class="text-sm text-slate-500">
            Showing
            <span class="font-semibold text-slate-700">
              {{ filteredProducts.length }}
            </span>
            of
            <span class="font-semibold text-slate-700">
              {{ products.length }}
            </span>
            products
          </p>

          <button
            v-if="hasFilters"
            type="button"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700"
            @click="clearFilters"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- ========================================= -->
      <!-- ERROR -->
      <!-- ========================================= -->

      <div
        v-if="errorMessage"
        class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
      >
        {{ errorMessage }}
      </div>

      <!-- ========================================= -->
      <!-- LOADING -->
      <!-- ========================================= -->

      <div
        v-if="loading"
        class="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center"
      >
        <svg
          class="mx-auto h-8 w-8 animate-spin text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />

          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>

        <p class="mt-3 text-slate-500">
          Loading products...
        </p>
      </div>

      <!-- ========================================= -->
      <!-- NO PRODUCTS -->
      <!-- ========================================= -->

      <div
        v-else-if="filteredProducts.length === 0"
        class="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>

        <h2 class="mt-4 text-lg font-bold text-slate-800">
          No products found
        </h2>

        <p class="mt-1 text-sm text-slate-500">
          Try adjusting your filters or add a new product.
        </p>
      </div>

      <!-- ========================================= -->
      <!-- PRODUCTS TABLE -->
      <!-- ========================================= -->

      <div
        v-else
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <!-- =================================== -->
            <!-- TABLE HEADER -->
            <!-- =================================== -->

            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Product
                </th>

                <th
                  class="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Category
                </th>

                <th
                  class="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Price
                </th>

                <th
                  class="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Stock
                </th>

                <th
                  class="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Status
                </th>

                <th
                  class="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <!-- =================================== -->
            <!-- GROUPED PRODUCTS -->
            <!-- =================================== -->

            <tbody>
              <template
                v-for="group in groupedProducts"
                :key="group.category"
              >
                <!-- ================================= -->
                <!-- CATEGORY HEADING -->
                <!-- ================================= -->

                <tr class="bg-slate-100 border-y border-slate-200">
                  <td colspan="6" class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-4 h-4 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                          />
                        </svg>
                      </div>

                      <div>
                        <p class="font-bold text-slate-800">
                          {{ group.category }}
                        </p>

                        <p class="text-xs text-slate-500">
                          {{ group.products.length }}
                          {{
                            group.products.length === 1
                              ? "product"
                              : "products"
                          }}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- ================================= -->
                <!-- PRODUCT ROWS -->
                <!-- ================================= -->

                <tr
                  v-for="product in group.products"
                  :key="product.id"
                  class="border-b border-slate-100 hover:bg-slate-50/70 transition"
                >
                  <!-- Product -->
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3 min-w-[280px]">
                      <div
                        class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                      >
                        <img
                          v-if="firstImage(product)"
                          :src="firstImage(product)"
                          :alt="product.name"
                          class="h-full w-full object-contain p-1"
                        />

                        <div
                          v-else
                          class="flex h-full w-full items-center justify-center text-[10px] text-slate-400"
                        >
                          No image
                        </div>
                      </div>

                      <div class="min-w-0">
                        <p
                          class="font-semibold text-slate-900 truncate"
                        >
                          {{ product.name }}
                        </p>

                        <p
                          v-if="product.slug"
                          class="mt-1 text-xs text-slate-400"
                        >
                          /{{ product.slug }}
                        </p>

                        <div class="mt-2 flex flex-wrap gap-1.5">
                          <span
                            v-if="product.featured"
                            class="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700"
                          >
                            Featured
                          </span>

                          <span
                            v-if="product.refurbished"
                            class="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                          >
                            Refurbished
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Category -->
                  <td
                    class="px-5 py-4 text-slate-600 whitespace-nowrap"
                  >
                    {{ product.categories?.name || "Uncategorised" }}
                  </td>

                  <!-- Price -->
                  <td
                    class="px-5 py-4 text-right font-semibold text-slate-900 whitespace-nowrap"
                  >
                    {{ currency(product.price) }}
                  </td>

                  <!-- Stock -->
                  <td class="px-5 py-4 text-center">
                    <span
                      class="inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 text-xs font-bold"
                      :class="stockClass(product.stock)"
                    >
                      {{ Number(product.stock || 0) }}
                    </span>
                  </td>

                  <!-- Status -->
                  <td class="px-5 py-4 text-center">
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="
                        product.active === false
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-green-100 text-green-700'
                      "
                    >
                      {{
                        product.active === false
                          ? "Inactive"
                          : "Active"
                      }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="px-5 py-4 text-right whitespace-nowrap">
                    <div class="flex justify-end gap-2">
                      <NuxtLink
                        :to="`/admin/products/${product.id}`"
                        class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition"
                      >
                        Edit
                      </NuxtLink>

                      <button
                        type="button"
                        :disabled="deletingId === String(product.id)"
                        class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                        @click="deleteProduct(product)"
                      >
                        {{
                          deletingId === String(product.id)
                            ? "Deleting..."
                            : "Delete"
                        }}
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

type Category = {
  id: string | number;
  name: string;
};

type Product = {
  id: string | number;
  name: string;
  slug?: string | null;
  category_id?: string | number | null;
  price?: number | string | null;
  stock?: number | string | null;
  active?: boolean | null;
  featured?: boolean | null;
  refurbished?: boolean | null;
  images?: string[] | string | null;

  categories?: {
    id?: string | number;
    name?: string;
  } | null;
};

// ========================================
// ADMIN FETCH
// ========================================

const { adminFetch } = useAdminFetch();

// ========================================
// STATE
// ========================================

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);

const loading = ref(true);
const errorMessage = ref("");

const deletingId = ref<string | null>(null);

// ========================================
// FILTERS
// ========================================

const search = ref("");
const categoryFilter = ref("");
const stockFilter = ref("");

// ========================================
// SORTED CATEGORIES
// ========================================

const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    }),
  );
});

// ========================================
// FILTERED PRODUCTS
// ========================================

const filteredProducts = computed(() => {
  const searchValue = search.value.trim().toLowerCase();

  return products.value.filter((product) => {
    // ------------------------------------
    // Search
    // ------------------------------------

    if (searchValue) {
      const productName =
        product.name?.toLowerCase() || "";

      const productSlug =
        product.slug?.toLowerCase() || "";

      const categoryName =
        product.categories?.name?.toLowerCase() || "";

      const matchesSearch =
        productName.includes(searchValue) ||
        productSlug.includes(searchValue) ||
        categoryName.includes(searchValue);

      if (!matchesSearch) {
        return false;
      }
    }

    // ------------------------------------
    // Category
    // ------------------------------------

    if (categoryFilter.value) {
      if (
        String(product.category_id) !==
        String(categoryFilter.value)
      ) {
        return false;
      }
    }

    // ------------------------------------
    // Stock
    // ------------------------------------

    const stock = Number(product.stock || 0);

    if (stockFilter.value === "in-stock") {
      if (stock <= 5) {
        return false;
      }
    }

    if (stockFilter.value === "low-stock") {
      if (stock <= 0 || stock > 5) {
        return false;
      }
    }

    if (stockFilter.value === "out-of-stock") {
      if (stock > 0) {
        return false;
      }
    }

    return true;
  });
});

// ========================================
// GROUP PRODUCTS BY CATEGORY
// ========================================

const groupedProducts = computed(() => {
  const groups = new Map<string, Product[]>();

  for (const product of filteredProducts.value) {
    const categoryName =
      product.categories?.name?.trim() ||
      "Uncategorised";

    if (!groups.has(categoryName)) {
      groups.set(categoryName, []);
    }

    groups.get(categoryName)?.push(product);
  }

  return Array.from(groups.entries())
    .sort(([categoryA], [categoryB]) =>
      categoryA.localeCompare(categoryB, undefined, {
        sensitivity: "base",
      }),
    )
    .map(([category, categoryProducts]) => {
      return {
        category,

        products: [...categoryProducts].sort(
          (productA, productB) =>
            productA.name.localeCompare(
              productB.name,
              undefined,
              {
                sensitivity: "base",
              },
            ),
        ),
      };
    });
});

// ========================================
// HAS FILTERS
// ========================================

const hasFilters = computed(() => {
  return Boolean(
    search.value ||
      categoryFilter.value ||
      stockFilter.value,
  );
});

// ========================================
// CLEAR FILTERS
// ========================================

const clearFilters = () => {
  search.value = "";
  categoryFilter.value = "";
  stockFilter.value = "";
};

// ========================================
// CURRENCY
// ========================================

const currency = (
  amount: number | string | null | undefined,
) => {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
};

// ========================================
// STOCK CLASS
// ========================================

const stockClass = (
  stockValue: number | string | null | undefined,
) => {
  const stock = Number(stockValue || 0);

  if (stock <= 0) {
    return "bg-red-100 text-red-700";
  }

  if (stock <= 5) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-green-100 text-green-700";
};

// ========================================
// FIRST IMAGE
// ========================================

const firstImage = (product: Product) => {
  if (!product.images) {
    return "";
  }

  // Already an array
  if (Array.isArray(product.images)) {
    return product.images[0] || "";
  }

  // JSON string
  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);

      if (Array.isArray(parsed)) {
        return parsed[0] || "";
      }

      return product.images;
    } catch {
      return product.images;
    }
  }

  return "";
};

// ========================================
// LOAD PRODUCTS
// ========================================

const loadProducts = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const result = await adminFetch<Product[]>(
      "/api/admin/products",
    );

    products.value = result || [];
  } catch (error: any) {
    console.error("LOAD PRODUCTS ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load products.";
  } finally {
    loading.value = false;
  }
};

// ========================================
// LOAD CATEGORIES
// ========================================

const loadCategories = async () => {
  try {
    const result = await adminFetch<Category[]>(
      "/api/admin/categories",
    );

    categories.value = result || [];
  } catch (error) {
    console.error(
      "LOAD PRODUCT CATEGORIES ERROR:",
      error,
    );
  }
};

// ========================================
// DELETE PRODUCT
// ========================================

const deleteProduct = async (product: Product) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${product.name}"?`,
  );

  if (!confirmed) {
    return;
  }

  deletingId.value = String(product.id);

  errorMessage.value = "";

  try {
    await adminFetch(
      `/api/admin/products/${product.id}`,
      {
        method: "DELETE",
      },
    );

    products.value = products.value.filter(
      (item) =>
        String(item.id) !== String(product.id),
    );
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete product.";
  } finally {
    deletingId.value = null;
  }
};

// ========================================
// LOAD PAGE
// ========================================

onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadCategories(),
  ]);
});
</script>
