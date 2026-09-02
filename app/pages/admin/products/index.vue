<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <NuxtLink
            to="/admin"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Admin Dashboard
          </NuxtLink>
          <p class="mt-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
           
          </p>
          <h1 class="mt-3 text-3xl font-bold text-slate-900">Manage Products</h1>
          <p class="mt-1 text-slate-500">Add, edit and manage products in your store.</p>
        </div>

        <NuxtLink to="/admin/products/new"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition">
          <span class="text-xl leading-none">+</span> Add Product
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Search Products</label>
            <input v-model="search" type="text" placeholder="Search by product name..."
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select v-model="categoryFilter"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">All Categories</option>
              <option v-for="category in sortedCategories" :key="category.id" :value="String(category.id)">
                {{ categoryLabel(category) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Stock</label>
            <select v-model="stockFilter"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p class="text-sm text-slate-500">
            Showing <span class="font-semibold text-slate-700">{{ filteredProducts.length }}</span>
            of <span class="font-semibold text-slate-700">{{ products.length }}</span> products
          </p>
          <button v-if="hasFilters" type="button"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700" @click="clearFilters">
            Clear Filters
          </button>
        </div>
      </div>

      <div v-if="errorMessage"
        class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {{ errorMessage }}
      </div>

      <div v-if="loading"
        class="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-500">
        Loading products...
      </div>

      <div v-else-if="filteredProducts.length === 0"
        class="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
        <h2 class="text-lg font-bold text-slate-800">No products found</h2>
        <p class="mt-1 text-sm text-slate-500">Try adjusting your filters or add a new product.</p>
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Product</th>
                <th class="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Category</th>
                <th class="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Price</th>
                <th class="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Stock</th>
                <th class="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th class="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>

            <tbody>
              <template v-for="main in groupedProducts" :key="main.name">
                <tr class="bg-slate-200 border-y border-slate-300">
                  <td colspan="6" class="px-5 py-3">
                    <p class="font-bold text-slate-900">{{ main.name }}</p>
                    <p class="text-xs text-slate-500">
                      {{ main.count }} {{ main.count === 1 ? "product" : "products" }}
                    </p>
                  </td>
                </tr>

                <template v-for="sub in main.subcategories" :key="`${main.name}-${sub.name}`">
                  <tr v-if="sub.name !== main.name" class="bg-blue-50 border-b border-blue-100">
                    <td colspan="6" class="px-5 py-2.5 pl-10">
                      <p class="font-bold text-blue-800">{{ sub.name }}</p>
                      <p class="text-xs text-blue-600">
                        {{ sub.products.length }}
                        {{ sub.products.length === 1 ? "product" : "products" }}
                      </p>
                    </td>
                  </tr>

                  <tr v-for="product in sub.products" :key="product.id"
                    class="border-b border-slate-100 hover:bg-slate-50/70 transition">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3 min-w-[280px]">
                        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <img v-if="firstImage(product)" :src="firstImage(product)" :alt="product.name"
                            class="h-full w-full object-contain p-1" />
                          <div v-else class="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                            No image
                          </div>
                        </div>
                        <div class="min-w-0">
                          <p class="font-semibold text-slate-900 truncate" :title="product.name">{{ product.name }}</p>
                          <p v-if="product.slug" class="mt-1 text-xs text-slate-400 truncate">/{{ product.slug }}</p>
                          <div class="mt-2 flex flex-wrap gap-1.5">
                            <span v-if="product.featured"
                              class="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Featured</span>
                            <span v-if="product.refurbished"
                              class="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Refurbished</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {{ product.categories?.name || "Uncategorised" }}
                    </td>
                    <td class="px-5 py-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {{ currency(product.price) }}
                    </td>
                    <td class="px-5 py-4 text-center">
                      <span class="inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 text-xs font-bold"
                        :class="stockClass(product.stock)">
                        {{ Number(product.stock || 0) }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-center">
                      <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                        :class="product.active === false ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'">
                        {{ product.active === false ? "Inactive" : "Active" }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold leading-none text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="
                          duplicatingId === String(product.id) ||
                          deletingId === String(product.id)
                        "
                        :aria-expanded="actionsMenuProductId === String(product.id)"
                        aria-haspopup="menu"
                        :aria-label="`Actions for ${product.name}`"
                        @click="toggleActionsMenu(product, $event)"
                      >
                        <span aria-hidden="true">⋯</span>
                      </button>
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="actionsMenuProduct"
          ref="actionsMenuRef"
          class="fixed z-[100] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          :style="actionsMenuStyle"
          role="menu"
          @click.stop
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
            role="menuitem"
            @click="editFromMenu"
          >
            <span class="w-5 text-center text-base" aria-hidden="true">✎</span>
            <span>Edit</span>
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-50"
            role="menuitem"
            :disabled="duplicatingId === String(actionsMenuProduct.id)"
            @click="duplicateFromMenu"
          >
            <span class="w-5 text-center text-base" aria-hidden="true">⧉</span>
            <span>{{ duplicatingId === String(actionsMenuProduct.id) ? "Duplicating..." : "Duplicate" }}</span>
          </button>

          <div class="my-1 border-t border-slate-100"></div>

          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            role="menuitem"
            :disabled="deletingId === String(actionsMenuProduct.id)"
            @click="deleteFromMenu"
          >
            <span class="w-5 text-center text-base" aria-hidden="true">🗑</span>
            <span>{{ deletingId === String(actionsMenuProduct.id) ? "Deleting..." : "Delete" }}</span>
          </button>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });

type Category = {
  id: string | number;
  name: string;
  parent_id?: string | number | null;
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
    parent_id?: string | number | null;
  } | null;
};

const { adminFetch } = useAdminFetch();

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const deletingId = ref<string | null>(null);
const duplicatingId = ref<string | null>(null);

const actionsMenuProductId = ref<string | null>(null);
const actionsMenuProduct = ref<Product | null>(null);
const actionsMenuRef = ref<HTMLElement | null>(null);
const actionsMenuStyle = ref<Record<string, string>>({});

const search = ref("");
const categoryFilter = ref("");
const stockFilter = ref("");

const categoryMap = computed(() => {
  const map = new Map<string, Category>();
  categories.value.forEach((category) => map.set(String(category.id), category));
  return map;
});

const mainCategoryFor = (category?: Category | null) => {
  if (!category) return null;
  if (!category.parent_id) return category;
  return categoryMap.value.get(String(category.parent_id)) || category;
};

const categoryLabel = (category: Category) => {
  if (!category.parent_id) return category.name;
  const parent = categoryMap.value.get(String(category.parent_id));
  return parent ? `${parent.name} → ${category.name}` : category.name;
};

const sortedCategories = computed(() =>
  [...categories.value].sort((a, b) => {
    const mainA = mainCategoryFor(a)?.name || a.name;
    const mainB = mainCategoryFor(b)?.name || b.name;
    const mainSort = mainA.localeCompare(mainB, undefined, { sensitivity: "base" });
    return mainSort || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  }),
);

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase();

  return products.value.filter((product) => {
    const category = categoryMap.value.get(String(product.category_id ?? ""));
    const main = mainCategoryFor(category);

    if (term) {
      const text = [product.name, product.slug, category?.name, main?.name]
        .filter(Boolean).join(" ").toLowerCase();
      if (!text.includes(term)) return false;
    }

    if (categoryFilter.value) {
      const selected = categoryMap.value.get(String(categoryFilter.value));

      if (selected && !selected.parent_id) {
        const belongs =
          String(product.category_id) === String(selected.id) ||
          String(category?.parent_id) === String(selected.id);
        if (!belongs) return false;
      } else if (String(product.category_id) !== String(categoryFilter.value)) {
        return false;
      }
    }

    const stock = Number(product.stock || 0);
    if (stockFilter.value === "in-stock" && stock <= 5) return false;
    if (stockFilter.value === "low-stock" && (stock <= 0 || stock > 5)) return false;
    if (stockFilter.value === "out-of-stock" && stock > 0) return false;

    return true;
  });
});

const groupedProducts = computed(() => {
  const mains = new Map<string, Map<string, Product[]>>();

  for (const product of filteredProducts.value) {
    const category = categoryMap.value.get(String(product.category_id ?? ""));

    let mainName = "Uncategorised";
    let subName = "Uncategorised";

    if (category) {
      if (category.parent_id) {
        mainName =
          categoryMap.value.get(String(category.parent_id))?.name?.trim() ||
          "Uncategorised";
        subName = category.name.trim();
      } else {
        mainName = category.name.trim();
        subName = category.name.trim();
      }
    }

    if (!mains.has(mainName)) mains.set(mainName, new Map());
    const subs = mains.get(mainName)!;
    if (!subs.has(subName)) subs.set(subName, []);
    subs.get(subName)!.push(product);
  }

  return [...mains.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([name, subs]) => {
      const subcategories = [...subs.entries()]
        .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
        .map(([subName, subProducts]) => ({
          name: subName,
          products: [...subProducts].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          ),
        }));

      return {
        name,
        count: subcategories.reduce((total, sub) => total + sub.products.length, 0),
        subcategories,
      };
    });
});

const hasFilters = computed(() =>
  Boolean(search.value || categoryFilter.value || stockFilter.value),
);

const clearFilters = () => {
  search.value = "";
  categoryFilter.value = "";
  stockFilter.value = "";
};

const currency = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(amount || 0));

const stockClass = (value: number | string | null | undefined) => {
  const stock = Number(value || 0);
  if (stock <= 0) return "bg-red-100 text-red-700";
  if (stock <= 5) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
};

const firstImage = (product: Product) => {
  if (!product.images) return "";
  if (Array.isArray(product.images)) return product.images[0] || "";

  try {
    const parsed = JSON.parse(product.images);
    return Array.isArray(parsed) ? parsed[0] || "" : product.images;
  } catch {
    return product.images;
  }
};

const loadProducts = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    products.value = (await adminFetch<Product[]>("/api/admin/products")) || [];
  } catch (error: any) {
    console.error("LOAD PRODUCTS ERROR:", error);
    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to load products.";
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    categories.value =
      (await adminFetch<Category[]>("/api/admin/categories")) || [];
  } catch (error) {
    console.error("LOAD PRODUCT CATEGORIES ERROR:", error);
  }
};

const closeActionsMenu = () => {
  actionsMenuProductId.value = null;
  actionsMenuProduct.value = null;
};

const positionActionsMenu = (button: HTMLElement) => {
  const rect = button.getBoundingClientRect();
  const menuWidth = 176;
  const margin = 8;
  const viewportPadding = 12;

  const left = Math.min(
    window.innerWidth - menuWidth - viewportPadding,
    Math.max(viewportPadding, rect.right - menuWidth),
  );

  const estimatedMenuHeight = 142;
  const roomBelow = window.innerHeight - rect.bottom;
  const top =
    roomBelow >= estimatedMenuHeight + margin
      ? rect.bottom + margin
      : Math.max(viewportPadding, rect.top - estimatedMenuHeight - margin);

  actionsMenuStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
  };
};

const toggleActionsMenu = (product: Product, event: MouseEvent) => {
  event.stopPropagation();

  const productId = String(product.id);
  if (actionsMenuProductId.value === productId) {
    closeActionsMenu();
    return;
  }

  actionsMenuProductId.value = productId;
  actionsMenuProduct.value = product;
  positionActionsMenu(event.currentTarget as HTMLElement);
};

const editFromMenu = async () => {
  const product = actionsMenuProduct.value;
  if (!product) return;
  closeActionsMenu();
  await navigateTo(`/admin/products/${product.id}`);
};

const duplicateFromMenu = async () => {
  const product = actionsMenuProduct.value;
  if (!product) return;
  closeActionsMenu();
  await duplicateProduct(product);
};

const deleteFromMenu = async () => {
  const product = actionsMenuProduct.value;
  if (!product) return;
  closeActionsMenu();
  await deleteProduct(product);
};

const handleActionsMenuOutside = (event: MouseEvent) => {
  if (!actionsMenuProduct.value) return;
  const target = event.target as Node | null;
  if (target && actionsMenuRef.value?.contains(target)) return;
  closeActionsMenu();
};

const handleActionsMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeActionsMenu();
};

const duplicateProduct = async (product: Product) => {
  duplicatingId.value = String(product.id);
  errorMessage.value = "";

  try {
    const duplicated = await adminFetch<Product>(
      `/api/admin/products/${product.id}/duplicate`,
      {
        method: "POST",
      },
    );

    products.value.push(duplicated);

    await navigateTo(`/admin/products/${duplicated.id}`);
  } catch (error: any) {
    console.error("DUPLICATE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to duplicate product.";
  } finally {
    duplicatingId.value = null;
  }
};

// ========================================
// DELETE PRODUCT
// ========================================

const deleteProduct = async (product: Product) => {
  if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;

  deletingId.value = String(product.id);
  errorMessage.value = "";

  try {
    await adminFetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    products.value = products.value.filter(
      (item) => String(item.id) !== String(product.id),
    );
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);
    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to delete product.";
  } finally {
    deletingId.value = null;
  }
};

onMounted(async () => {
  document.addEventListener("click", handleActionsMenuOutside);
  document.addEventListener("keydown", handleActionsMenuKeydown);
  window.addEventListener("resize", closeActionsMenu);
  window.addEventListener("scroll", closeActionsMenu, true);

  await Promise.all([loadProducts(), loadCategories()]);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleActionsMenuOutside);
  document.removeEventListener("keydown", handleActionsMenuKeydown);
  window.removeEventListener("resize", closeActionsMenu);
  window.removeEventListener("scroll", closeActionsMenu, true);
});
</script>
