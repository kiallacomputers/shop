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

        <p class="text-gray-500 mt-1">Manage your products by category.</p>
      </div>

      <NuxtLink
        to="/admin/products/add"
        class="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- ===================================================== -->
    <!-- ERROR -->
    <!-- ===================================================== -->

    <div
      v-if="errorMessage"
      class="mb-6 bg-red-100 border border-red-300 text-red-700 rounded-lg p-4"
    >
      <p class="font-semibold">Error loading products</p>

      <p class="text-sm mt-1">
        {{ errorMessage }}
      </p>
    </div>

    <!-- ===================================================== -->
    <!-- LOADING -->
    <!-- ===================================================== -->

    <div v-if="loading" class="bg-white rounded-xl shadow p-10 text-center">
      <div class="flex justify-center mb-4">
        <div
          class="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"
        ></div>
      </div>

      <p class="text-gray-500">Loading products...</p>
    </div>

    <!-- ===================================================== -->
    <!-- CONTENT -->
    <!-- ===================================================== -->

    <div v-else>
      <!-- =================================================== -->
      <!-- SUMMARY -->
      <!-- =================================================== -->

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Products</p>

          <p class="text-2xl font-bold text-slate-800">
            {{ products.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Categories</p>

          <p class="text-2xl font-bold text-slate-800">
            {{ categories.length }}
          </p>
        </div>

        <div class="bg-white rounded-xl shadow p-5">
          <p class="text-sm text-gray-500">Main Categories</p>

          <p class="text-2xl font-bold text-slate-800">
            {{ categoryTree.length }}
          </p>
        </div>
      </div>

      <!-- =================================================== -->
      <!-- NO PRODUCTS -->
      <!-- =================================================== -->

      <div
        v-if="products.length === 0"
        class="bg-white rounded-xl shadow p-10 text-center"
      >
        <p class="text-gray-500">No products found.</p>

        <NuxtLink
          to="/admin/products/add"
          class="inline-block mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Add Product
        </NuxtLink>
      </div>

      <!-- =================================================== -->
      <!-- CATEGORY TREE -->
      <!-- =================================================== -->

      <div v-else class="space-y-5">
        <div
          v-for="category in categoryTree"
          :key="category.id"
          class="bg-white rounded-xl shadow overflow-visible"
        >
          <!-- =============================================== -->
          <!-- MAIN CATEGORY HEADER -->
          <!-- =============================================== -->

          <button
            type="button"
            @click="toggleCategory(category.id)"
            class="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 rounded-t-xl transition"
          >
            <div class="flex items-center gap-3">
              <!-- PLUS / MINUS -->

              <span
                class="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-lg"
              >
                {{ isCategoryOpen(category.id) ? "−" : "+" }}
              </span>

              <!-- CATEGORY NAME -->

              <div class="text-left">
                <h2 class="text-lg md:text-xl font-bold text-slate-800">
                  {{ category.name }}
                </h2>

                <p class="text-xs text-gray-500">
                  {{ totalProductsInCategory(category) }}
                  product{{
                    totalProductsInCategory(category) === 1 ? "" : "s"
                  }}
                </p>
              </div>
            </div>

            <!-- CATEGORY ARROW -->

            <svg
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{
                'rotate-180': isCategoryOpen(category.id),
              }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- =============================================== -->
          <!-- CATEGORY CONTENT -->
          <!-- =============================================== -->

          <div v-if="isCategoryOpen(category.id)" class="p-4 space-y-5">
            <!-- ============================================= -->
            <!-- PRODUCTS DIRECTLY UNDER MAIN CATEGORY -->
            <!-- ============================================= -->

            <div v-if="category.products.length" class="space-y-3">
              <div class="flex items-center gap-2 pb-2 border-b">
                <span class="font-semibold text-slate-700">
                  {{ category.name }}
                </span>

                <span
                  class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  {{ category.products.length }}
                </span>
              </div>

              <ProductRow
                v-for="product in category.products"
                :key="product.id"
                :product="product"
                @view="viewProduct"
                @edit="editProduct"
                @delete="confirmDelete"
              />
            </div>

            <!-- ============================================= -->
            <!-- SUB CATEGORIES -->
            <!-- ============================================= -->

            <div
              v-for="child in category.children"
              :key="child.id"
              class="border border-gray-200 rounded-lg overflow-visible"
            >
              <!-- SUB CATEGORY HEADER -->

              <div
                class="flex items-center justify-between px-4 py-3 bg-gray-50"
              >
                <div class="flex items-center gap-2">
                  <span class="text-gray-400"> └─ </span>

                  <h3 class="font-semibold text-slate-700">
                    {{ child.name }}
                  </h3>

                  <span
                    class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full"
                  >
                    {{ child.products.length }}
                  </span>
                </div>
              </div>

              <!-- =========================================== -->
              <!-- SUB CATEGORY PRODUCTS -->
              <!-- =========================================== -->

              <div v-if="child.products.length" class="p-3 space-y-3">
                <ProductRow
                  v-for="product in child.products"
                  :key="product.id"
                  :product="product"
                  @view="viewProduct"
                  @edit="editProduct"
                  @delete="confirmDelete"
                />
              </div>

              <!-- NO PRODUCTS -->

              <div v-else class="p-4 text-sm text-gray-400">
                No products in this category.
              </div>
            </div>

            <!-- ============================================= -->
            <!-- NOTHING -->
            <!-- ============================================= -->

            <div
              v-if="
                !category.products.length &&
                !category.children.some((child) => child.products.length)
              "
              class="text-center py-6 text-gray-400"
            >
              No products in this category.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- DELETE CONFIRMATION MODAL -->
    <!-- ===================================================== -->

    <Teleport to="body">
      <div
        v-if="deleteProduct"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <!-- BACKDROP -->

        <div class="absolute inset-0 bg-black/50" @click="cancelDelete"></div>

        <!-- MODAL -->

        <div
          class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6"
        >
          <div class="flex items-start gap-4">
            <!-- WARNING ICON -->

            <div
              class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A2 2 0 004.52 20h14.96a2 2 0 001.73-3.14l-7.5-13a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <div class="flex-1">
              <h2 class="text-xl font-bold text-slate-800">Delete Product?</h2>

              <p class="mt-2 text-gray-600">
                Are you sure you really want to delete:
              </p>

              <p class="mt-2 font-semibold text-slate-800">
                {{ deleteProduct.name }}
              </p>

              <p class="mt-3 text-sm text-red-600">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <!-- MODAL BUTTONS -->

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="cancelDelete"
              :disabled="deleting"
              class="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
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
    </Teleport>

    <!-- ===================================================== -->
    <!-- SUCCESS MESSAGE -->
    <!-- ===================================================== -->

    <Teleport to="body">
      <div
        v-if="successMessage"
        class="fixed bottom-6 right-6 z-[10000] bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl"
      >
        {{ successMessage }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/* ==========================================================
   ADMIN MIDDLEWARE
========================================================== */

definePageMeta({
  middleware: "admin",
});

/* ==========================================================
   ADMIN FETCH

   IMPORTANT:
   Your useAdminFetch composable returns the function directly:

   const adminFetch = useAdminFetch();

   NOT:

   const { adminFetch } = useAdminFetch();
========================================================== */

const adminFetch = useAdminFetch();

const router = useRouter();

/* ==========================================================
   TYPES
========================================================== */

interface Product {
  id: number;
  slug: string;
  name: string;
  category_id: number | null;
  blurb?: string;
  images?: string[];
  price?: number | string;
  oldPrice?: number | string | null;
  stock?: number;
  featured?: boolean;
  refurbished?: boolean;
  active?: boolean;
}

interface Category {
  id: number;
  name: string;
  slug?: string;
  parent_id: number | null;
  active?: boolean;
}

interface CategoryNode extends Category {
  products: Product[];
  children: CategoryNode[];
}

/* ==========================================================
   STATE
========================================================== */

const loading = ref(true);

const products = ref<Product[]>([]);

const categories = ref<Category[]>([]);

const errorMessage = ref("");

const successMessage = ref("");

/* ==========================================================
   COLLAPSED CATEGORIES

   Starts EMPTY.

   Since isCategoryOpen() checks for an ID in this set,
   all categories start collapsed.
========================================================== */

const openCategories = ref<Set<number>>(new Set());

/* ==========================================================
   DELETE
========================================================== */

const deleteProduct = ref<Product | null>(null);

const deleting = ref(false);

/* ==========================================================
   CATEGORY TREE
========================================================== */

const categoryTree = computed<CategoryNode[]>(() => {
  const categoryMap = new Map<number, CategoryNode>();

  /*
   * Create nodes
   */

  categories.value.forEach((category) => {
    categoryMap.set(category.id, {
      ...category,
      products: [],
      children: [],
    });
  });

  /*
   * Put products into their category
   */

  products.value.forEach((product) => {
    if (product.category_id === null) {
      return;
    }

    const category = categoryMap.get(Number(product.category_id));

    if (category) {
      category.products.push(product);
    }
  });

  /*
   * Sort products alphabetically
   */

  categoryMap.forEach((category) => {
    category.products.sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
  });

  /*
   * Build hierarchy
   */

  const parents: CategoryNode[] = [];

  categoryMap.forEach((category) => {
    if (!category.parent_id) {
      parents.push(category);
    }
  });

  /*
   * Attach children
   */

  categoryMap.forEach((category) => {
    if (category.parent_id) {
      const parent = categoryMap.get(Number(category.parent_id));

      if (parent) {
        parent.children.push(category);
      }
    }
  });

  /*
   * Sort children
   */

  categoryMap.forEach((category) => {
    category.children.sort((a, b) => a.name.localeCompare(b.name));
  });

  /*
   * Sort main categories
   */

  parents.sort((a, b) => a.name.localeCompare(b.name));

  return parents;
});

/* ==========================================================
   CATEGORY OPEN/CLOSE
========================================================== */

const isCategoryOpen = (categoryId: number) => {
  return openCategories.value.has(categoryId);
};

const toggleCategory = (categoryId: number) => {
  const newSet = new Set(openCategories.value);

  if (newSet.has(categoryId)) {
    newSet.delete(categoryId);
  } else {
    newSet.add(categoryId);
  }

  openCategories.value = newSet;
};

/* ==========================================================
   COUNT PRODUCTS
========================================================== */

const totalProductsInCategory = (category: CategoryNode): number => {
  let count = category.products.length;

  category.children.forEach((child) => {
    count += child.products.length;
  });

  return count;
};

/* ==========================================================
   LOAD PRODUCTS
========================================================== */

const loadProducts = async () => {
  console.log("🔥 ADMIN PRODUCTS: LOADING PRODUCTS");

  const response = await adminFetch("/api/admin/products");

  console.log("🔥 ADMIN PRODUCTS RESPONSE:", response);

  /*
   * API may return:
   *
   * [
   *   products...
   * ]
   *
   * OR:
   *
   * {
   *   products: [...]
   * }
   */

  if (Array.isArray(response)) {
    products.value = response;
  } else if (response && Array.isArray(response.products)) {
    products.value = response.products;
  } else {
    products.value = [];
  }

  console.log("🔥 PRODUCTS STORED:", products.value);
};

/* ==========================================================
   LOAD CATEGORIES
========================================================== */

const loadCategories = async () => {
  console.log("🔥 ADMIN PRODUCTS: LOADING CATEGORIES");

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
};

/* ==========================================================
   VIEW PRODUCT
========================================================== */

const viewProduct = (product: Product) => {
  if (!product.slug) {
    return;
  }

  router.push(`/product/${product.slug}`);
};

/* ==========================================================
   EDIT PRODUCT
========================================================== */

const editProduct = (product: Product) => {
  router.push(`/admin/products/edit/${product.id}`);
};

/* ==========================================================
   CONFIRM DELETE
========================================================== */

const confirmDelete = (product: Product) => {
  deleteProduct.value = product;
};

/* ==========================================================
   CANCEL DELETE
========================================================== */

const cancelDelete = () => {
  if (deleting.value) {
    return;
  }

  deleteProduct.value = null;
};

/* ==========================================================
   DELETE PRODUCT
========================================================== */

const deleteProductNow = async () => {
  if (!deleteProduct.value) {
    return;
  }

  deleting.value = true;

  errorMessage.value = "";

  try {
    const id = deleteProduct.value.id;

    console.log("🔥 DELETING PRODUCT:", id);

    await adminFetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    /*
     * Remove product locally immediately
     */

    products.value = products.value.filter((product) => product.id !== id);

    successMessage.value = "Product deleted successfully.";

    deleteProduct.value = null;

    /*
     * Hide success message after 3 seconds
     */

    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (error: any) {
    console.error("🔥 DELETE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete product.";

    deleteProduct.value = null;
  } finally {
    deleting.value = false;
  }
};

/* ==========================================================
   LOAD EVERYTHING
========================================================== */

const load = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    await Promise.all([loadProducts(), loadCategories()]);

    console.log("=================================");

    console.log("🔥 ADMIN PRODUCTS LOADED");

    console.log("Products:", products.value.length);

    console.log("Categories:", categories.value.length);

    console.log("Main Categories:", categoryTree.value.length);

    console.log("=================================");
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

/* ==========================================================
   INITIAL LOAD
========================================================== */

await load();
</script>

<!-- ==========================================================
     PRODUCT ROW COMPONENT

     This keeps the main page much cleaner while providing:
       - Image
       - Product name
       - Price
       - Stock
       - Three-dot menu
========================================================== -->

<script lang="ts">
import { defineComponent, h, ref } from "vue";

export default defineComponent({
  name: "AdminProductsPage",

  components: {
    ProductRow: defineComponent({
      name: "ProductRow",

      props: {
        product: {
          type: Object,
          required: true,
        },
      },

      emits: ["view", "edit", "delete"],

      setup(props, { emit }) {
        const menuOpen = ref(false);

        const closeMenu = () => {
          menuOpen.value = false;
        };

        const handleAction = (action: string) => {
          closeMenu();

          if (action === "view") {
            emit("view", props.product);
          }

          if (action === "edit") {
            emit("edit", props.product);
          }

          if (action === "delete") {
            emit("delete", props.product);
          }
        };

        return () =>
          h(
            "div",
            {
              class:
                "relative flex flex-col md:flex-row md:items-center gap-4 border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition",
            },
            [
              /*
               * IMAGE
               */

              h(
                "div",
                {
                  class:
                    "w-full md:w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg border flex items-center justify-center overflow-hidden",
                },
                [
                  props.product.images && props.product.images.length
                    ? h("img", {
                        src: props.product.images[0],
                        alt: props.product.name,
                        class: "max-w-full max-h-full object-contain p-2",
                      })
                    : h(
                        "span",
                        {
                          class: "text-xs text-gray-400",
                        },
                        "No Image",
                      ),
                ],
              ),

              /*
               * PRODUCT DETAILS
               */

              h(
                "div",
                {
                  class: "flex-1 min-w-0",
                },
                [
                  h(
                    "h4",
                    {
                      class: "font-semibold text-slate-800 line-clamp-2",
                    },
                    props.product.name,
                  ),

                  props.product.blurb
                    ? h(
                        "p",
                        {
                          class: "text-sm text-gray-500 mt-1 line-clamp-1",
                        },
                        props.product.blurb,
                      )
                    : null,

                  /*
                   * MOBILE / DESKTOP DETAILS
                   */

                  h(
                    "div",
                    {
                      class: "flex flex-wrap items-center gap-4 mt-2",
                    },
                    [
                      h(
                        "span",
                        {
                          class: "font-bold text-blue-600",
                        },
                        `$${props.product.price ?? 0}`,
                      ),

                      props.product.oldPrice
                        ? h(
                            "span",
                            {
                              class: "text-sm text-gray-400 line-through",
                            },
                            `$${props.product.oldPrice}`,
                          )
                        : null,

                      h(
                        "span",
                        {
                          class: "text-sm",
                        },
                        props.product.stock && props.product.stock > 0
                          ? `${props.product.stock} in stock`
                          : "Out of stock",
                      ),
                    ],
                  ),
                ],
              ),

              /*
               * BADGES
               */

              h(
                "div",
                {
                  class: "flex flex-wrap gap-2",
                },
                [
                  props.product.featured
                    ? h(
                        "span",
                        {
                          class:
                            "px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded",
                        },
                        "Featured",
                      )
                    : null,

                  props.product.refurbished
                    ? h(
                        "span",
                        {
                          class:
                            "px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded",
                        },
                        "Refurbished",
                      )
                    : null,

                  props.product.active
                    ? h(
                        "span",
                        {
                          class:
                            "px-2 py-1 text-xs bg-green-100 text-green-700 rounded",
                        },
                        "Active",
                      )
                    : h(
                        "span",
                        {
                          class:
                            "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded",
                        },
                        "Inactive",
                      ),
                ],
              ),

              /*
               * THREE DOT MENU
               *
               * z-50 and absolute positioning prevent
               * it being hidden behind the category content.
               */

              h(
                "div",
                {
                  class: "relative flex-shrink-0",
                },
                [
                  /*
                   * THREE DOT BUTTON
                   */

                  h(
                    "button",
                    {
                      type: "button",

                      class:
                        "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600",

                      title: "Product actions",

                      onClick: (event: MouseEvent) => {
                        event.stopPropagation();

                        menuOpen.value = !menuOpen.value;
                      },
                    },
                    [
                      h(
                        "svg",
                        {
                          class: "w-6 h-6",
                          fill: "currentColor",
                          viewBox: "0 0 20 20",
                        },
                        [
                          h("path", {
                            d: "M10 3a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4z",
                          }),
                        ],
                      ),
                    ],
                  ),

                  /*
                   * ACTION MENU
                   */

                  menuOpen.value
                    ? h(
                        "div",
                        {
                          class:
                            "absolute right-0 bottom-full mb-2 w-44 bg-white border border-gray-200 rounded-lg shadow-2xl z-[9999] overflow-hidden",
                          onClick: (event: MouseEvent) => {
                            event.stopPropagation();
                          },
                        },
                        [
                          /*
                           * VIEW
                           */

                          h(
                            "button",
                            {
                              type: "button",

                              class:
                                "w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100",

                              onClick: () => handleAction("view"),
                            },
                            [
                              h(
                                "span",
                                {
                                  class: "w-5 text-center",
                                },
                                "👁",
                              ),

                              "View",
                            ],
                          ),

                          /*
                           * EDIT
                           */

                          h(
                            "button",
                            {
                              type: "button",

                              class:
                                "w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100",

                              onClick: () => handleAction("edit"),
                            },
                            [
                              h(
                                "span",
                                {
                                  class: "w-5 text-center",
                                },
                                "✏️",
                              ),

                              "Edit",
                            ],
                          ),

                          /*
                           * DELETE
                           */

                          h(
                            "button",
                            {
                              type: "button",

                              class:
                                "w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50",

                              onClick: () => handleAction("delete"),
                            },
                            [
                              h(
                                "span",
                                {
                                  class: "w-5 text-center",
                                },
                                "🗑",
                              ),

                              "Delete",
                            ],
                          ),
                        ],
                      )
                    : null,
                ],
              ),
            ],
          );
      },
    }),
  },
});
</script>
