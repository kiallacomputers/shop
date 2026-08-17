<template>
  <div class="bg-white border rounded-xl p-6">
    <h2 class="text-lg font-bold mb-4">
      Product Images
    </h2>

    <!-- Upload -->

    <div
      class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="uploadImages"
      />

      <button
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg"
        @click="fileInput?.click()"
      >
        Upload Images
      </button>

      <p class="text-sm text-gray-500 mt-3">
        JPG, PNG, WEBP
      </p>
    </div>

    <!-- Uploading -->

    <div
      v-if="uploading"
      class="mt-4 text-blue-600 text-sm"
    >
      Uploading images...
    </div>

    <!-- Gallery -->

    <div
      v-if="images.length"
      class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6"
    >
      <div
        v-for="(image, index) in images"
        :key="image"
        class="relative border rounded-xl overflow-hidden bg-white"
      >
        <img
          :src="image"
          class="w-full left-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
        >
          {{ index + 1 }}
        </div>

        <button
          type="button"
          class="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full"
          @click
