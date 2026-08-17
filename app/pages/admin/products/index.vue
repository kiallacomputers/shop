<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
      <div>
        <NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
          ← Admin Dashboard
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900 mt-2">Manage Products</h1>
        <p class="text-slate-500 mt-1">Add products, update prices and control your stock.</p>
      </div>

      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        + Add Product
      </NuxtLink>
    </div>

    <div
      v-if="message"
      class="mb-5 rounded-lg border px-4 py-3 text-sm"
      :class="messageType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'"
    >
      {{ message }}
    </div>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-slate-200 p-4 sm:p-5">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative w-full lg:max-w-md">
            <input
              v-model="search"
              type="search"
              placeholder="Search products..."
              class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="absolute left-3 top-3 h-4 w-4 text-slate-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m1.6-5.4a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="categoryFilter"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category.id" :value="String(category.id)">
                {{ category.name }}
              </option>
            </select>

            <select
              v-model="stockFilter"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <button
              type="button"
              :disabled="loading"
              class="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              @click="loadProducts"
            >
              Refresh
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
          <span><strong class="text-slate-900">{{ products.length }}</strong> products</span>
          <span><strong class="text-green-700">{{ activeCount }}</strong> active</span>
          <span><strong class="text-amber-700">{{ lowStockCount }}</strong> low stock</span>
          <span><strong class="text-red-700">{{ outOfStockCount }}</strong> out of stock</span>
        </div>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Loading products...</div>

      <div v-else-if="filteredProducts.length === 0" class="p-10 text-center">
        <p class="font-semibold text-slate-700">No products found.</p>
        <p class="text-sm text-slate-500 mt-1">Try changing your search or filters.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3 font-semibold">Product</th>
              <th class="px-5 py-3 font-semibold">Category</th>
              <th class="px-5 py-3 font-semibold text-right">Price</th>
              <th class="px-5 py-3 font-semibold text-center">Stock</th>
              <th class="px-5 py-3 font-semibold text-center">Status</th>
              <th class="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-slate-50/70">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3 min-w-[260px]">
                  <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      v-if="firstImage(product)"
                      :src="firstImage(product)"
                      :alt="product.name"
                      class="h-full w-full object-contain p-1"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No image</div>
                  </div>

                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900 truncate">{{ product.name }}</p>
                    <p class="text-xs text-slate-500 mt-1 truncate">/{{ product.slug }}</p>
                    <div class="mt-1 flex gap-1.5">
                      <span v-if="product.featured" class="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">Featured</span>
                      <span v-if="product.refurbished" class="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">Refurbished</span>
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
                <span class="inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 text-xs font-bold" :class="stockClass(product.stock)">
                  {{ Number(product.stock || 0) }}
                </span>
              </td>

              <td class="px-5 py-4 text-center">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="product.active === false ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'">
                  {{ product.active === false ? "Inactive" : "Active" }}
                </span>
              </td>

              <td class="px-5 py-4 text-right whitespace-nowrap">
                <div class="flex justify-end gap-2">
                  <NuxtLink
                    :to="`/admin/products/${product.id}`"
                    class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  >
                    Edit
                  </NuxtLink>
                  <button
                    type="button"
                    :disabled="deletingId === String(product.id)"
                    class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    @click="deleteProduct(product)"
                  >
                    {{ deletingId === String(product.id) ? "Deleting..." : "Delete" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });

type Category = { id: string | number; name: string; slug?: string | null };
type Product = {
  id: string | number;
  name: string;
  slug: string;
  price: number | string;
  stock: number | string | null;
  active?: boolean | null;
  featured?: boolean | null;
  refurbished?: boolean | null;
  images?: unknown;
  category_id?: string | number | null;
  categories?: Category | null;
};

const { adminFetch } = useAdminFetch();
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const deletingId = ref("");
const search = ref("");
const categoryFilter = ref("");
const stockFilter = ref("all");
const message = ref("");
const messageType = ref<"success" | "error">("success");

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));

const imageArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
};

const firstImage = (product: Product) => imageArray(product.images)[0] || "";

const stockClass = (stock: unknown) => {
  const value = Number(stock || 0);
  if (value <= 0) return "bg-red-100 text-red-700";
  if (value <= 5) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
};

const activeCount = computed(() => products.value.filter((p) => p.active !== false).length);
const lowStockCount = computed(() => products.value.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5).length);
const outOfStockCount = computed(() => products.value.filter((p) => Number(p.stock || 0) <= 0).length);

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase();

  return products.value.filter((product) => {
    const matchesSearch = !term ||
      product.name?.toLowerCase().includes(term) ||
      product.slug?.toLowerCase().includes(term) ||
      product.categories?.name?.toLowerCase().includes(term);

    const matchesCategory = !categoryFilter.value || String(product.category_id || product.categories?.id || "") === categoryFilter.value;

    const stock = Number(product.stock || 0);
    const matchesStock = stockFilter.value === "all" ||
      (stockFilter.value === "in" && stock > 5) ||
      (stockFilter.value === "low" && stock > 0 && stock <= 5) ||
      (stockFilter.value === "out" && stock <= 0);

    return matchesSearch && matchesCategory && matchesStock;
  });
});

const loadProducts = async () => {
  loading.value = true;
  message.value = "";

  try {
    const [productData, categoryData] = await Promise.all([
      adminFetch<Product[]>("/api/admin/products"),
      adminFetch<Category[]>("/api/admin/categories"),
    ]);

    products.value = productData;
    categories.value = categoryData;
  } catch (error: any) {
    messageType.value = "error";
    message.value = error?.data?.statusMessage || error?.statusMessage || "Unable to load products.";
  } finally {
    loading.value = false;
  }
};

const deleteProduct = async (product: Product) => {
  if (!confirm(`Delete ${product.name}?\n\nThis cannot be undone.`)) return;

  deletingId.value = String(product.id);
  message.value = "";

  try {
    await adminFetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    products.value = products.value.filter((item) => item.id !== product.id);
    messageType.value = "success";
    message.value = `${product.name} was deleted.`;
  } catch (error: any) {
    messageType.value = "error";
    message.value = error?.data?.statusMessage || error?.statusMessage || "Unable to delete product.";
  } finally {
    deletingId.value = "";
  }
};

onMounted(loadProducts);
</script>
