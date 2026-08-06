<script setup>
const supabase = useSupabaseClient();
const route = useRoute();

const slug = route.params.slug;

const { data: category } = await useAsyncData(
  `category-${slug}`,
  async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    return data;
  }
);  
  
// Get the products
const { data: products } = await useAsyncData(`products-${slug}`, async () => {
  if (!category.value) return [];

  const { data, error } = await supabase
    .from("products")
          .select(`
      *,
      categories (
        name
      )
      `)
    .eq("category_id", category.value.id)
    .order("price");

  if (error) throw error;

  // Replace the category ID with the category name
  return data.map(product => ({
    ...product,
    categoryName: category.value.name,
  }));
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>

      <!-- Product -->
      <main class="flex-1">
        <div class="max-w-7xl mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold mb-8">
            {{ category?.name }}
          </h1>
      
          <div
            v-if="products?.length"
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <ProductCard 
              class="h-full max-h-[500px]"
              v-for="product in products"
              :key="product.id"
              :product="product"
            />
          </div>
      
          <div v-else class="text-center py-16 text-gray-500">
            No products found in this category.
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
