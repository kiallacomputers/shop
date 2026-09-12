<template>
  <main class="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 md:py-10">
    <nav class="kc-breadcrumb mb-5" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="kc-breadcrumb-sep">/</span>
      <span class="text-slate-700">Search</span>
    </nav>

    <section class="rounded-2xl bg-[#0b1f3a] px-4 py-5 text-white shadow-sm sm:px-6 sm:py-7">
      <p class="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Find products</p>
      <h1 class="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Search Kialla Computers</h1>
      <form class="mt-5 flex flex-col gap-2 sm:flex-row" @submit.prevent="submitSearch">
        <label class="sr-only" for="product-search-page">Search products</label>
        <div class="relative flex-1">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input id="product-search-page" v-model="searchInput" type="search" autocomplete="off" class="w-full rounded-xl border border-white/10 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30" placeholder="Search product name, code, category, description or variant..." />
        </div>
        <button type="submit" class="kc-btn-primary min-h-[46px] px-6 py-3 text-sm">Search</button>
      </form>
      <p class="mt-3 text-sm text-slate-300">Try a product name, model, SKU/product code, category or part of a description.</p>
    </section>

    <div v-if="query.length < 2" class="kc-state mt-6">
      Enter at least 2 characters to search the catalogue.
    </div>

    <div v-else class="mt-6 grid items-start gap-6 lg:grid-cols-[240px_1fr]">
      <aside class="kc-panel p-4 lg:sticky lg:top-28">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-black text-[#0b1f3a]">Filter results</h2>
          <button v-if="hasFilters" type="button" class="text-xs font-black text-blue-600 hover:text-blue-800" @click="clearFilters">Clear</button>
        </div>

        <div class="mt-5 space-y-5">
          <label class="block">
            <span class="text-xs font-black uppercase tracking-wide text-slate-500">Category</span>
            <select v-model="filters.category" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
              <option value="">All categories</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>

          <div>
            <span class="text-xs font-black uppercase tracking-wide text-slate-500">Price</span>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label><span class="sr-only">Minimum price</span><input v-model.number="filters.minPrice" type="number" min="0" step="1" class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Min $" /></label>
              <label><span class="sr-only">Maximum price</span><input v-model.number="filters.maxPrice" type="number" min="0" step="1" class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Max $" /></label>
            </div>
          </div>

          <label class="block">
            <span class="text-xs font-black uppercase tracking-wide text-slate-500">Availability</span>
            <select v-model="filters.availability" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
              <option value="">All availability</option>
              <option value="stock">In stock</option>
              <option value="backorder">Back order</option>
            </select>
          </label>

          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            <input v-model="filters.featured" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            <span class="text-sm font-bold text-slate-700">Featured only</span>
          </label>
          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            <input v-model="filters.refurbished" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            <span class="text-sm font-bold text-slate-700">Refurbished only</span>
          </label>
        </div>
      </aside>

      <section class="min-w-0">
        <div class="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-500">
              <span class="font-black text-slate-800">{{ filteredProducts.length }}</span>
              result{{ filteredProducts.length === 1 ? '' : 's' }} for
              <span class="font-black text-[#0b1f3a]">“{{ query }}”</span>
            </p>
            <p v-if="loading" class="mt-1 text-xs text-slate-400">Searching catalogue…</p>
          </div>
          <label class="flex items-center gap-2 text-sm font-bold text-slate-700">
            <span>Sort by</span>
            <select v-model="sortBy" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </label>
        </div>

        <div v-if="errorMessage" class="kc-alert kc-alert-error" role="alert">{{ errorMessage }}</div>
        <div v-else-if="loading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="n in 6" :key="n" class="kc-panel h-[420px] animate-pulse bg-slate-50"></div>
        </div>
        <div v-else-if="sortedProducts.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <ProductCard v-for="product in sortedProducts" :key="product.id" :product="product" />
        </div>
        <div v-else class="kc-state">
          <p class="text-lg font-black text-[#0b1f3a]">No matching products</p>
          <p class="mt-2 text-sm text-slate-500">Try fewer words, part of a product code, or clear the filters.</p>
          <button v-if="hasFilters" type="button" class="mt-4 kc-btn-secondary" @click="clearFilters">Clear filters</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();
const { applyToProducts } = useCustomerPricing();

const query = computed(() => String(route.query.q || '').trim());
const searchInput = ref(query.value);
const products = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const sortBy = ref('relevance');
const filters = reactive({ category: '', minPrice: null, maxPrice: null, availability: '', featured: false, refurbished: false });

const submitSearch = async () => {
  const value = searchInput.value.trim();
  if (value.length < 2) return;
  await router.push({ path: '/search', query: { q: value } });
};

const productPrice = (product) => {
  const variants = Array.isArray(product?.product_variants) ? product.product_variants.filter((variant) => variant?.active !== false) : [];
  const base = Number(product?.customer_price ?? product?.price ?? 0);
  if (!product?.has_variants || !variants.length) return base;
  const prices = variants.map((variant) => Number(variant.customer_price ?? variant.price ?? base)).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : base;
};

const productHasStock = (product) => {
  if (!product?.has_variants) return Number(product?.stock || 0) > 0;
  return (product.product_variants || []).some((variant) => variant?.active !== false && Number(variant?.stock || 0) > 0);
};

const categoryOptions = computed(() => [...new Set(products.value.map((product) => product?.categories?.name).filter(Boolean))].sort((a, b) => a.localeCompare(b)));
const hasFilters = computed(() => Boolean(filters.category || filters.minPrice != null || filters.maxPrice != null || filters.availability || filters.featured || filters.refurbished));

const filteredProducts = computed(() => products.value.filter((product) => {
  const price = productPrice(product);
  if (filters.category && product?.categories?.name !== filters.category) return false;
  if (filters.minPrice != null && filters.minPrice !== '' && price < Number(filters.minPrice)) return false;
  if (filters.maxPrice != null && filters.maxPrice !== '' && price > Number(filters.maxPrice)) return false;
  if (filters.availability === 'stock' && !productHasStock(product)) return false;
  if (filters.availability === 'backorder' && productHasStock(product)) return false;
  if (filters.featured && !product.featured) return false;
  if (filters.refurbished && !product.refurbished) return false;
  return true;
}));

const sortedProducts = computed(() => {
  const rows = [...filteredProducts.value];
  if (sortBy.value === 'price-asc') return rows.sort((a, b) => productPrice(a) - productPrice(b));
  if (sortBy.value === 'price-desc') return rows.sort((a, b) => productPrice(b) - productPrice(a));
  if (sortBy.value === 'name-asc') return rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  if (sortBy.value === 'name-desc') return rows.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
  return rows.sort((a, b) => Number(b.search_score || 0) - Number(a.search_score || 0));
});

const clearFilters = () => {
  filters.category = '';
  filters.minPrice = null;
  filters.maxPrice = null;
  filters.availability = '';
  filters.featured = false;
  filters.refurbished = false;
};

const loadProducts = async () => {
  searchInput.value = query.value;
  products.value = [];
  errorMessage.value = '';
  clearFilters();
  sortBy.value = 'relevance';
  if (query.value.length < 2) return;

  loading.value = true;
  try {
    const rows = await $fetch('/api/products/search', { query: { q: query.value, limit: 250 } });
    products.value = Array.isArray(rows) ? rows : [];
    if (import.meta.client && products.value.length) await applyToProducts(products.value);
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to search products.';
  } finally {
    loading.value = false;
  }
};

watch(query, loadProducts, { immediate: true });
watch(user, async () => {
  if (import.meta.client && products.value.length) await applyToProducts(products.value);
});

useSeoMeta({
  title: () => query.value ? `Search: ${query.value} | Kialla Computers` : 'Product Search | Kialla Computers',
  description: 'Search Kialla Computers products by name, product code, category, description and variant.',
});
</script>
