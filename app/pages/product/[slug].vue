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
  <template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>

      <!-- Product -->
  <div
    class="bg-white rounded-xl  transition-all duration-300 overflow-hidden group"
  >
    <!-- Product Image -->
    <!-- :to="`/product/${product.slug}`" -->
    <NuxtLink :to="`/product/${product.slug}`">
      <div class="relative overflow-hidden bg-gray-100">
         <!-- Featured Badge -->
         <span
            v-if="product.featured"
            class="absolute top-4 -left-8 rotate-[-45deg] bg-red-600 text-white text-xs font-bold text-center w-32 py-1 shadow-lg z-10"
          >
          Featured
          </span>
        <img
          :src="product.images"
          :alt="product.name"
          class="w-full h-56 object-contain p-6 group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </NuxtLink>

    <!-- Product Details -->
    <div class="p-5">
      <p class="text-xs text-sky-600 font-medium">
        {{ product.categories.name }}
      </p>
      <!-- :to="`/product/${product.slug}`" -->
      <NuxtLink :to="`/product/${product.slug}`" class="block mt-1">
        <h3
          class="text-base font-semibold text-gray-900 line-clamp-2 hover:text-sky-600"
        >
          {{ product.name }}
        </h3>
      </NuxtLink>

      <p class="text-gray-500 text-sm mt-2 line-clamp-3">
        {{ product.description }}
      </p>

      <!-- Rating -->
      <div class="flex items-center mt-3">
        <span class="text-yellow-500">★★★★★</span>
        <span class="ml-2 text-sm text-gray-500">
          ({{ product.reviews }})
        </span>
      </div>

      <!-- Price -->
      <div v-if="user" class="flex items-center justify-between mt-5">
        <div>
          <p class="text-2xl font-bold text-sky-600">${{ product.price }}</p>

          <p v-if="product.oldPrice" class="text-gray-400 line-through text-sm">
            ${{ product.oldPrice }}
          </p>
        </div>

        <button
          class="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  </div>
</div>
    </div>
    </template>
