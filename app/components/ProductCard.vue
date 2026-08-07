<template>
  <div
    class="bg-white rounded-xl  transition-all duration-300 overflow-hidden group"
  >
    <!-- Product Image -->
    <NuxtLink :to="`/product/${product.slug}`">
      <div class="relative overflow-hidden bg-gray-100">
         <!-- Featured Badge -->
         <span
            v-if="product.featured"
            class="absolute top-4 -left-8 rotate-[-45deg] bg-red-600 text-white text-xs font-bold text-center w-32 py-1 shadow-lg z-10"
          >
          Featured
          </span>
         <!-- Refurbished Badge -->
          <span
            v-if="product.refurbished"
            class="absolute top-3 right-[-35px] rotate-45 bg-red-600 text-white text-xs font-bold w-32 text-center py-1 shadow-lg z-10"
          >
            Refurbished
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

      <!-- Quautity -->
      <div class="flex items-center mt-3">
        <span class="text-gray-500">Qty on Hand : </span>
        <span class="ml-2 text-sm text-gray-500">
          ({{ product.stock }})
        </span>
      </div>

      <!-- Rating --><!--
      <div class="flex items-center mt-3">
        <span class="text-yellow-500">★★★★★</span>
        <span class="ml-2 text-sm text-gray-500">
          ({{ product.reviews }})
        </span>
      </div>-->

      <!-- Price -->
      <div class="flex items-center justify-between mt-5">
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

const user = useSupabaseUser();
const supabase = useSupabaseClient();

//   // Get the category
// const { data: category } = await useAsyncData(`category-${product.category}`, async () => {
//   const { data, error } = await supabase
//     .from("categories")
//     .select("*")
//     .eq("id", product.category)
//     .single();

//   if (error) throw error;

//   // console.log("Data Category :>", category);
//   return data;
// });
</script>
