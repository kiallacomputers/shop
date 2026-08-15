<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <!-- Advertisement -->
    <Ads />

    <!-- Sidebar + Product -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>

      <!-- Product -->
      <main class="flex-1">
        <div
          class="bg-white rounded-xl transition-all duration-300 overflow-hidden group"
        >
          <!-- ========================= -->
          <!-- PRODUCT IMAGE GALLERY -->
          <!-- ========================= -->

          <div class="relative overflow-hidden bg-gray-100">
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

            <!-- Main Image -->
            <NuxtLink :to="`/product/${product.slug}`">
              <div class="w-full h-96 flex items-center justify-center">
                <img
                  v-if="currentImage"
                  :src="currentImage"
                  :alt="product.name"
                  class="w-full h-96 object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                />

                <!-- No image -->
                <div
                  v-else
                  class="flex items-center justify-center h-96 text-gray-400"
                >
                  No Image Available
                </div>
              </div>
            </NuxtLink>

            <!-- ========================= -->
            <!-- PREVIOUS BUTTON -->
            <!-- ========================= -->

            <button
              v-if="images.length > 1"
              type="button"
              @click.stop.prevent="previousImage"
              class="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 rounded-full w-11 h-11 flex items-center justify-center shadow-lg transition"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <!-- ========================= -->
            <!-- NEXT BUTTON -->
            <!-- ========================= -->

            <button
              v-if="images.length > 1"
              type="button"
              @click.stop.prevent="nextImage"
              class="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 rounded-full w-11 h-11 flex items-center justify-center shadow-lg transition"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <!-- ========================= -->
            <!-- IMAGE COUNTER -->
            <!-- ========================= -->

            <div
              v-if="images.length > 1"
              class="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full z-10"
            >
              {{ currentImageIndex + 1 }} / {{ images.length }}
            </div>

            <!-- ========================= -->
            <!-- IMAGE DOTS -->
            <!-- ========================= -->

            <div
              v-if="images.length > 1"
              class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10"
            >
              <button
                v-for="(image, index) in images"
                :key="index"
                type="button"
                @click.stop.prevent="goToImage(index)"
                class="w-3 h-3 rounded-full transition-all duration-200"
                :class="
                  index === currentImageIndex
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                "
                :aria-label="`View image ${index + 1}`"
              />
            </div>
          </div>

          <!-- ========================= -->
          <!-- THUMBNAIL IMAGES -->
          <!-- ========================= -->

          <div
            v-if="images.length > 1"
            class="flex justify-center gap-3 px-5 py-4 bg-white border-b"
          >
            <button
              v-for="(image, index) in images"
              :key="index"
              type="button"
              @click="goToImage(index)"
              class="w-20 h-20 rounded-lg overflow-hidden border-2 transition"
              :class="
                index === currentImageIndex
                  ? 'border-blue-600'
                  : 'border-gray-200 hover:border-gray-400'
              "
            >
              <img
                :src="image"
                :alt="`${product.name} image ${index + 1}`"
                class="w-full h-full object-contain p-1"
              />
            </button>
          </div>

          <!-- ========================= -->
          <!-- PRODUCT DETAILS -->
          <!-- ========================= -->

          <div class="p-5">
            <!-- Category -->
            <NuxtLink
              :to="`/category/${product.categories.slug}`"
              class="text-lg text-[#2CB6D5] font-medium hover:text-[#566C9D]"
            >
              {{ product.categories.name }}
            </NuxtLink>

            <!-- Product Name -->
            <h3 class="text-base font-semibold text-[#566C9D] line-clamp-2">
              {{ product.name }}
            </h3>

            <!-- ========================= -->
            <!-- PRICE -->
            <!-- ========================= -->

            <div class="flex items-center justify-between mt-5">
              <div>
                <p class="text-3xl font-bold text-[#2CB6D5]">
                  ${{ product.price }}
                </p>

                <p
                  v-if="product.oldPrice"
                  class="text-[#566C9D] line-through text-sm"
                >
                  ${{ product.oldPrice }}
                </p>
              </div>

              <!-- Add Cart -->
              <button
                v-if="product.stock > 0"
                @click="cart.addToCart(product)"
                class="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg transition"
              >
                Add to Cart
              </button>
            </div>

            <!-- ========================= -->
            <!-- AVAILABILITY -->
            <!-- ========================= -->

            <div class="flex items-center mt-3">
              <span class="font-semibold text-[#566C9D]"> Availability : </span>

              <span
                v-if="product.stock > 0"
                class="ml-2 text-sm font-semibold text-[#00C409]"
              >
                {{ product.stock }} in stock
              </span>

              <span v-else class="ml-2 text-sm font-semibold text-red-800">
                Backorder please call.
              </span>
            </div>

            <!-- ========================= -->
            <!-- DESCRIPTION -->
            <!-- ========================= -->

            <div class="text-[#566C9D] text-sm mt-6">
              <div
                v-for="(section, index) in product.description"
                :key="index"
                class="mb-6"
              >
                <!-- Heading -->
                <h2
                  v-if="section.type === 'heading'"
                  class="text-2xl font-semibold border-b border-gray-200 pb-2 mb-4"
                >
                  {{ section.text }}
                </h2>

                <!-- Paragraph -->
                <p
                  v-else-if="section.type === 'paragraph'"
                  class="text-gray-700 leading-7 mb-4"
                >
                  {{ section.text }}
                </p>

                <!-- Quote -->
                <blockquote
                  v-else-if="section.type === 'quote'"
                  class="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4"
                >
                  {{ section.text }}
                </blockquote>

                <!-- List -->
                <ul
                  v-else-if="section.type === 'list'"
                  class="list-disc pl-6 space-y-2 text-gray-700"
                >
                  <li v-for="(item, i) in section.items" :key="i">
                    {{ item }}
                  </li>
                </ul>

                <!-- Warning -->
                <div
                  v-else-if="section.type === 'warning'"
                  class="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-lg"
                >
                  {{ section.text }}
                </div>

                <!-- Table -->
                <div
                  v-else-if="section.type === 'table'"
                  class="overflow-hidden rounded-lg border border-gray-200"
                >
                  <table class="w-full">
                    <thead class="bg-gray-100">
                      <tr>
                        <th
                          v-for="header in section.headers"
                          :key="header"
                          class="p-3 text-left font-semibold"
                        >
                          {{ header }}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-for="(row, r) in section.rows"
                        :key="r"
                        class="border-t"
                      >
                        <td v-for="(cell, c) in row" :key="c" class="p-3">
                          {{ cell }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const route = useRoute();

const cart = useCartStore();

/*
|--------------------------------------------------------------------------
| Load Product
|--------------------------------------------------------------------------
*/

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

    if (error) {
      throw error;
    }

    return data;
  },
);

/*
|--------------------------------------------------------------------------
| Current Image
|--------------------------------------------------------------------------
*/

const currentImageIndex = ref(0);

/*
|--------------------------------------------------------------------------
| Convert images into an array
|--------------------------------------------------------------------------
|
| Supabase should normally return:
|
| [
|   "/images/products/image1.png",
|   "/images/products/image2.png"
| ]
|
| This also handles the situation where the database
| returns the JSON as a string.
|
*/

const images = computed(() => {
  if (!product.value?.images) {
    return [];
  }

  // Already an array
  if (Array.isArray(product.value.images)) {
    return product.value.images.filter(Boolean);
  }

  // JSON string
  if (typeof product.value.images === "string") {
    try {
      const parsed = JSON.parse(product.value.images);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      console.error("PRODUCT IMAGE JSON ERROR:", error);
    }
  }

  return [];
});

/*
|--------------------------------------------------------------------------
| Current Image
|--------------------------------------------------------------------------
*/

const currentImage = computed(() => {
  return images.value[currentImageIndex.value] || "";
});

/*
|--------------------------------------------------------------------------
| Next Image
|--------------------------------------------------------------------------
*/

const nextImage = () => {
  if (images.value.length <= 1) {
    return;
  }

  currentImageIndex.value = (currentImageIndex.value + 1) % images.value.length;
};

/*
|--------------------------------------------------------------------------
| Previous Image
|--------------------------------------------------------------------------
*/

const previousImage = () => {
  if (images.value.length <= 1) {
    return;
  }

  currentImageIndex.value =
    (currentImageIndex.value - 1 + images.value.length) % images.value.length;
};

/*
|--------------------------------------------------------------------------
| Select Image
|--------------------------------------------------------------------------
*/

const goToImage = (index) => {
  currentImageIndex.value = index;
};

/*
|--------------------------------------------------------------------------
| Reset Image When Product Changes
|--------------------------------------------------------------------------
*/

watch(
  () => product.value?.id,
  () => {
    currentImageIndex.value = 0;
  },
);

/*
|--------------------------------------------------------------------------
| Debug
|--------------------------------------------------------------------------
*/

console.log("PRODUCT IMAGES:", product.value?.images);

console.log("NORMALISED IMAGES:", images.value);
</script>
