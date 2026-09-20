<template>
  <main class="admin-content">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <NuxtLink to="/admin/products" class="text-sm font-bold text-blue-600">← Products</NuxtLink>
        <p class="mt-3 text-xs font-black uppercase tracking-wider text-blue-600">Products</p>
        <h1 class="text-3xl font-black">Bulk Stock Levels</h1>
        <p class="text-slate-500">Update low stock, reorder and target stock levels across multiple products.</p>
      </div>
      <button class="btn-primary" :disabled="saving || !dirtyCount" @click="saveAll">
        {{ saving ? "Saving…" : `Save All Changes${dirtyCount ? ` (${dirtyCount})` : ""}` }}
      </button>
    </div>

    <div v-if="message" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-semibold text-emerald-800">{{ message }}</div>
    <div v-if="errorMessage" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700">{{ errorMessage }}</div>

    <section class="panel mt-5 p-4">
      <div class="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_auto]">
        <input v-model="search" class="input" placeholder="Search product or SKU…" />
        <select v-model="categoryFilter" class="input">
          <option value="">All categories</option>
          <option v-for="category in categories" :key="category.id" :value="String(category.id)">{{ category.name }}</option>
        </select>
        <label class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
          <input v-model="activeOnly" type="checkbox" />
          Active products only
        </label>
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-4">
        <div>
          <label class="label">Low Stock Level</label>
          <input v-model.number="bulk.low_stock_level" type="number" min="0" step="1" class="input w-36" />
        </div>
        <div>
          <label class="label">Reorder Level</label>
          <input v-model.number="bulk.reorder_level" type="number" min="0" step="1" class="input w-36" />
        </div>
        <div>
          <label class="label">Target Stock Level</label>
          <input v-model.number="bulk.target_stock_level" type="number" min="0" step="1" class="input w-40" />
        </div>
        <button class="btn-secondary" @click="applyToFiltered">Apply to {{ filteredProducts.length }} Filtered Products</button>
      </div>
      <p class="mt-2 text-xs text-slate-500">Bulk values are applied to the products currently visible after your search/category filters. Nothing is written to the database until Save All Changes is clicked.</p>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 class="text-lg font-black">Product Stock Rules</h2>
          <p class="text-sm text-slate-500">{{ filteredProducts.length }} of {{ products.length }} products shown · {{ dirtyCount }} changed</p>
        </div>
        <button v-if="dirtyCount" class="btn-secondary" @click="resetChanges">Discard Changes</button>
      </div>

      <div v-if="loading" class="p-10 text-center font-semibold text-slate-500">Loading products…</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-sm">
          <thead>
            <tr class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="p-3">Product</th>
              <th class="p-3">SKU</th>
              <th class="p-3">Category</th>
              <th class="p-3 text-right">Current Stock</th>
              <th class="p-3 text-center">Low Stock Level</th>
              <th class="p-3 text-center">Reorder Level</th>
              <th class="p-3 text-center">Target Stock Level</th>
              <th class="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id" class="border-t" :class="isDirty(product) ? 'bg-blue-50/60' : ''">
              <td class="p-3">
                <div class="font-bold text-slate-900">{{ product.name }}</div>
                <div v-if="product.active === false" class="text-xs font-bold text-slate-400">Inactive</div>
              </td>
              <td class="p-3 text-slate-600">{{ product.product_code || "—" }}</td>
              <td class="p-3 text-slate-600">{{ product.category_name || "—" }}</td>
              <td class="p-3 text-right font-black">{{ product.stock }}</td>
              <td class="p-3">
                <input v-model.number="product.low_stock_level" type="number" min="0" step="1" class="level-input" @input="clearMessages" />
              </td>
              <td class="p-3">
                <input v-model.number="product.reorder_level" type="number" min="0" step="1" class="level-input" @input="clearMessages" />
              </td>
              <td class="p-3">
                <input v-model.number="product.target_stock_level" type="number" min="0" step="1" class="level-input" @input="clearMessages" />
              </td>
              <td class="p-3"><span :class="statusClass(product)" class="rounded-full px-2.5 py-1 text-xs font-black">{{ stockStatus(product) }}</span></td>
            </tr>
            <tr v-if="!filteredProducts.length">
              <td colspan="8" class="p-10 text-center text-slate-500">No products match your filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="sticky bottom-4 mt-5 flex justify-end">
      <button class="btn-primary shadow-xl" :disabled="saving || !dirtyCount" @click="saveAll">
        {{ saving ? "Saving…" : `Save All Changes${dirtyCount ? ` (${dirtyCount})` : ""}` }}
      </button>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["admin"] });

const { adminFetch } = useAdminFetch();
const loading = ref(true);
const saving = ref(false);
const search = ref("");
const categoryFilter = ref("");
const activeOnly = ref(false);
const message = ref("");
const errorMessage = ref("");
const products = ref<any[]>([]);
const original = ref<Record<string, { low_stock_level: number; reorder_level: number; target_stock_level: number }>>({});
const categories = ref<any[]>([]);
const bulk = reactive({ low_stock_level: 2, reorder_level: 3, target_stock_level: 5 });

const asWhole = (value: any) => Math.max(0, Math.floor(Number(value) || 0));

const snapshot = () => {
  original.value = Object.fromEntries(products.value.map((p: any) => [String(p.id), {
    low_stock_level: asWhole(p.low_stock_level),
    reorder_level: asWhole(p.reorder_level),
    target_stock_level: asWhole(p.target_stock_level),
  }]));
};

const isDirty = (p: any) => {
  const old = original.value[String(p.id)];
  return !!old && (
    asWhole(p.low_stock_level) !== old.low_stock_level ||
    asWhole(p.reorder_level) !== old.reorder_level ||
    asWhole(p.target_stock_level) !== old.target_stock_level
  );
};

const dirtyProducts = computed(() => products.value.filter(isDirty));
const dirtyCount = computed(() => dirtyProducts.value.length);

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase();
  return products.value.filter((p: any) => {
    if (activeOnly.value && p.active === false) return false;
    if (categoryFilter.value && String(p.category_id || "") !== categoryFilter.value) return false;
    return !q ||
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.product_code || "").toLowerCase().includes(q);
  });
});

function clearMessages() {
  message.value = "";
  errorMessage.value = "";
}

function validate(low: number, reorder: number, target: number) {
  if (![low, reorder, target].every(Number.isInteger) || [low, reorder, target].some(v => v < 0)) {
    return "Stock levels must be whole numbers of 0 or more.";
  }
  if (reorder < low) return "Reorder Level must be equal to or higher than Low Stock Level.";
  if (target < reorder) return "Target Stock Level must be equal to or higher than Reorder Level.";
  return "";
}

function applyToFiltered() {
  clearMessages();
  const low = asWhole(bulk.low_stock_level);
  const reorder = asWhole(bulk.reorder_level);
  const target = asWhole(bulk.target_stock_level);
  const problem = validate(low, reorder, target);
  if (problem) {
    errorMessage.value = problem;
    return;
  }
  for (const p of filteredProducts.value) {
    p.low_stock_level = low;
    p.reorder_level = reorder;
    p.target_stock_level = target;
  }
}

function resetChanges() {
  for (const p of products.value) {
    const old = original.value[String(p.id)];
    if (!old) continue;
    p.low_stock_level = old.low_stock_level;
    p.reorder_level = old.reorder_level;
    p.target_stock_level = old.target_stock_level;
  }
  clearMessages();
}

function stockStatus(p: any) {
  const stock = Number(p.stock || 0);
  if (stock <= 0) return "Out / Backorder";
  if (stock <= asWhole(p.low_stock_level)) return "Low Stock";
  if (stock <= asWhole(p.reorder_level)) return "Reorder";
  return "In Stock";
}

function statusClass(p: any) {
  const status = stockStatus(p);
  if (status === "Out / Backorder") return "bg-red-100 text-red-700";
  if (status === "Low Stock") return "bg-amber-100 text-amber-800";
  if (status === "Reorder") return "bg-orange-100 text-orange-800";
  return "bg-emerald-100 text-emerald-700";
}

async function load() {
  loading.value = true;
  clearMessages();
  try {
    // Reuse the existing Products and Categories APIs that already power
    // the working admin pages. This avoids a second product-list query path
    // and keeps this bulk editor in sync with the rest of Admin.
    const [productRows, categoryRows]: any[] = await Promise.all([
      adminFetch("/api/admin/products"),
      adminFetch("/api/admin/categories"),
    ]);

    categories.value = Array.isArray(categoryRows) ? categoryRows : [];

    const categoryMap = new Map(
      categories.value.map((category: any) => [String(category.id), category.name]),
    );

    products.value = (Array.isArray(productRows) ? productRows : []).map((product: any) => ({
      ...product,
      stock: Number(product.stock || 0),
      low_stock_level: Number(product.low_stock_level || 0),
      reorder_level: Number(product.reorder_level || 0),
      target_stock_level: Number(product.target_stock_level || 0),
      category_name:
        product.categories?.name ||
        categoryMap.get(String(product.category_id || "")) ||
        "",
    }));

    snapshot();
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || "Unable to load products.";
  } finally {
    loading.value = false;
  }
}

async function saveAll() {
  clearMessages();
  const changes = dirtyProducts.value.map((p: any) => ({
    id: p.id,
    low_stock_level: asWhole(p.low_stock_level),
    reorder_level: asWhole(p.reorder_level),
    target_stock_level: asWhole(p.target_stock_level),
  }));

  for (const row of changes) {
    const problem = validate(row.low_stock_level, row.reorder_level, row.target_stock_level);
    if (problem) {
      const p = products.value.find((x: any) => String(x.id) === String(row.id));
      errorMessage.value = `${p?.name || "Product"}: ${problem}`;
      return;
    }
  }

  if (!changes.length) return;
  saving.value = true;
  try {
    const result: any = await adminFetch("/api/admin/products/stock-levels", { method: "PUT", body: { products: changes } });
    message.value = `${result.updated || changes.length} product stock level${(result.updated || changes.length) === 1 ? "" : "s"} saved successfully.`;
    snapshot();
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || "Unable to save stock levels.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}
.input{@apply rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100}
.label{@apply mb-1 block text-xs font-bold text-slate-600}
.level-input{@apply mx-auto block w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100}
.btn-primary{@apply rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50}
.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50}
</style>
