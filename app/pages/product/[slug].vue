<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <!-- Advertisement -->
    <Ads />

    <!-- Sidebar -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar --><!--
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>-->

      <!-- Products -->
      <main class="flex-1">
        <div
          class="bg-white rounded-xl transition-all duration-300 overflow-hidden group"
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
              <!-- Refurbished Badge -->
              <span
                v-if="product.refurbished"
                class="absolute top-4 -right-8 rotate-45 bg-red-600 text-white text-xs font-bold text-center w-32 py-1 shadow-lg z-10"
              >
                Refusbished
              </span>
              <img
                :src="product.images"
                :alt="product.name"
                class="w-full h-96 object-contain p-6 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </NuxtLink>

          <!-- Product Details -->
          <div class="p-5">
            <NuxtLink
              :to="`/category/${product.categories.slug}`"
              class="text-lg text-[#2CB6D5] font-medium hover:text-[#566C9D]"
            >
              {{ product.categories.name }}
            </NuxtLink>
            <h3 class="text-base font-semibold text-[#566C9D] line-clamp-2">
              {{ product.name }}
            </h3>

            <!-- Price -->
            <div class="flex items-center justify-between mt-5">
              <div>
                <p class="text-2xl font-bold text-[#2CB6D5]">
                  ${{ product.price }}
                </p>

                <p
                  v-if="product.oldPrice"
                  class="text-[#566C9D] line-through text-sm"
                >
                  ${{ product.oldPrice }}
                </p>
              </div>

              <button
                @click="addToCart"
                class="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg transition"
              >
                Add to Cart
              </button>
            </div>
            <div class="text-[#566C9D] text-sm mt-2">
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

                <!-- Dot Points -->
                <ul
                  v-else-if="section.type === 'list'"
                  class="list-disc pl-6 space-y-2 text-gray-700"
                >
                  <li v-for="(item, i) in section.items" :key="i">
                    {{ item }}
                  </li>
                </ul>

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

            <!-- Rating --><!--
            <div class="flex items-center mt-3">
              <span class="text-yellow-500">★★★★★</span>
              <span class="ml-2 text-sm text-[#566C9D]">
                ({{ product.reviews }})
              </span>
            </div>-->
          </div>
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

const cart = useCartStore();

function addToCart() {
  cart.addToCart(product);
}
</script>
