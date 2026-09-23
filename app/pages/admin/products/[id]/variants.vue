<template>
  <main class="max-w-[1400px] mx-auto px-4 py-8">
    <div class="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <NuxtLink :to="`/admin/products/${productId}`" class="text-sm font-semibold text-blue-600">← Edit Product</NuxtLink>
        <h1 class="mt-3 text-3xl font-bold text-slate-900">Product Variants</h1>
        <p class="mt-1 text-slate-500">Variants inherit the base product Sell Price and RRP unless you enter an override. If the base price changes later, inherited variants update automatically.</p>
        <div v-if="baseProduct" class="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span class="rounded-full bg-slate-100 px-3 py-1.5">Base Sell: {{ money(baseProduct.price) }}</span>
          <span class="rounded-full bg-slate-100 px-3 py-1.5">Base RRP: {{ baseProduct.old_price == null ? 'Not set' : money(baseProduct.old_price) }}</span>
        </div>
      </div>
      <button class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white" @click="addVariant">+ Add Variant</button>
      <div class="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-sm font-semibold">
        <NuxtLink :to="`/admin/products/${productId}`" class="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">📝 Product editor</NuxtLink>
        <NuxtLink :to="`/admin/products/${productId}/addons`" class="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">➕ Add-ons</NuxtLink>
        <NuxtLink to="/admin/products" class="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">← All products</NuxtLink>
      </div>
    </div>
    <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</div>
    <div v-if="loading" class="rounded-xl border bg-white p-10 text-center text-slate-500">Loading variants...</div>
    <div v-else class="space-y-4">
      <article v-for="variant in variants" :key="variant._key" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <label class="lg:col-span-2"><span class="label">Variant / Colour *</span><input v-model="variant.name" class="input" placeholder="Black" /></label>
          <label><span class="label">Product Code *</span><input v-model="variant.product_code" class="input uppercase" placeholder="KC-1001-BLK" /></label>
          <label>
            <span class="label">Sell Price Override</span>
            <input
              v-model="variant.price"
              type="number"
              min="0"
              step="0.01"
              class="input"
              :placeholder="baseProduct ? `Base: ${money(baseProduct.price)}` : 'Leave blank to use base price'"
            />
            <div class="mt-1 flex items-center gap-2 text-xs">
              <span v-if="variant.price === '' || variant.price == null" class="font-semibold text-emerald-600">Inheriting {{ money(baseProduct?.price) }}</span>
              <button v-else type="button" class="font-semibold text-blue-600 hover:underline" @click="variant.price = ''">Use base price</button>
            </div>
          </label>
          <label>
            <span class="label">RRP Override</span>
            <input
              v-model="variant.old_price"
              type="number"
              min="0"
              step="0.01"
              class="input"
              :placeholder="baseProduct?.old_price == null ? 'Base RRP not set' : `Base: ${money(baseProduct.old_price)}`"
            />
            <div class="mt-1 flex items-center gap-2 text-xs">
              <span v-if="variant.old_price === '' || variant.old_price == null" class="font-semibold text-emerald-600">
                {{ baseProduct?.old_price == null ? 'Inheriting no base RRP' : `Inheriting ${money(baseProduct.old_price)}` }}
              </span>
              <button v-else type="button" class="font-semibold text-blue-600 hover:underline" @click="variant.old_price = ''">Use base RRP</button>
            </div>
          </label>
          <label><span class="label">Stock *</span><input v-model="variant.stock" type="number" min="0" step="1" class="input" /></label>
        </div>
        <div class="mt-4 rounded-lg bg-slate-50 p-4">
          <p class="text-sm font-bold text-slate-800">Variant Main Image</p>
          <p class="mt-0.5 text-xs text-slate-500">Choose an image already loaded in the main product. This image will display first when this variant is selected.</p>

          <select class="input mt-3" :value="variant.images?.[0] || ''" @change="setVariantMainImage(variant, ($event.target as HTMLSelectElement).value)">
            <option value="">Use default product image</option>
            <option v-for="(image,index) in productImages" :key="image" :value="image">Product Image {{ index + 1 }}</option>
          </select>

          <div class="mt-3 flex items-start gap-4">
            <div class="h-28 w-28 shrink-0 overflow-hidden rounded-xl border bg-white">
              <img v-if="variant.images?.[0] || productImages[0]" :src="variant.images?.[0] || productImages[0]" class="h-full w-full object-contain p-2" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold">{{ variant.images?.[0] ? 'Selected variant image' : 'Default product image' }}</p>
              <p class="mt-1 text-xs text-slate-500">The complete main product gallery will still be available on the storefront.</p>
            </div>
          </div>

          <div v-if="productImages.length" class="mt-4">
            <p class="mb-2 text-xs font-semibold text-slate-600">Product image preview</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="(image,index) in productImages" :key="image" type="button"
                class="relative h-16 w-16 overflow-hidden rounded-lg border-2 bg-white hover:border-blue-500"
                :class="variant.images?.[0] === image ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'"
                :title="`Use Product Image ${index + 1}`" @click="setVariantMainImage(variant,image)">
                <img :src="image" class="h-full w-full object-contain p-1" />
              </button>
            </div>
          </div>
          <p v-else class="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">Add images to the main product first, then return here to assign one.</p>
        </div>
        
