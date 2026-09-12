<template>
  <main class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-7 md:py-10">
    <nav class="kc-breadcrumb mb-5" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="kc-breadcrumb-sep">/</span>
      <NuxtLink to="/#categories">Categories</NuxtLink><span class="kc-breadcrumb-sep">/</span>
      <span class="text-slate-700">{{ category?.name }}</span>
    </nav>
<div class="grid gap-7 lg:grid-cols-[240px_1fr] items-start">
      <aside class="lg:sticky lg:top-28">
        <Sidemenu />
      </aside>

      <section class="min-w-0">
        <div
          class="mb-5 sm:mb-6 rounded-2xl bg-[#0b1f3a] px-4 py-5 sm:px-6 sm:py-7 text-white shadow-sm"
        >
          <div
            class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
          >
            <div class="min-w-0">
              <p
                class="text-xs font-black uppercase tracking-[.16em] text-cyan-300"
              >
                Shop category
              </p>

              <h1 class="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
                {{ category?.name }}
              </h1>

              <p class="mt-2 text-sm text-slate-300">
                Browse our current products in {{ category?.name }}. <span v-if="products?.length" class="text-slate-400">{{ products.length }} product{{ products.length === 1 ? "" : "s" }} available.</span>
              </p>
            </div>

            <div v-if="childCategories.length" class="w-full md:w-72 lg:w-80">
              <label
                for="subcategory-select"
                class="mb-2 block text-xs font-black uppercase tracking-[.14em] text-cyan-300"
              >
                Subcategory
              </label>

              <div class="relative">
                <select
                  id="subcategory-select"
                  :value="''"
                  class="w-full appearance-none rounded-xl border border-white/15 bg-white px-4 py-3 pr-10 text-sm font-bold text-[#0b1f3a] shadow-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                  @change="openSubcategory"
                >
                  <option value="">View all {{ category?.name }}</option>
                  <option
                    v-for="child in childCategories"
                    :key="child.id"
                    :value="child.slug"
                  >
                    {{ child.name }}
                  </option>
                </select>

                <svg
                  class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div v-if="products?.length" class="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm font-semibold text-slate-500"><span class="font-black text-slate-800">{{ products.length }}</span> products</p>
          <label class="flex w-full items-center justify-between gap-2 text-sm font-bold text-slate-700 sm:w-auto sm:justify-start">
            <span>Sort by</span>
            <select v-model="sortBy" class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:flex-none">
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </label>
        </div>

        <div
          v-if="products?.length"
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <ProductCard
            v-for="product in sortedProducts"
            :key="product.id"
            :product="product"
          />
        </div>

        <div v-else class="kc-state">
          <h2 class="font-black text-[#0b1f3a]">No products in this category yet</h2>
          <p class="mt-2 text-sm">Try another category or search the full catalogue.</p>
          <NuxtLink to="/search" class="kc-btn-secondary mt-5">Search products</NuxtLink>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();

const slug = computed(() => String(route.params.slug || ""));

const { visibleCategories } = useStorefrontCategories();

const category = computed(() =>
  (visibleCategories.value || []).find((item) => String(item.slug || "") === slug.value) || null,
);

const categorySeoTitle = computed(() => category.value?.name ? `${category.value.name} — Shop Online` : "Shop Category");
const categorySeoDescription = computed(() =>
  category.value?.name
    ? `Shop ${category.value.name} from Kialla Computers. Browse our current range with secure checkout and Australian delivery.`
    : "Browse products from Kialla Computers."
);
const categoryCanonical = computed(() => `https://shop.kiallacomputers.com.au/category/${encodeURIComponent(slug.value)}`);

useSeoMeta({
  title: () => categorySeoTitle.value,
  description: () => categorySeoDescription.value,
  ogTitle: () => `${category.value?.name || "Shop"} | Kialla Computers`,
  ogDescription: () => categorySeoDescription.value,
  ogUrl: () => categoryCanonical.value,
  twitterTitle: () => `${category.value?.name || "Shop"} | Kialla Computers`,
  twitterDescription: () => categorySeoDescription.value,
});

useHead(() => ({
  link: [{ rel: "canonical", href: categoryCanonical.value }],
  script: category.value ? [{
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://shop.kiallacomputers.com.au/" },
        { "@type": "ListItem", position: 2, name: category.value.name, item: categoryCanonical.value }
      ]
    })
  }] : []
}));

const childCategories = computed(() => {
  if (!category.value) return [];

  return visibleCategories.value
    .filter(
      (item) =>
        item.parent_id != null &&
        String(item.parent_id) === String(category.value.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
});

const openSubcategory = async (event) => {
  const selectedSlug = event?.target?.value;
  if (!selectedSlug) return;
  await router.push(`/category/${selectedSlug}`);
};

const { applyToProducts } = useCustomerPricing();

const { data: products } = await useAsyncData(
  () => `products-${slug.value}`,
  async () => {
    if (!category.value) return [];

    // Parent categories include products from every descendant category.
    const categoryIds = new Set([String(category.value.id)]);
    let foundAnotherLevel = true;

    while (foundAnotherLevel) {
      foundAnotherLevel = false;

      for (const item of visibleCategories.value) {
        if (
          item.parent_id != null &&
          categoryIds.has(String(item.parent_id)) &&
          !categoryIds.has(String(item.id))
        ) {
          categoryIds.add(String(item.id));
          foundAnotherLevel = true;
        }
      }
    }

    const { data, error } = await supabase
      .from("products")
      .select(`id,name,slug,product_code,has_variants,blurb,price,oldPrice,stock,active,featured,refurbished,images,category_id,categories(name),product_variants(id,product_id,name,product_code,price,old_price,stock,active,images)`)
      .in("category_id", [...categoryIds])
      .eq("active", true)
      .order("price");

    if (error) throw error;

    return (data || []).map((product) => ({
      ...product,
      categoryName:
        product.categories?.name ||
        product.categories?.[0]?.name ||
        category.value.name,
    }));
  },
  { watch: [slug, category, visibleCategories] },
);

const sortBy = ref("price-asc");
const sortedProducts = computed(() => {
  const rows = [...(products.value || [])];
  if (sortBy.value === "price-desc") return rows.sort((a, b) => Number(b.customer_price ?? b.price ?? 0) - Number(a.customer_price ?? a.price ?? 0));
  if (sortBy.value === "name-asc") return rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  if (sortBy.value === "name-desc") return rows.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
  return rows.sort((a, b) => Number(a.customer_price ?? a.price ?? 0) - Number(b.customer_price ?? b.price ?? 0));
});

watch(
  products,
  async (value) => {
    if (import.meta.client && value?.length) await applyToProducts(value);
  },
  { immediate: true },
);
</script>
