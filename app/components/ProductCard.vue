<template>
  <div
    class="bg-white rounded-xl  transition-all duration-300 overflow-hidden group"
  >
    <!-- Product Image -->
    <!-- :to="`/product/${product.slug}`" -->
    <NuxtLink to="#">
      <div class="overflow-hidden bg-gray-100">
        <img
          :src="product.images"
          :alt="product.name"
          class="w-full h-56 object-contain p-6 group-hover:scale-130 transition-transform duration-300"
        />
      </div>
    </NuxtLink>

    <!-- Product Details -->
    <div class="p-5">
      <p class="text-xs text-sky-600 font-medium">
        {{ product.category }}
      </p>
      <!-- :to="`/product/${product.slug}`" -->
      <NuxtLink to="#" class="block mt-1">
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
</template>

<script setup>
defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const isLoggedIn = ref(false);
</script>
