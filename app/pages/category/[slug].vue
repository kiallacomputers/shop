<template>
  <main class="max-w-7xl mx-auto px-4 py-8 md:py-10">
    <Ads />
    <div class="mt-8 grid gap-7 lg:grid-cols-[240px_1fr] items-start">
      <aside class="lg:sticky lg:top-28"><Sidemenu /></aside>
      <section class="min-w-0">
        <div class="mb-6 rounded-2xl bg-[#0b1f3a] px-6 py-7 text-white shadow-sm">
          <p class="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Shop category</p>
          <h1 class="mt-2 text-3xl font-black tracking-tight">{{ category?.name }}</h1>
          <p class="mt-2 text-sm text-slate-300">Browse our current products in {{ category?.name }}.</p>
        </div>
        <div v-if="products?.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>
        <div v-else class="kc-panel p-12 text-center text-slate-500">No products found in this category.</div>
      </section>
    </div>
  </main>
</template>

<script setup>
const supabase = useSupabaseClient();
const route = useRoute();
const slug = route.params.slug;
const { data: category } = await useAsyncData(`category-${slug}`, async () => {
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single();
  if (error) throw error; return data;
});
const { data: products } = await useAsyncData(`products-${slug}`, async () => {
  if (!category.value) return [];
  const { data, error } = await supabase.from("products").select(`*, categories (name)`).eq("category_id", category.value.id).eq("active", true).order("price");
  if (error) throw error;
  return (data || []).map(product => ({ ...product, categoryName: category.value.name }));
});
</script>
