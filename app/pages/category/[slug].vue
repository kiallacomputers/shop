<template>
  <main class="max-w-7xl mx-auto px-4 py-8 md:py-10">
<div class="mt-8 grid gap-7 lg:grid-cols-[240px_1fr] items-start">
      <aside class="lg:sticky lg:top-28">
        <Sidemenu />
      </aside>

      <section class="min-w-0">
        <div
          class="mb-6 rounded-2xl bg-[#0b1f3a] px-6 py-7 text-white shadow-sm"
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

              <h1 class="mt-2 text-3xl font-black tracking-tight">
                {{ category?.name }}
              </h1>

              <p class="mt-2 text-sm text-slate-300">
                Browse our current products in {{ category?.name }}.
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

        <div
          v-if="products?.length"
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <div v-else class="kc-panel p-12 text-center text-slate-500">
          No products found in this category.
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

const { data: category } = await useAsyncData(
  () => `category-${slug.value}`,
  async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug.value)
      .single();

    if (error) throw error;
    return data;
  },
  { watch: [slug] },
);

const { data: allCategories } = await useAsyncData(
  "storefront-category-tree",
  async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,parent_id,name,slug,active")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },
);

const visibleCategories = computed(() =>
  (allCategories.value || []).filter((item) => item.active !== false),
);

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
      .select(`*, categories (name)`)
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
</script>
