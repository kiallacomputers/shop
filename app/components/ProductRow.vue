<template>
  <div class="border rounded-xl p-4 hover:shadow-md transition bg-white">
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      <!-- IMAGE -->

      <div
        class="w-full md:w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
      >
        <img
          v-if="firstImage"
          :src="firstImage"
          :alt="product.name"
          class="max-w-full max-h-full object-contain"
        />

        <span v-else class="text-xs text-gray-400"> No Image </span>
      </div>

      <!-- PRODUCT -->

      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-slate-800">
          {{ product.name }}
        </h3>

        <p class="text-sm text-gray-500 mt-1">ID: {{ product.id }}</p>

        <div class="flex flex-wrap gap-3 mt-2 text-sm">
          <span class="font-semibold text-[#2CB6D5]">
            ${{ product.price }}
          </span>

          <span :class="product.stock > 0 ? 'text-green-600' : 'text-red-600'">
            Stock: {{ product.stock }}
          </span>

          <span
            v-if="product.featured"
            class="px-2 py-1 bg-red-100 text-red-700 rounded"
          >
            Featured
          </span>

          <span
            v-if="product.refurbished"
            class="px-2 py-1 bg-orange-100 text-orange-700 rounded"
          >
            Refurbished
          </span>

          <span
            v-if="product.images?.length > 1"
            class="px-2 py-1 bg-blue-100 text-blue-700 rounded"
          >
            {{ product.images.length }} images
          </span>
        </div>
      </div>

      <!-- ACTIONS -->

      <div class="flex gap-2 shrink-0">
        <NuxtLink
          :to="`/admin/products/edit/${product.id}`"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          Edit
        </NuxtLink>

        <button
          type="button"
          @click="$emit('delete', product)"
          :disabled="deletingId === product.id"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
        >
          {{ deletingId === product.id ? "Deleting..." : "Delete" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  product: any;
  deletingId: number | null;
}>();

defineEmits<{
  delete: [product: any];
}>();

// =====================================================
// FIRST IMAGE
// =====================================================

const firstImage = computed(() => {
  const images = props.product?.images;

  if (!Array.isArray(images)) {
    return "";
  }

  return (
    images.find(
      (image: any) => typeof image === "string" && image.trim() !== "",
    ) || ""
  );
});
</script>
