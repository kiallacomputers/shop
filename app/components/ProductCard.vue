<template>
  <div
    class="group relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden"
  >
    <!-- Product Image -->
    <div class="relative w-full h-56 bg-gray-50 overflow-hidden">
      <NuxtLink :to="`/product/${product.slug}`">
        <img
          v-if="currentImage"
          :src="currentImage"
          :alt="product.name"
          class="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
        />

        <div
          v-else
          class="w-full h-full flex items-center justify-center text-gray-400"
        >
          No Image
        </div>
      </NuxtLink>

      <!-- Previous Button -->
      <button
        v-if="images.length > 1"
        type="button"
        @click.prevent.stop="previousImage"
        class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-9 h-9 flex items-center justify-center shadow transition"
        aria-label="Previous image"
      >
        ‹
      </button>

      <!-- Next Button -->
      <button
        v-if="images.length > 1"
        type="button"
        @click.prevent.stop="nextImage"
        class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-9 h-9 flex items-center justify-center shadow transition"
        aria-label="Next image"
      >
        ›
      </button>

      <!-- Image Dots -->
      <div
        v-if="images.length > 1"
        class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5"
      >
        <button
          v-for="(image, index) in images"
          :key="index"
          type="button"
          @click.prevent.stop="goToImage(index)"
          class="w-2.5 h-2.5 rounded-full transition"
          :class="
            index === currentImageIndex
              ? 'bg-blue-600'
              : 'bg-gray-300 hover:bg-gray-400'
          "
          :aria-label="`View image ${index + 1}`"
        />
      </div>

      <!-- Featured Badge -->
      <span
        v-if="product.featured"
        class="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full"
      >
        Featured
      </span>

      <!-- Refurbished Badge -->
      <span
        v-if="product.refurbished"
        class="absolute top-3 right-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full"
      >
        Refurbished
      </span>
    </div>

    <!-- Product Information -->
    <div class="p-4">
      <NuxtLink :to="`/product/${product.slug}`">
        <h3
          class="font-semibold text-gray-800 line-clamp-2 hover:text-blue-600 transition"
        >
          {{ product.name }}
        </h3>
      </NuxtLink>

      <p v-if="product.blurb" class="text-sm text-gray-500 mt-2 line-clamp-2">
        {{ product.blurb }}
      </p>

      <!-- Price -->
      <div class="mt-4 flex items-center gap-2">
        <span class="text-xl font-bold text-gray-900">
          ${{ Number(product.price).toFixed(2) }}
        </span>

        <span
          v-if="product.oldPrice"
          class="text-sm text-gray-400 line-through"
        >
          ${{ Number(product.oldPrice).toFixed(2) }}
        </span>
      </div>

      <!-- Stock -->
      <div class="mt-2">
        <span
          v-if="product.stock > 0"
          class="text-sm text-green-600 font-medium"
        >
          In Stock
        </span>

        <span v-else class="text-sm text-red-600 font-medium">
          Backorder please call.
        </span>
      </div>

      <!-- View Product -->
      <NuxtLink
        :to="`/product/${product.slug}`"
        class="block mt-4 w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
      >
        View Product
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const currentImageIndex = ref(0);

/*
 * Make sure images is always an array.
 *
 * Your Supabase images column contains:
 *
 * [
 *   "/images/products/image1.png",
 *   "/images/products/image2.png"
 * ]
 */
const images = computed(() => {
  if (!props.product?.images) {
    return [];
  }

  // Already an array
  if (Array.isArray(props.product.images)) {
    return props.product.images.filter(Boolean);
  }

  // In case Supabase returns JSON as a string
  if (typeof props.product.images === "string") {
    try {
      const parsed = JSON.parse(props.product.images);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      console.error("Unable to parse product images:", error);
    }
  }

  return [];
});

const currentImage = computed(() => {
  return images.value[currentImageIndex.value] || "";
});

const nextImage = () => {
  if (images.value.length <= 1) return;

  currentImageIndex.value = (currentImageIndex.value + 1) % images.value.length;
};

const previousImage = () => {
  if (images.value.length <= 1) return;

  currentImageIndex.value =
    (currentImageIndex.value - 1 + images.value.length) % images.value.length;
};

const goToImage = (index) => {
  currentImageIndex.value = index;
};

// Reset image when product changes
watch(
  () => props.product?.id,
  () => {
    currentImageIndex.value = 0;
  },
);
</script>
