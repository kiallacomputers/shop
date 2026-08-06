<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <!-- Advertisement -->
    <Ads />

    <!-- Sidebar -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>

      <!-- Products -->
      <main class="flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const route = useRoute();

const { data: product } = await useAsyncData(
  `product-${route.params.slug}`,
  async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (
          name,
          slug
        )
      `,
      )
      .eq("slug", route.params.slug)
      .single();

    if (error) throw error;

    return data;
  },
);
</script>
