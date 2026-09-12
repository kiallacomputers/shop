<template>
  <main class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <NuxtLink to="/admin" class="text-sm font-bold text-blue-600 hover:text-blue-700 admin-page-backlink">← Admin Dashboard</NuxtLink>
        <p class="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-600">Administration</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Inventory & Low Stock</h1>
        <p class="mt-2 max-w-3xl text-slate-500">
          See what is running low, what is out of stock, customer demand and the approximate value of stock on hand.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="admin-btn-secondary" @click="exportCsv">Export CSV</button>
        <button type="button" :disabled="loading" class="admin-btn-primary" @click="load">{{ loading ? 'Refreshing…' : 'Refresh' }}</button>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{{ errorMessage }}</div>

    <section class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">Stock units</p><p class="mt-2 text-2xl font-black text-slate-900">{{ formatNumber(summary.units) }}</p></div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">Stock value ex GST</p><p class="mt-2 text-2xl font-black text-slate-900">{{ currency(summary.value) }}</p></div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">Low stock</p><p class="mt-2 text-2xl font-black text-amber-700">{{ formatNumber(summary.low) }}</p></div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">Out / back order</p><p class="mt-2 text-2xl font-black text-red-700">{{ formatNumber(summary.out) }}</p></div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">Customers waiting</p><p class="mt-2 text-2xl font-black text-blue-700">{{ formatNumber(summary.waiting) }}</p></div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">Open order qty</p><p class="mt-2 text-2xl font-black text-violet-700">{{ formatNumber(summary.openOrders) }}</p></div>
    </section>

    <section class="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div class="xl:col-span-2">
          <label class="mb-2 block text-sm font-bold text-slate-700">Search</label>
          <input v-model.trim="search" type="search" placeholder="Product, variant, code or category…" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">View</label>
          <select v-model="statusFilter" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm">
            <option value="reorder">Needs reorder</option>
            <option value="all">All inventory</option>
            <option value="low">Low stock</option>
            <option value="out">Out / back order</option>
            <option value="waiting">Customers waiting</option>
            <option value="orders">Open order demand</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">Low-stock level</label>
          <div class="flex items-center gap-2">
            <input v-model.number="lowStockThreshold" min="1" step="1" type="number" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" />
            <span class="text-sm text-slate-500">units</span>
          </div>
        </div>
        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">Sort</label>
          <select v-model="sortBy" class="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm">
            <option value="priority">Reorder priority</option>
            <option value="stock-asc">Stock: lowest first</option>
            <option value="waiting-desc">Most customers waiting</option>
            <option value="orders-desc">Most open order demand</option>
            <option value="value-desc">Highest stock value</option>
            <option value="name">Product name</option>
          </select>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p class="text-sm text-slate-500">Showing <strong class="text-slate-800">{{ filteredItems.length }}</strong> of {{ items.length }} stock lines.</p>
        <p v-if="generatedAt" class="text-xs text-slate-400">Updated {{ formatDate(generatedAt) }}</p>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div v-if="loading && !items.length" class="p-12 text-center text-slate-500">Loading inventory…</div>
      <div v-else-if="!filteredItems.length" class="p-12 text-center">
        <h2 class="text-lg font-bold text-slate-900">Nothing to show</h2>
        <p class="mt-1 text-sm text-slate-500">No inventory lines match the current filters.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-[1050px] w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3 text-center">Stock</th>
              <th class="px-4 py-3 text-center">Open orders</th>
              <th class="px-4 py-3 text-center">Waiting</th>
              <th class="px-4 py-3 text-right">Buy ex GST</th>
              <th class="px-4 py-3 text-right">Stock value</th>
              <th class="px-4 py-3 text-center">Status</th>
              <th class="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in filteredItems" :key="item.key" class="hover:bg-slate-50/70">
              <td class="px-4 py-3">
                <div class="flex min-w-[290px] items-center gap-3">
                  <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img v-if="item.image" :src="item.image" :alt="item.product_name" class="h-full w-full object-contain p-1" />
                    <div v-else class="flex h-full items-center justify-center text-[10px] text-slate-400">No image</div>
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-900">{{ item.product_name }}</p>
                    <p v-if="item.variant_name" class="text-sm font-semibold text-blue-700">{{ item.variant_name }}</p>
                    <p class="mt-0.5 text-xs text-slate-500">{{ item.code || 'No product code' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ item.category }}</td>
              <td class="px-4 py-3 text-center"><span class="inline-flex min-w-11 justify-center rounded-full px-2.5 py-1 text-xs font-black" :class="stockBadge(item)">{{ item.stock }}</span></td>
              <td class="px-4 py-3 text-center"><span :class="item.open_order_qty ? 'font-black text-violet-700' : 'text-slate-400'">{{ item.open_order_qty }}</span></td>
              <td class="px-4 py-3 text-center"><span :class="item.waiting_customers ? 'font-black text-blue-700' : 'text-slate-400'">{{ item.waiting_customers }}</span></td>
              <td class="px-4 py-3 text-right text-slate-600">{{ currency(item.buy_price_ex_gst) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-slate-900">{{ currency(item.stock_value_ex_gst) }}</td>
              <td class="px-4 py-3 text-center"><span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="statusBadge(item).className">{{ statusBadge(item).label }}</span></td>
              <td class="px-4 py-3 text-right">
                <NuxtLink :to="item.variant_id ? `/admin/products/${item.product_id}/variants` : `/admin/products/${item.product_id}`" class="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">{{ item.variant_id ? 'Manage variant' : 'Edit product' }}</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="mt-4 text-xs text-slate-500">
      Stock value uses the product Buy Price ex GST. Variant stock currently uses the parent product buy price because variants do not have a separate buy-cost field.
    </p>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
const { adminFetch } = useAdminFetch();
const items = ref<any[]>([]);
const generatedAt = ref("");
const loading = ref(false);
const errorMessage = ref("");
const search = ref("");
const statusFilter = ref("reorder");
const sortBy = ref("priority");
const lowStockThreshold = ref(5);

const currency = (value: any) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));
const formatNumber = (value: any) => new Intl.NumberFormat("en-AU").format(Number(value || 0));
const formatDate = (value: string) => new Date(value).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
const isLow = (item: any) => item.active && item.stock > 0 && item.stock <= Math.max(1, Number(lowStockThreshold.value || 1));
const needsReorder = (item: any) => item.active && (item.stock <= 0 || isLow(item) || item.open_order_qty > item.stock || item.waiting_customers > 0);

const summary = computed(() => ({
  units: items.value.filter((x) => x.active).reduce((sum, x) => sum + Number(x.stock || 0), 0),
  value: items.value.filter((x) => x.active).reduce((sum, x) => sum + Number(x.stock_value_ex_gst || 0), 0),
  low: items.value.filter(isLow).length,
  out: items.value.filter((x) => x.active && Number(x.stock || 0) <= 0).length,
  waiting: items.value.reduce((sum, x) => sum + Number(x.waiting_customers || 0), 0),
  openOrders: items.value.reduce((sum, x) => sum + Number(x.open_order_qty || 0), 0),
}));

const priorityScore = (item: any) => {
  let score = 0;
  if (!item.active) return -10000;
  if (item.stock <= 0) score += 1000;
  if (item.open_order_qty > item.stock) score += 700 + Number(item.open_order_qty || 0) * 10;
  if (item.waiting_customers > 0) score += 500 + Number(item.waiting_customers || 0) * 10;
  if (isLow(item)) score += 300 + (Math.max(1, Number(lowStockThreshold.value)) - Number(item.stock || 0)) * 5;
  return score;
};

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase();
  let rows = items.value.filter((item) => {
    if (q && ![item.product_name, item.variant_name, item.code, item.category].some((value) => String(value || "").toLowerCase().includes(q))) return false;
    if (statusFilter.value === "reorder" && !needsReorder(item)) return false;
    if (statusFilter.value === "low" && !isLow(item)) return false;
    if (statusFilter.value === "out" && !(item.active && item.stock <= 0)) return false;
    if (statusFilter.value === "waiting" && !(item.waiting_customers > 0)) return false;
    if (statusFilter.value === "orders" && !(item.open_order_qty > 0)) return false;
    if (statusFilter.value === "inactive" && item.active) return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    if (sortBy.value === "stock-asc") return a.stock - b.stock || a.product_name.localeCompare(b.product_name);
    if (sortBy.value === "waiting-desc") return b.waiting_customers - a.waiting_customers || a.stock - b.stock;
    if (sortBy.value === "orders-desc") return b.open_order_qty - a.open_order_qty || a.stock - b.stock;
    if (sortBy.value === "value-desc") return b.stock_value_ex_gst - a.stock_value_ex_gst;
    if (sortBy.value === "name") return a.product_name.localeCompare(b.product_name) || String(a.variant_name || "").localeCompare(String(b.variant_name || ""));
    return priorityScore(b) - priorityScore(a) || a.stock - b.stock || a.product_name.localeCompare(b.product_name);
  });
  return rows;
});

function stockBadge(item: any) {
  if (!item.active) return "bg-slate-100 text-slate-500";
  if (item.stock <= 0) return "bg-red-100 text-red-700";
  if (isLow(item)) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-700";
}
function statusBadge(item: any) {
  if (!item.active) return { label: "Inactive", className: "bg-slate-100 text-slate-600" };
  if (item.stock <= 0 && item.open_order_qty > 0) return { label: "Back order", className: "bg-red-100 text-red-700" };
  if (item.stock <= 0) return { label: "Out of stock", className: "bg-red-100 text-red-700" };
  if (item.open_order_qty > item.stock) return { label: "Order demand", className: "bg-violet-100 text-violet-700" };
  if (item.waiting_customers > 0) return { label: "Customer demand", className: "bg-blue-100 text-blue-700" };
  if (isLow(item)) return { label: "Low stock", className: "bg-amber-100 text-amber-800" };
  return { label: "Healthy", className: "bg-emerald-100 text-emerald-700" };
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await adminFetch<any>("/api/admin/inventory");
    items.value = Array.isArray(result?.items) ? result.items : [];
    generatedAt.value = result?.generated_at || "";
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to load inventory.";
  } finally {
    loading.value = false;
  }
}

function csvCell(value: any) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}
function exportCsv() {
  const headings = ["Product", "Variant", "Product Code", "Category", "Stock", "Open Order Qty", "Customers Waiting", "Buy Price ex GST", "Stock Value ex GST", "Status"];
  const lines = [headings.map(csvCell).join(",")];
  for (const item of filteredItems.value) {
    lines.push([
      item.product_name, item.variant_name || "", item.code || "", item.category, item.stock,
      item.open_order_qty, item.waiting_customers, Number(item.buy_price_ex_gst || 0).toFixed(2),
      Number(item.stock_value_ex_gst || 0).toFixed(2), statusBadge(item).label,
    ].map(csvCell).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kialla-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

onMounted(load);
</script>

