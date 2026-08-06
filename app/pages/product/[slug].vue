<script setup>
const supabase = useSupabaseClient()
const route = useRoute()

const { data: product } = await useAsyncData(
  `product-${route.params.slug}`,
  async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          name,
          slug
        )
      `)
      .eq("slug", route.params.slug)
      .single()

    if (error) throw error

    return data
  }
)
</script>

<template>
  <div v-if="product" class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold">{{ product.name }}</h1>

    <p class="text-xl text-green-600 mt-2">
      ${{ product.price }}
    </p>

    <p class="mt-4">
      Category: {{ product.categories?.name }}
    </p>

    <p class="mt-6">
      {{ product.description }}
    </p>
  </div>
</template>
