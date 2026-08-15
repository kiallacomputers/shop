<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left p-3 text-sm font-semibold text-gray-600">
            Product
          </th>

          <th class="text-left p-3 text-sm font-semibold text-gray-600">
            Price
          </th>

          <th class="text-left p-3 text-sm font-semibold text-gray-600">
            Stock
          </th>

          <th class="text-left p-3 text-sm font-semibold text-gray-600">
            Status
          </th>

          <th class="text-right p-3 text-sm font-semibold text-gray-600">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="product in products"
          :key="product.id"
          class="border-b border-gray-100 hover:bg-gray-50"
        >
          <!-- Product -->
          <td class="p-3">
            <div class="flex items-center gap-3">
              <!-- Image -->
              <div
                class="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0"
              >
                <img
                  v-if="firstImage(product)"
                  :src="firstImage(product)"
                  :alt="product.name"
                  class="w-full h-full object-contain"
                />

                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-gray-400 text-xs"
                >
                  No Image
                </div>
              </div>

              <!-- Name -->
              <div class="min-w-0">
                <p class="font-semibold text-[#566C9D] truncate max-w-md">
                  {{ product.name }}
                </p>

                <p class="text-xs text-gray-400">ID: {{ product.id }}</p>
              </div>
            </div>
          </td>

          <!-- Price -->
          <td class="p-3 whitespace-nowrap">
            <span class="font-semibold text-[#2CB6D5]">
              ${{ product.price }}
            </span>
          </td>

          <!-- Stock -->
          <td class="p-3 whitespace-nowrap">
            <span
              :class="product.stock > 0 ? 'text-green-600' : 'text-red-600'"
              class="font-semibold"
            >
              {{ product.stock }}
            </span>
          </td>

          <!-- Status -->
          <td class="p-3">
            <span
              v-if="product.active"
              class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"
            >
              Active
            </span>

            <span
              v-else
              class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"
            >
              Inactive
            </span>
          </td>

          <!-- Actions -->
          <td class="p-3">
            <div class="flex justify-end gap-2">
              <NuxtLink
                :to="`/admin/products/edit/${product.id}`"
                class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                Edit
              </NuxtLink>

              <NuxtLink
                :to="`/product/${product.slug}`"
                target="_blank"
                class="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold transition"
              >
                View
              </NuxtLink>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  products: {
    type: Array,
    default: () => [],
  },
});

/*
|--------------------------------------------------------------------------
| Get First Product Image
|--------------------------------------------------------------------------
*/

const firstImage = (product) => {
  if (!product?.images) {
    return "";
  }

  /*
   * Images already returned as an array
   */
  if (Array.isArray(product.images)) {
    return product.images[0] || "";
  }

  /*
   * Images stored as JSON string
   */
  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);

      if (Array.isArray(parsed)) {
        return parsed[0] || "";
      }

      return product.images;
    } catch {
      return product.images;
    }
  }

  return "";
};
</script>
