<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ============================================ -->
    <!-- HEADER -->
    <!-- ============================================ -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Admin Products</h1>

        <p class="text-gray-500 mt-1">
          Manage your products, categories, stock and pricing.
        </p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <!-- ============================================ -->
    <!-- ERROR -->
    <!-- ============================================ -->

    <div
      v-if="errorMessage"
      class="mb-6 bg-red-100 border border-red-300 text-red-700 rounded-lg p-4"
    >
      {{ errorMessage }}
    </div>

    <!-- ============================================ -->
    <!-- LOADING -->
    <!-- ============================================ -->

    <div
      v-if="loading"
      class="bg-white rounded-xl shadow p-12 flex flex-col items-center justify-center"
    >
      <div
        class="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"
      ></div>

      <p class="mt-5 text-gray-600 font-medium">Loading products...</p>

      <p class="text-sm text-gray-400 mt-1">Please wait</p>
    </div>

    <!-- ============================================ -->
    <!-- NO PRODUCTS -->
    <!-- ============================================ -->

    <div
      v-else-if="!mainCategories.length"
      class="bg-white rounded-xl shadow p-12 text-center"
    >
      <div class="text-5xl mb-4">📦</div>

      <h2 class="text-xl font-semibold text-gray-700">No products found</h2>

      <p class="text-gray-500 mt-2">
        There are currently no products to display.
      </p>
    </div>

    <!-- ============================================ -->
    <!-- PRODUCTS -->
    <!-- ============================================ -->

    <div v-else class="space-y-5">
      <!-- ========================================== -->
      <!-- MAIN CATEGORY -->
      <!-- ========================================== -->

      <section
        v-for="category in mainCategories"
        :key="category.id"
        class="bg-white rounded-xl shadow overflow-visible"
      >
        <!-- MAIN CATEGORY HEADER -->

        <button
          type="button"
          @click="toggleCategory(category.id)"
          class="w-full flex items-center justify-between px-6 py-4 bg-slate-50 hover:bg-slate-100 border-b border-gray-200 transition text-left"
        >
          <div class="flex items-center gap-3">
            <!-- Arrow -->

            <svg
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{
                'rotate-90': isCategoryOpen(category.id),
              }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>

            <div>
              <h2 class="text-xl font-bold text-slate-800">
                {{ category.name }}
              </h2>

              <p class="text-sm text-gray-500">
                {{ categoryProductCount(category) }}
                product<span v-if="categoryProductCount(category) !== 1">
                  s
                </span>
              </p>
            </div>
          </div>

          <!-- CATEGORY COUNT -->

          <span
            class="hidden sm:inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold"
          >
            {{ categoryProductCount(category) }}
          </span>
        </button>

        <!-- MAIN CATEGORY CONTENT -->

        <div v-if="isCategoryOpen(category.id)" class="p-4 space-y-4">
          <!-- ======================================== -->
          <!-- PRODUCTS DIRECTLY IN MAIN CATEGORY -->
          <!-- ======================================== -->

          <div
            v-if="category.products.length"
            class="border border-gray-200 rounded-lg overflow-visible"
          >
            <div
              class="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700"
            >
              {{ category.name }}
            </div>

            <div class="divide-y divide-gray-200">
              <ProductItem
                v-for="product in category.products"
                :key="product.id"
                :product="product"
                :categories="categories"
                :open-menu-id="openMenuId"
                @toggle-menu="toggleMenu"
                @delete="deleteProduct"
              />
            </div>
          </div>

          <!-- ======================================== -->
          <!-- SUB CATEGORIES -->
          <!-- ======================================== -->

          <div
            v-for="child in category.children"
            :key="child.id"
            class="border border-gray-200 rounded-lg overflow-visible"
          >
            <!-- SUB CATEGORY HEADER -->

            <button
              type="button"
              @click="toggleCategory(child.id)"
              class="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="w-4 h-4 text-gray-500 transition-transform duration-200"
                  :class="{
                    'rotate-90': isCategoryOpen(child.id),
                  }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>

                <div>
                  <h3 class="font-semibold text-slate-700">
                    {{ child.name }}
                  </h3>

                  <p class="text-xs text-gray-500">
                    {{ child.products.length }}
                    product<span v-if="child.products.length !== 1"> s </span>
                  </p>
                </div>
              </div>

              <span
                class="px-2.5 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold"
              >
                {{ child.products.length }}
              </span>
            </button>

            <!-- SUB CATEGORY PRODUCTS -->

            <div
              v-if="isCategoryOpen(child.id)"
              class="divide-y divide-gray-200"
            >
              <ProductItem
                v-for="product in child.products"
                :key="product.id"
                :product="product"
                :categories="categories"
                :open-menu-id="openMenuId"
                @toggle-menu="toggleMenu"
                @delete="deleteProduct"
              />

              <div
                v-if="!child.products.length"
                class="p-6 text-center text-gray-400"
              >
                No products in this category.
              </div>
            </div>
          </div>

          <!-- NO PRODUCTS -->

          <div
            v-if="!category.products.length && !category.children.length"
            class="p-8 text-center text-gray-400 border border-dashed rounded-lg"
          >
            No products in this category.
          </div>
        </div>
      </section>
    </div>

    <!-- ============================================ -->
    <!-- DELETE CONFIRMATION -->
    <!-- ============================================ -->

    <Teleport to="body">
      <div
        v-if="deleteDialog"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <!-- BACKDROP -->

        <div class="absolute inset-0 bg-black/50" @click="cancelDelete"></div>

        <!-- DIALOG -->

        <div
          class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6"
        >
          <div
            class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl mb-4"
          >
            !
          </div>

          <h2 class="text-xl font-bold text-gray-800">Delete Product?</h2>

          <p class="text-gray-600 mt-2">
            Are you sure you really want to delete
            <strong>{{ productToDelete?.name }}</strong
            >?
          </p>

          <p class="text-sm text-red-600 mt-3">This action cannot be undone.</p>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="cancelDelete"
              class="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
            >
              Cancel
            </button>

            <button
              type="button"
              @click="confirmDelete"
              :disabled="deleting"
              class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
            >
              {{ deleting ? "Deleting..." : "Yes, Delete" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

// ==================================================
// ADMIN FETCH
// ==================================================

const adminFetch = useAdminFetch();

// ==================================================
// STATE
// ==================================================

const loading = ref(true);

const errorMessage = ref("");

const products = ref<any[]>([]);

const categories = ref<any[]>([]);

const openCategories = ref<number[]>([]);

const openMenuId = ref<number | null>(null);

const deleteDialog = ref(false);

const productToDelete = ref<any | null>(null);

const deleting = ref(false);

// ==================================================
// CATEGORY HIERARCHY
// ==================================================

const mainCategories = computed(() => {
  const parents = categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return parents.map((parent) => {
    const children = categories.value
      .filter((category) => Number(category.parent_id) === Number(parent.id))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .map((child) => {
        return {
          ...child,

          products: products.value
            .filter(
              (product) => Number(product.category_id) === Number(child.id),
            )
            .sort((a, b) => String(a.name).localeCompare(String(b.name))),
        };
      });

    return {
      ...parent,

      products: products.value
        .filter((product) => Number(product.category_id) === Number(parent.id))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),

      children,
    };
  });
});

// ==================================================
// CATEGORY COUNT
// ==================================================

const categoryProductCount = (category: any) => {
  const directProducts = category.products?.length || 0;

  const childProducts =
    category.children?.reduce(
      (total: number, child: any) => total + (child.products?.length || 0),
      0,
    ) || 0;

  return directProducts + childProducts;
};

// ==================================================
// CATEGORY TOGGLE
// ==================================================

const toggleCategory = (id: number) => {
  const index = openCategories.value.indexOf(id);

  if (index === -1) {
    openCategories.value.push(id);
  } else {
    openCategories.value.splice(index, 1);
  }
};

const isCategoryOpen = (id: number) => {
  return openCategories.value.includes(id);
};

// ==================================================
// PRODUCT MENU
// ==================================================

const toggleMenu = (id: number) => {
  if (openMenuId.value === id) {
    openMenuId.value = null;
  } else {
    // Only one menu can be open at a time
    openMenuId.value = id;
  }
};

// ==================================================
// CLOSE MENU WHEN CLICKING ELSEWHERE
// ==================================================

const closeMenus = () => {
  openMenuId.value = null;
};

// ==================================================
// DELETE
// ==================================================

const deleteProduct = (product: any) => {
  openMenuId.value = null;

  productToDelete.value = product;

  deleteDialog.value = true;
};

const cancelDelete = () => {
  deleteDialog.value = false;

  productToDelete.value = null;
};

const confirmDelete = async () => {
  if (!productToDelete.value) {
    return;
  }

  deleting.value = true;

  errorMessage.value = "";

  try {
    await adminFetch(`/api/admin/products/${productToDelete.value.id}`, {
      method: "DELETE",
    });

    products.value = products.value.filter(
      (product) => product.id !== productToDelete.value.id,
    );

    deleteDialog.value = false;

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

// ==================================================
// LOAD PRODUCTS
// ==================================================

const loadProducts = async () => {
  try {
    console.log("🔥 LOAD PRODUCTS STARTED");

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

    throw error;
  }
};

// ==================================================
// LOAD CATEGORIES
// ==================================================

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

    console.log("🔥 CATEGORIES STORED:", categories.value);
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    throw error;
  }
};

// ==================================================
// CLOSE MENU ON DOCUMENT CLICK
// ==================================================

const handleDocumentClick = () => {
  closeMenus();
};

onMounted(async () => {
  document.addEventListener("click", handleDocumentClick);

  try {
    await Promise.all([loadProducts(), loadCategories()]);
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load products.";
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<!-- ================================================== -->
<!-- PRODUCT ITEM COMPONENT -->
<!-- ================================================== -->

<script lang="ts">
import { defineComponent, h } from "vue";

export default defineComponent({
  components: {
    ProductItem: defineComponent({
      name: "ProductItem",

      props: {
        product: {
          type: Object,
          required: true,
        },

        categories: {
          type: Array,
          default: () => [],
        },

        openMenuId: {
          type: [Number, null],
          default: null,
        },
      },

      emits: ["toggle-menu", "delete"],

      setup(props, { emit }) {
        const getCategory = () => {
          return (props.categories as any[]).find(
            (category: any) =>
              Number(category.id) === Number(props.product.category_id),
          );
        };

        const image = computed(() => {
          if (
            Array.isArray(props.product.images) &&
            props.product.images.length
          ) {
            return props.product.images[0];
          }

          if (
            typeof props.product.images === "string" &&
            props.product.images
          ) {
            return props.product.images;
          }

          return "";
        });

        const isOpen = computed(() => {
          return props.openMenuId === props.product.id;
        });

        return () => {
          const category = getCategory();

          return h(
            "div",
            {
              class:
                "relative flex flex-col md:flex-row md:items-center gap-4 p-4 hover:bg-gray-50 transition",
            },
            [
              // IMAGE
              h(
                "div",
                {
                  class:
                    "w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center",
                },
                [
                  image.value
                    ? h("img", {
                        src: image.value,
                        alt: props.product.name || "Product",
                        class: "w-full h-full object-contain p-2",
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

              // PRODUCT DETAILS
              h(
                "div",
                {
                  class: "flex-1 min-w-0",
                },
                [
                  h(
                    "div",
                    {
                      class: "flex flex-wrap items-center gap-2",
                    },
                    [
                      h(
                        "h3",
                        {
                          class: "font-semibold text-slate-800",
                        },
                        props.product.name,
                      ),

                      props.product.featured
                        ? h(
                            "span",
                            {
                              class:
                                "px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold",
                            },
                            "Featured",
                          )
                        : null,

                      props.product.refurbished
                        ? h(
                            "span",
                            {
                              class:
                                "px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold",
                            },
                            "Refurbished",
                          )
                        : null,
                    ],
                  ),

                  h(
                    "p",
                    {
                      class: "text-sm text-gray-500 mt-1",
                    },
                    category?.name || "Uncategorised",
                  ),

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
                        `$${props.product.price}`,
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
                          class:
                            props.product.stock > 0
                              ? "text-sm text-green-600 font-medium"
                              : "text-sm text-red-600 font-medium",
                        },
                        props.product.stock > 0
                          ? `${props.product.stock} in stock`
                          : "Out of stock",
                      ),
                    ],
                  ),
                ],
              ),

              // ACTION MENU
              h(
                "div",
                {
                  class: "relative shrink-0 self-start md:self-center",
                  onClick: (event: MouseEvent) => {
                    event.stopPropagation();
                  },
                },
                [
                  // THREE HORIZONTAL DOTS
                  h(
                    "button",
                    {
                      type: "button",
                      class:
                        "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition",
                      title: "Product actions",
                      onClick: () => emit("toggle-menu", props.product.id),
                    },
                    [
                      h(
                        "svg",
                        {
                          class: "w-5 h-5",
                          fill: "currentColor",
                          viewBox: "0 0 20 20",
                        },
                        [
                          h("path", {
                            "fill-rule": "evenodd",
                            d: "M4 10a2 2 0 114 0 2 2 0 01-4 0zm4 0a2 2 0 114 0 2 2 0 01-4 0zm4 0a2 2 0 114 0 2 2 0 01-4 0z",
                            "clip-rule": "evenodd",
                          }),
                        ],
                      ),
                    ],
                  ),

                  // POPUP MENU
                  isOpen.value
                    ? h(
                        "div",
                        {
                          class:
                            "absolute right-0 top-11 z-[9999] w-40 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden",
                        },
                        [
                          h(
                            NuxtLink,
                            {
                              to: `/product/${props.product.slug}`,
                              class:
                                "flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100",
                              onClick: () =>
                                emit("toggle-menu", props.product.id),
                            },
                            [h("span", "👁️"), h("span", "View")],
                          ),

                          h(
                            NuxtLink,
                            {
                              to: `/admin/products/edit/${props.product.id}`,
                              class:
                                "flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100",
                              onClick: () =>
                                emit("toggle-menu", props.product.id),
                            },
                            [h("span", "✏️"), h("span", "Edit")],
                          ),

                          h(
                            "button",
                            {
                              type: "button",
                              class:
                                "w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left",
                              onClick: () => emit("delete", props.product),
                            },
                            [h("span", "🗑️"), h("span", "Delete")],
                          ),
                        ],
                      )
                    : null,
                ],
              ),
            ],
          );
        };
      },
    }),
  },
});
</script>
