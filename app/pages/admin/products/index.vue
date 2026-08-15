<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ====================================================== -->
    <!-- PAGE HEADER -->
    <!-- ====================================================== -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Products</h1>

        <p class="text-gray-500 mt-1">Manage products by category.</p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- ====================================================== -->
    <!-- LOADING -->
    <!-- ====================================================== -->

    <div v-if="loading" class="bg-white rounded-xl shadow p-10 text-center">
      <div class="text-gray-500">Loading products...</div>
    </div>

    <!-- ====================================================== -->
    <!-- ERROR -->
    <!-- ====================================================== -->

    <div
      v-else-if="errorMessage"
      class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mb-6"
    >
      <strong>Error:</strong>
      {{ errorMessage }}
    </div>

    <!-- ====================================================== -->
    <!-- CONTENT -->
    <!-- ====================================================== -->

    <div v-else>
      <!-- ==================================================== -->
      <!-- SUMMARY -->
      <!-- ==================================================== -->

      <div
        class="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap items-center gap-6"
      >
        <div>
          <span class="text-sm text-gray-500"> Products </span>

          <span class="ml-2 font-bold text-slate-800">
            {{ products.length }}
          </span>
        </div>

        <div>
          <span class="text-sm text-gray-500"> Categories </span>

          <span class="ml-2 font-bold text-slate-800">
            {{ categories.length }}
          </span>
        </div>

        <div>
          <span class="text-sm text-gray-500"> Main Categories </span>

          <span class="ml-2 font-bold text-slate-800">
            {{ categoryHierarchy.length }}
          </span>
        </div>
      </div>

      <!-- ==================================================== -->
      <!-- NO PRODUCTS -->
      <!-- ==================================================== -->

      <div
        v-if="products.length === 0"
        class="bg-white rounded-xl shadow p-10 text-center"
      >
        <h2 class="text-xl font-semibold text-slate-700">No products</h2>

        <p class="text-gray-500 mt-2">
          There are currently no products to display.
        </p>
      </div>

      <!-- ==================================================== -->
      <!-- CATEGORY HIERARCHY -->
      <!-- ==================================================== -->

      <div v-else-if="categoryHierarchy.length" class="space-y-6">
        <!-- ================================================== -->
        <!-- MAIN CATEGORY -->
        <!-- ================================================== -->

        <section
          v-for="mainCategory in categoryHierarchy"
          :key="mainCategory.id"
          class="bg-white rounded-xl shadow overflow-visible"
        >
          <!-- ================================================= -->
          <!-- MAIN CATEGORY HEADER -->
          <!-- ================================================= -->

          <button
            type="button"
            @click="toggleCategory(mainCategory.id)"
            class="w-full flex items-center justify-between px-6 py-4 bg-slate-50 hover:bg-slate-100 rounded-t-xl transition"
          >
            <div class="flex items-center gap-3">
              <!-- PLUS / MINUS -->

              <span
                class="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold"
              >
                {{ isCategoryOpen(mainCategory.id) ? "−" : "+" }}
              </span>

              <!-- CATEGORY NAME -->

              <div class="text-left">
                <h2 class="text-xl font-bold text-slate-800">
                  {{ mainCategory.name }}
                </h2>

                <p class="text-sm text-gray-500">
                  {{ getCategoryProductCount(mainCategory) }}
                  product<span
                    v-if="getCategoryProductCount(mainCategory) !== 1"
                    >s</span
                  >
                </p>
              </div>
            </div>

            <!-- ARROW -->

            <span class="text-gray-500 text-xl">
              {{ isCategoryOpen(mainCategory.id) ? "▲" : "▼" }}
            </span>
          </button>

          <!-- ================================================= -->
          <!-- MAIN CATEGORY CONTENT -->
          <!-- ================================================= -->

          <div v-if="isCategoryOpen(mainCategory.id)" class="p-6 space-y-6">
            <!-- =============================================== -->
            <!-- PRODUCTS DIRECTLY IN MAIN CATEGORY -->
            <!-- =============================================== -->

            <div v-if="mainCategory.products.length" class="space-y-3">
              <h3
                class="text-sm font-bold uppercase tracking-wide text-gray-500"
              >
                {{ mainCategory.name }}
              </h3>

              <ProductRow
                v-for="product in mainCategory.products"
                :key="product.id"
                :product="product"
                :menu-open="openMenuId === product.id"
                @toggle-menu="toggleProductMenu"
                @view="viewProduct"
                @edit="editProduct"
                @delete="confirmDelete"
              />
            </div>

            <!-- =============================================== -->
            <!-- SUB CATEGORIES -->
            <!-- =============================================== -->

            <div
              v-for="subCategory in mainCategory.children"
              :key="subCategory.id"
              class="border border-gray-200 rounded-xl overflow-visible"
            >
              <!-- ============================================= -->
              <!-- SUB CATEGORY HEADER -->
              <!-- ============================================= -->

              <button
                type="button"
                @click="toggleCategory(subCategory.id)"
                class="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition rounded-t-xl"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold text-sm"
                  >
                    {{ isCategoryOpen(subCategory.id) ? "−" : "+" }}
                  </span>

                  <div class="text-left">
                    <h3 class="font-bold text-slate-700">
                      {{ subCategory.name }}
                    </h3>

                    <p class="text-xs text-gray-500">
                      {{ subCategory.products.length }}
                      product<span v-if="subCategory.products.length !== 1"
                        >s</span
                      >
                    </p>
                  </div>
                </div>

                <span class="text-gray-400">
                  {{ isCategoryOpen(subCategory.id) ? "▲" : "▼" }}
                </span>
              </button>

              <!-- ============================================= -->
              <!-- SUB CATEGORY PRODUCTS -->
              <!-- ============================================= -->

              <div v-if="isCategoryOpen(subCategory.id)" class="p-4 space-y-3">
                <ProductRow
                  v-for="product in subCategory.products"
                  :key="product.id"
                  :product="product"
                  :menu-open="openMenuId === product.id"
                  @toggle-menu="toggleProductMenu"
                  @view="viewProduct"
                  @edit="editProduct"
                  @delete="confirmDelete"
                />

                <div
                  v-if="!subCategory.products.length"
                  class="text-center text-gray-400 py-6"
                >
                  No products in this category.
                </div>
              </div>
            </div>

            <!-- =============================================== -->
            <!-- EMPTY MAIN CATEGORY -->
            <!-- =============================================== -->

            <div
              v-if="
                !mainCategory.products.length &&
                !mainCategory.children.some((child) => child.products.length)
              "
              class="text-center py-6 text-gray-400"
            >
              No products in this category.
            </div>
          </div>
        </section>
      </div>

      <!-- ==================================================== -->
      <!-- PRODUCTS WITHOUT CATEGORY -->
      <!-- ==================================================== -->

      <section
        v-if="uncategorisedProducts.length"
        class="bg-white rounded-xl shadow overflow-visible mt-6"
      >
        <button
          type="button"
          @click="toggleCategory(uncategorisedId)"
          class="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-t-xl"
        >
          <div class="flex items-center gap-3">
            <span
              class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold"
            >
              {{ isCategoryOpen(uncategorisedId) ? "−" : "+" }}
            </span>

            <div class="text-left">
              <h2 class="text-xl font-bold text-slate-700">Uncategorised</h2>

              <p class="text-sm text-gray-500">
                {{ uncategorisedProducts.length }}
                products
              </p>
            </div>
          </div>

          <span class="text-gray-400">
            {{ isCategoryOpen(uncategorisedId) ? "▲" : "▼" }}
          </span>
        </button>

        <div v-if="isCategoryOpen(uncategorisedId)" class="p-6 space-y-3">
          <ProductRow
            v-for="product in uncategorisedProducts"
            :key="product.id"
            :product="product"
            :menu-open="openMenuId === product.id"
            @toggle-menu="toggleProductMenu"
            @view="viewProduct"
            @edit="editProduct"
            @delete="confirmDelete"
          />
        </div>
      </section>
    </div>

    <!-- ====================================================== -->
    <!-- DELETE CONFIRMATION -->
    <!-- ====================================================== -->

    <div
      v-if="deleteProduct"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 class="text-xl font-bold text-slate-800">Delete Product?</h2>

        <p class="text-gray-600 mt-3">
          Are you sure you really want to delete:
        </p>

        <p class="font-bold text-slate-800 mt-2">
          {{ deleteProduct.name }}
        </p>

        <p class="text-sm text-red-600 mt-4">This action cannot be undone.</p>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            @click="cancelDelete"
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

    <!-- ====================================================== -->
    <!-- SUCCESS MESSAGE -->
    <!-- ====================================================== -->

    <div
      v-if="successMessage"
      class="fixed bottom-6 right-6 z-[10000] bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl"
    >
      {{ successMessage }}
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

const router = useRouter();

/* ============================================================
   TYPES
============================================================ */

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
  description?: any[];
  categories?: {
    id?: number;
    name?: string;
    slug?: string;
    parent_id?: number | null;
  };
}

interface Category {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  active?: boolean;
}

interface HierarchyCategory extends Category {
  children: HierarchyCategory[];
  products: Product[];
}

/* ============================================================
   STATE
============================================================ */

const loading = ref(true);

const errorMessage = ref("");

const successMessage = ref("");

const products = ref<Product[]>([]);

const categories = ref<Category[]>([]);

/*
 * The currently opened product action menu.
 *
 * Only ONE product ID can be stored here.
 *
 * null = no menu open.
 */
const openMenuId = ref<number | null>(null);

/*
 * Categories are collapsed by default.
 *
 * We store the IDs of categories that have been opened.
 */
const openCategories = ref<number[]>([]);

/* ============================================================
   DELETE STATE
============================================================ */

const deleteProduct = ref<Product | null>(null);

const deleting = ref(false);

/* ============================================================
   UNCATGORISED ID
============================================================ */

const uncategorisedId = -999999;

/* ============================================================
   LOAD PRODUCTS
============================================================ */

const loadProducts = async () => {
  try {
    loading.value = true;

    errorMessage.value = "";

    console.log("🔥 ADMIN PRODUCTS PAGE LOADING");

    const response = await adminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:", response);

    /*
     * Support both:
     *
     * [
     *   ...
     * ]
     *
     * and:
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

    /*
     * Sort products alphabetically.
     */

    products.value.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );

    console.log("🔥 PRODUCTS STORED:", products.value);
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
    } else if (response && Array.isArray(response.categories)) {
      categories.value = response.categories;
    } else {
      categories.value = [];
    }

    console.log("🔥 CATEGORIES STORED:", categories.value);
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);
  }
};

/* ============================================================
   CATEGORY HIERARCHY
============================================================ */

const categoryHierarchy = computed<HierarchyCategory[]>(() => {
  const categoryMap = new Map<number, HierarchyCategory>();

  /*
   * Create category objects.
   */

  categories.value.forEach((category) => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      products: [],
    });
  });

  /*
   * Attach products to categories.
   */

  products.value.forEach((product) => {
    if (product.category_id !== null && product.category_id !== undefined) {
      const category = categoryMap.get(Number(product.category_id));

      if (category) {
        category.products.push(product);
      }
    }
  });

  /*
   * Build parent / child hierarchy.
   */

  const parents: HierarchyCategory[] = [];

  categoryMap.forEach((category) => {
    if (category.parent_id === null || category.parent_id === undefined) {
      parents.push(category);
    } else {
      const parent = categoryMap.get(Number(category.parent_id));

      if (parent) {
        parent.children.push(category);
      } else {
        /*
         * If the parent category doesn't exist,
         * treat this as a main category.
         */

        parents.push(category);
      }
    }
  });

  /*
   * Sort main categories alphabetically.
   */

  parents.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || "")),
  );

  /*
   * Sort children and their products.
   */

  const sortCategory = (category: HierarchyCategory) => {
    category.products.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );

    category.children.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );

    category.children.forEach(sortCategory);
  };

  parents.forEach(sortCategory);

  return parents;
});

/* ============================================================
   UNCATEGORISED PRODUCTS
============================================================ */

const uncategorisedProducts = computed(() => {
  return products.value
    .filter(
      (product) =>
        product.category_id === null || product.category_id === undefined,
    )
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
});

/* ============================================================
   CATEGORY PRODUCT COUNT
============================================================ */

const getCategoryProductCount = (category: HierarchyCategory): number => {
  let count = category.products.length;

  category.children.forEach((child) => {
    count += getCategoryProductCount(child);
  });

  return count;
};

/* ============================================================
   CATEGORY COLLAPSE
============================================================ */

const toggleCategory = (id: number) => {
  const index = openCategories.value.indexOf(id);

  if (index === -1) {
    openCategories.value.push(id);
  } else {
    openCategories.value.splice(index, 1);
  }

  /*
   * Closing a category also closes any
   * product menu that happens to be open.
   */

  openMenuId.value = null;
};

const isCategoryOpen = (id: number): boolean => {
  return openCategories.value.includes(id);
};

/* ============================================================
   PRODUCT MENU
============================================================ */

const toggleProductMenu = (productId: number | null) => {
  /*
   * If the same menu is clicked again,
   * close it.
   */

  if (openMenuId.value === productId) {
    openMenuId.value = null;
    return;
  }

  /*
   * Otherwise this becomes the ONLY
   * open product menu.
   */

  openMenuId.value = productId;
};

/* ============================================================
   VIEW PRODUCT
============================================================ */

const viewProduct = (product: Product) => {
  openMenuId.value = null;

  if (!product.slug) {
    return;
  }

  router.push(`/product/${product.slug}`);
};

/* ============================================================
   EDIT PRODUCT
============================================================ */

const editProduct = (product: Product) => {
  openMenuId.value = null;

  router.push(`/admin/products/edit/${product.id}`);
};

/* ============================================================
   DELETE CONFIRMATION
============================================================ */

const confirmDelete = (product: Product) => {
  openMenuId.value = null;

  deleteProduct.value = product;
};

/* ============================================================
   CANCEL DELETE
============================================================ */

const cancelDelete = () => {
  deleteProduct.value = null;

  deleting.value = false;
};

/* ============================================================
   DELETE PRODUCT
============================================================ */

const deleteProductNow = async () => {
  if (!deleteProduct.value) {
    return;
  }

  try {
    deleting.value = true;

    errorMessage.value = "";

    const id = deleteProduct.value.id;

    console.log("🔥 DELETING PRODUCT:", id);

    await adminFetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    /*
     * Remove product locally.
     */

    products.value = products.value.filter((product) => product.id !== id);

    successMessage.value = "Product deleted successfully.";

    deleteProduct.value = null;

    /*
     * Remove success message after
     * a few seconds.
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

/* ============================================================
   LOAD
============================================================ */

onMounted(async () => {
  await Promise.all([loadProducts(), loadCategories()]);

  loading.value = false;
});
</script>

<!-- ============================================================
     PRODUCT ROW COMPONENT
============================================================ -->

<script lang="ts">
import { defineComponent, h } from "vue";

export default defineComponent({
  components: {},

  props: {
    product: {
      type: Object,
      required: true,
    },

    menuOpen: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["toggle-menu", "view", "edit", "delete"],

  setup(props, { emit }) {
    const handleMenuClick = (event: MouseEvent) => {
      event.stopPropagation();

      emit("toggle-menu", props.product.id);
    };

    const handleView = () => {
      emit("view", props.product);
    };

    const handleEdit = () => {
      emit("edit", props.product);
    };

    const handleDelete = () => {
      emit("delete", props.product);
    };

    return () => {
      const product = props.product as any;

      /*
       * Product image.
       */

      let image = "";

      if (Array.isArray(product.images) && product.images.length) {
        image = product.images[0];
      }

      /*
       * Product price.
       */

      const price =
        product.price !== undefined && product.price !== null
          ? Number(product.price).toFixed(2)
          : "0.00";

      /*
       * Product menu.
       *
       * IMPORTANT:
       * z-index is very high and the row uses
       * overflow-visible so the menu isn't
       * clipped by the category container.
       */

      const menu = props.menuOpen
        ? h(
            "div",
            {
              class:
                "absolute right-0 top-12 w-40 bg-white border border-gray-200 rounded-lg shadow-2xl z-[9999] py-1",
              onClick: (event: MouseEvent) => event.stopPropagation(),
            },
            [
              h(
                "button",
                {
                  type: "button",
                  class:
                    "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                  onClick: handleView,
                },
                "View",
              ),

              h(
                "button",
                {
                  type: "button",
                  class:
                    "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                  onClick: handleEdit,
                },
                "Edit",
              ),

              h(
                "button",
                {
                  type: "button",
                  class:
                    "w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50",
                  onClick: handleDelete,
                },
                "Delete",
              ),
            ],
          )
        : null;

      return h(
        "div",
        {
          class:
            "relative overflow-visible border border-gray-200 rounded-lg bg-white hover:shadow-md transition",
        },
        [
          h(
            "div",
            {
              class: "flex flex-col md:flex-row md:items-center gap-4 p-4",
            },
            [
              /*
               * IMAGE
               */

              h(
                "div",
                {
                  class:
                    "w-full md:w-24 h-24 shrink-0 bg-gray-50 rounded-lg border flex items-center justify-center overflow-hidden",
                },
                [
                  image
                    ? h("img", {
                        src: image,
                        alt: product.name || "Product",
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
               * PRODUCT INFORMATION
               */

              h(
                "div",
                {
                  class: "flex-1 min-w-0",
                },
                [
                  h(
                    "h3",
                    {
                      class: "font-semibold text-slate-800 line-clamp-2",
                    },
                    product.name || "Unnamed Product",
                  ),

                  product.blurb
                    ? h(
                        "p",
                        {
                          class: "text-sm text-gray-500 mt-1 line-clamp-2",
                        },
                        product.blurb,
                      )
                    : null,

                  /*
                   * STATUS
                   */

                  h(
                    "div",
                    {
                      class: "flex flex-wrap items-center gap-2 mt-2",
                    },
                    [
                      product.active
                        ? h(
                            "span",
                            {
                              class:
                                "text-xs px-2 py-1 rounded bg-green-100 text-green-700",
                            },
                            "Active",
                          )
                        : h(
                            "span",
                            {
                              class:
                                "text-xs px-2 py-1 rounded bg-gray-100 text-gray-600",
                            },
                            "Inactive",
                          ),

                      product.featured
                        ? h(
                            "span",
                            {
                              class:
                                "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700",
                            },
                            "Featured",
                          )
                        : null,

                      product.refurbished
                        ? h(
                            "span",
                            {
                              class:
                                "text-xs px-2 py-1 rounded bg-purple-100 text-purple-700",
                            },
                            "Refurbished",
                          )
                        : null,
                    ],
                  ),
                ],
              ),

              /*
               * PRICE
               */

              h(
                "div",
                {
                  class: "md:w-32 shrink-0",
                },
                [
                  h(
                    "div",
                    {
                      class: "text-xl font-bold text-blue-600",
                    },
                    `$${price}`,
                  ),

                  product.stock > 0
                    ? h(
                        "div",
                        {
                          class: "text-sm text-green-600 mt-1",
                        },
                        `${product.stock} in stock`,
                      )
                    : h(
                        "div",
                        {
                          class: "text-sm text-red-600 mt-1",
                        },
                        "Out of stock",
                      ),
                ],
              ),

              /*
               * THREE DOT MENU
               */

              h(
                "div",
                {
                  class: "relative shrink-0 self-start md:self-center",
                },
                [
                  h(
                    "button",
                    {
                      type: "button",
                      title: "Product actions",
                      class:
                        "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-xl font-bold",
                      onClick: handleMenuClick,
                    },
                    "⋮",
                  ),

                  menu,
                ],
              ),
            ],
          ),
        ],
      );
    };
  },
});
</script>
