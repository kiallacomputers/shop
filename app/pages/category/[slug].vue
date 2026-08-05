<script setup>
const supabase = useSupabaseClient();
const route = useRoute();

const slug = route.params.slug;

// Get the category
const { data: category } = await useAsyncData(`category-${slug}`, async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", slug)
    .single();

  if (error) throw error;

  return data;
});

// Get the products
const { data: products } = await useAsyncData(`products-${slug}`, async () => {
  if (!category.value) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", slug)
    .order("sort_order");

  if (error) throw error;

  return data;
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">
      {{ category?.name }}
    </h1>

    <div
      v-if="products?.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>

    <div v-else class="text-center py-16 text-gray-500">
      No products found in this category.
    </div>
  </div>
</template>
