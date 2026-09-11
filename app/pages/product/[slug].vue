<template>
  <div class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-7 md:py-9 space-y-4 sm:space-y-5">
    <nav class="kc-breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="kc-breadcrumb-sep">/</span>
      <NuxtLink to="/#categories">Categories</NuxtLink><span class="kc-breadcrumb-sep">/</span>
      <NuxtLink v-if="product?.categories?.slug" :to="`/category/${product.categories.slug}`">{{ product.categories.name }}</NuxtLink>
      <span v-if="product?.categories?.slug" class="kc-breadcrumb-sep">/</span>
      <span class="max-w-[280px] truncate text-slate-700 sm:max-w-md">{{ product?.name }}</span>
    </nav>
<div class="flex flex-col md:flex-row gap-6">
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>

      <main class="min-w-0 flex-1">
        <div class="space-y-6">
          <!-- Product hero -->
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,35,64,.08)]">
            <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
              <!-- Gallery -->
              <div class="min-w-0 border-b border-slate-200 lg:border-b-0 lg:border-r">
                <div class="relative bg-slate-50">
                  <span
                    v-if="product.featured"
                    class="absolute left-4 top-4 z-20 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  >
                    Featured
                  </span>

                  <span
                    v-if="product.refurbished"
                    class="absolute right-4 top-4 z-20 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  >
                    Refurbished
                  </span>

                  <div
                    class="flex h-[300px] w-full cursor-zoom-in items-center justify-center sm:h-[440px] lg:h-[520px]"
                    @click="openLightbox"
                  >
                    <img
                      v-if="currentImage"
                      :src="currentImage"
                      :alt="product.name"
                      class="h-full w-full object-contain p-4 sm:p-8 lg:p-10 transition-transform duration-300 hover:scale-[1.025]"
                    />
                    <div v-else class="text-slate-400">No Image Available</div>
                  </div>

                  <button
                    v-if="images.length > 1"
                    type="button"
                    @click.stop.prevent="previousImage"
                    class="absolute left-2 sm:left-4 top-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
                    aria-label="Previous image"
                  >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <button
                    v-if="images.length > 1"
                    type="button"
                    @click.stop.prevent="nextImage"
                    class="absolute right-2 sm:right-4 top-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
                    aria-label="Next image"
                  >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </button>

                  <div
                    v-if="images.length > 1"
                    class="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white"
                  >
                    {{ currentImageIndex + 1 }} / {{ images.length }}
                  </div>

                  <div
                    v-if="currentImage"
                    class="pointer-events-none absolute bottom-4 right-4 hidden rounded-full bg-slate-900/70 px-3 py-1.5 text-xs text-white sm:block"
                  >
                    Click image to enlarge
                  </div>
                </div>

                <div
                  v-if="images.length > 1"
                  class="flex gap-2 sm:gap-3 overflow-x-auto border-t border-slate-200 bg-white p-3 sm:p-4 snap-x"
                >
                  <button
                    v-for="(image, index) in images"
                    :key="index"
                    type="button"
                    @click="goToImage(index)"
                    class="h-16 w-16 sm:h-20 sm:w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-white transition"
                    :class="index === currentImageIndex ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-400'"
                  >
                    <img :src="image" :alt="`${product.name} image ${index + 1}`" class="h-full w-full object-contain p-1.5" />
                  </button>
                </div>
              </div>

              <!-- Purchase panel -->
              <div class="flex flex-col p-5 sm:p-8 lg:p-9">
                <div>
                  <NuxtLink
                    :to="`/category/${product.categories.slug}`"
                    class="text-sm font-bold uppercase tracking-wide text-cyan-600 hover:text-cyan-700"
                  >
                    {{ product.categories.name }}
                  </NuxtLink>

                  <h1 class="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl break-words">
                    {{ product.name }}
                  </h1>

                  <div class="mt-6 border-y border-slate-200 py-5">
                    <div v-if="effectiveOldPrice" class="mb-1 text-slate-400">
                      <p class="text-[11px] font-black uppercase tracking-[.12em]">RRP <span class="ml-1 text-sm font-semibold normal-case tracking-normal line-through">${{ effectiveOldPrice.toFixed(2) }}</span></p>
                    </div>
                    <div class="flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span class="text-4xl font-extrabold tracking-tight text-[#2367d1]">
                        ${{ effectivePrice.toFixed(2) }}
                      </span>
                    </div>
                    <p v-if="hasCustomerDiscount" class="mt-1 text-sm text-slate-500">
                      Standard price <span class="line-through">${{ effectiveStandardPrice.toFixed(2) }}</span>
                    </p>
                    <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>GST inclusive</span>
                      <span v-if="pricingLevelName" class="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">Pricing Level: {{ pricingLevelName }}</span>
                    </div>
                  </div>

                  <div v-if="product.has_variants" class="mt-5">
                    <label class="mb-2 block text-sm font-bold text-slate-800">Choose option</label>
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button v-for="variant in activeVariants" :key="variant.id" type="button" @click="selectedVariantId = Number(variant.id)" class="rounded-lg border px-3 py-2.5 text-left text-sm transition" :class="selectedVariantId === Number(variant.id) ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-400'">
                        <span class="block font-bold text-slate-900">{{ variant.name }}</span>
                        <span class="mt-0.5 block text-xs text-slate-500">Code: {{ variant.product_code }}</span>
                      </button>
                    </div>
                    <p v-if="!activeVariants.length" class="mt-2 text-sm text-amber-700">No variants are currently available.</p>
                  </div>

                  <div v-else-if="product.product_code" class="mt-5 text-sm text-slate-500">Product code: <strong class="text-slate-700">{{ product.product_code }}</strong></div>

                  <div class="mt-5">
                    <div
                      v-if="effectiveStock > 0"
                      class="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 ring-1 ring-inset ring-green-200"
                    >
                      <span class="h-2 w-2 rounded-full bg-green-500"></span>
                      {{ effectiveStock }} in stock
                    </div>
                    <div
                      v-else
                      class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 ring-1 ring-inset ring-amber-200"
                    >
                      <span class="h-2 w-2 rounded-full bg-amber-500"></span>
                      On back order — due 3–4 days
                    </div>
                  </div>
                </div>

                <div class="mt-8 lg:mt-auto lg:pt-10">
                  <div v-if="!product.has_variants || activeVariants.length" class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                    <button
                      type="button"
                      @click="addCurrentToCart"
                      class="min-h-[50px] w-full rounded-xl bg-sky-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    >
                      {{ effectiveStock > 0 ? 'Add to Cart' : 'Add Back Order to Cart' }}
                    </button>
                    <button
                      type="button"
                      class="min-h-[50px] rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold transition hover:border-rose-300 hover:bg-rose-50"
                      :class="wishlistSaved ? 'text-rose-600' : 'text-slate-700'"
                      @click="toggleWishlist"
                    >
                      {{ wishlistSaved ? '♥ Saved' : '♡ Save' }}
                    </button>
                  </div>

                  <div v-if="effectiveStock <= 0 && (!product.has_variants || activeVariants.length)" class="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <p class="font-bold text-slate-900">Prefer to wait for stock?</p>
                    <p class="mt-1 text-sm text-slate-600">Back-in-stock emails are only sent for products you keep in your wishlist, so you only hear from us about items you are interested in.</p>
                    <NuxtLink v-if="!customerUser" :to="`/auth/signin?redirect=${encodeURIComponent(route.fullPath)}`" class="mt-3 inline-flex min-h-[46px] w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 sm:w-auto text-sm font-bold text-white hover:bg-sky-700">Sign In to Save & Notify</NuxtLink>
                    <button v-else type="button" :disabled="backInStockBusy" class="mt-3 min-h-[46px] w-full rounded-lg bg-sky-600 px-4 py-2.5 sm:w-auto text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50" @click="subscribeBackInStock">{{ backInStockBusy ? 'Saving…' : (wishlistSaved ? 'Notify Me When In Stock' : 'Save to Wishlist & Notify Me') }}</button>
                    <p v-if="backInStockMessage" class="mt-2 text-sm font-semibold" :class="backInStockError ? 'text-red-600' : 'text-green-700'">{{ backInStockMessage }}</p>
                  </div>

                  <div
                    v-if="effectiveStock <= 0 && (!product.has_variants || activeVariants.length)"
                    class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                  >
                    This item is on back order and is normally due within 3–4 days. You can still purchase it now.
                  </div>

                  <div class="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div class="rounded-xl bg-slate-50 p-3">
                      <p class="font-semibold text-slate-800">Secure checkout</p>
                      <p class="mt-1 text-xs">Pay securely through our online checkout.</p>
                    </div>
                    <div class="rounded-xl bg-slate-50 p-3">
                      <p class="font-semibold text-slate-800">Australian delivery</p>
                      <p class="mt-1 text-xs">Delivery calculated from your selected address.</p>
                    </div>
                  </div>
                  <div class="mt-5 border-t border-slate-200 pt-5">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <p class="text-sm font-bold text-slate-800">Share this product</p>
                        <p class="mt-0.5 text-xs text-slate-500">Share with any supported app or use one of the quick options.</p>
                      </div>
                      <span v-if="shareCopied" class="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">Link copied</span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" @click="shareProduct" class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12v7a2 2 0 002 2h6a2 2 0 002-2v-7M12 16V3m0 0L8 7m4-4l4 4" /></svg>
                        Share
                      </button>
                      <a :href="facebookShareUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Facebook</a>
                      <a :href="whatsAppShareUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">WhatsApp</a>
                      <a :href="emailShareUrl" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Email</a>
                      <button type="button" @click="copyProductLink" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Copy link</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Product description -->
          <section
            v-if="product.description?.length"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div class="mb-5 border-b border-slate-200 pb-4">
              <h2 class="text-xl font-bold text-slate-900">Product Details</h2>
            </div>
              <div class="text-[#566C9D] text-sm">
              <div
                v-for="(section, index) in product.description"
                :key="index"
                :class="section.type === 'heading' ? 'mb-2' : 'mb-6'"
              >
                <!-- Heading -->
                <component
                  :is="section.level === 4 ? 'h4' : section.level === 3 ? 'h3' : 'h2'"
                  v-if="section.type === 'heading'"
                  :class="[
                    'font-semibold mb-1 rounded-lg px-3 py-1',
                    section.level === 4 ? 'text-3xl' : section.level === 3 ? 'text-4xl' : 'text-5xl'
                  ]"
                  :style="{
                    color: section.fontColor || section.headingColor || '#566C9D',
                    backgroundColor: section.backgroundColor || '#ffffff',
                    textAlign: section.textAlign || 'center',
                    textDecoration: section.underline === true ? 'underline' : 'none',
                  }"
                >
                  {{ section.text }}
                </component>

                <!-- Paragraph -->
                <p
                  v-else-if="section.type === 'paragraph'"
                  class="leading-7 mb-4 whitespace-pre-line rounded-lg px-3 py-2"
                  :style="descriptionTextBlockStyle(section, '#374151', '#ffffff', 'left')"
                >
                  <template
                    v-for="(part, partIndex) in parseBoldText(section.text)"
                    :key="partIndex"
                  >
                    <strong v-if="part.bold">{{ part.text }}</strong>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </p>

                <!-- Quote -->
                <blockquote
                  v-else-if="section.type === 'quote'"
                  class="border-l-4 border-blue-500 px-4 py-3 italic mb-4 rounded-r-lg whitespace-pre-line"
                  :style="descriptionTextBlockStyle(section, '#4b5563', '#ffffff', 'left')"
                >
                  {{ section.text }}
                </blockquote>

                <!-- List -->
                <ol
                  v-else-if="section.type === 'list' && section.style === 'number'"
                  class="list-decimal list-inside space-y-2 rounded-lg p-4"
                  :style="descriptionTextBlockStyle(section, '#374151', '#ffffff', 'left')"
                >
                  <li v-for="(item, i) in section.items" :key="i">
                    <template
                      v-for="(part, partIndex) in parseBoldText(item)"
                      :key="partIndex"
                    >
                      <strong v-if="part.bold">{{ part.text }}</strong>
                      <span v-else>{{ part.text }}</span>
                    </template>
                  </li>
                </ol>

                <ul
                  v-else-if="section.type === 'list'"
                  class="space-y-2 rounded-lg p-4"
                  :style="descriptionTextBlockStyle(section, '#374151', '#ffffff', 'left')"
                >
                  <li
                    v-for="(item, i) in section.items"
                    :key="i"
                    :class="['flex gap-2', descriptionFlexAlignClass(section.textAlign)]"
                  >
                    <span
                      class="shrink-0 font-bold"
                      :class="section.style === 'check' ? 'text-green-600' : ''"
                      aria-hidden="true"
                    >{{ listPointer(section.style) }}</span>
                    <span>
                      <template
                        v-for="(part, partIndex) in parseBoldText(item)"
                        :key="partIndex"
                      >
                        <strong v-if="part.bold">{{ part.text }}</strong>
                        <span v-else>{{ part.text }}</span>
                      </template>
                    </span>
                  </li>
                </ul>

                <!-- Warning -->
                <div
                  v-else-if="section.type === 'warning'"
                  class="border border-yellow-300 p-4 rounded-lg whitespace-pre-line"
                  :style="descriptionTextBlockStyle(section, '#854d0e', '#fefce8', 'left')"
                >
                  <template
                    v-for="(part, partIndex) in parseBoldText(section.text)"
                    :key="partIndex"
                  >
                    <strong v-if="part.bold">{{ part.text }}</strong>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </div>

                <!-- Info -->
                <div
                  v-else-if="section.type === 'info'"
                  class="border border-blue-200 p-4 rounded-lg whitespace-pre-line"
                  :style="descriptionTextBlockStyle(section, '#1e3a8a', '#eff6ff', 'left')"
                >
                  <template
                    v-for="(part, partIndex) in parseBoldText(section.text)"
                    :key="partIndex"
                  >
                    <strong v-if="part.bold">{{ part.text }}</strong>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </div>

                <!-- Image -->
                <figure
                  v-else-if="section.type === 'image' && section.url"
                  class="my-8"
                >
                  <figcaption
                    v-if="section.caption && section.captionPosition === 'above'"
                    class="mx-auto mb-2 w-fit max-w-full rounded-md px-3 py-1.5 text-sm"
                    :style="{
                      color: section.captionColor || '#64748b',
                      backgroundColor: section.captionBackgroundColor || 'transparent',
                      textAlign: section.textAlign || 'left',
                    }"
                  >
                    <span v-if="section.captionHtml" v-html="sanitiseCaptionHtml(section.captionHtml)"></span>
                    <span v-else :class="[captionFontSizeClass(section.captionFontSize), section.captionBold ? 'font-bold' : 'font-normal']">{{ section.caption }}</span>
                  </figcaption>

                  <img
                    :src="section.url"
                    :alt="section.alt || product.name"
                    class="mx-auto h-auto rounded-lg object-contain"
                    :class="descriptionImageClass(section.width)"
                  />

                  <figcaption
                    v-if="section.caption && section.captionPosition !== 'above'"
                    class="mx-auto mt-2 w-fit max-w-full rounded-md px-3 py-1.5 text-sm"
                    :style="{
                      color: section.captionColor || '#64748b',
                      backgroundColor: section.captionBackgroundColor || 'transparent',
                      textAlign: section.textAlign || 'left',
                    }"
                  >
                    <span v-if="section.captionHtml" v-html="sanitiseCaptionHtml(section.captionHtml)"></span>
                    <span v-else :class="[captionFontSizeClass(section.captionFontSize), section.captionBold ? 'font-bold' : 'font-normal']">{{ section.caption }}</span>
                  </figcaption>
                </figure>

                <!-- Divider -->
                <hr v-else-if="section.type === 'divider'" class="my-6 border-gray-200" />

                <!-- Table -->
                <div
                  v-else-if="section.type === 'table'"
                  class="overflow-hidden rounded-lg border border-gray-200"
                  :style="{ backgroundColor: section.backgroundColor || '#ffffff' }"
                >
                  <table
                    class="w-full"
                    :style="{ color: section.fontColor || '#374151', backgroundColor: section.backgroundColor || '#ffffff' }"
                  >
                    <thead>
                      <tr>
                        <th
                          v-for="header in section.headers"
                          :key="header"
                          class="whitespace-pre-line border-b border-gray-200 p-3 font-semibold"
                          :style="{ textAlign: section.textAlign || 'left' }"
                        >
                          <template
                            v-for="(part, partIndex) in parseBoldText(header)"
                            :key="partIndex"
                          >
                            <strong v-if="part.bold">{{ part.text }}</strong>
                            <span v-else>{{ part.text }}</span>
                          </template>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-for="(row, r) in section.rows"
                        :key="r"
                        class="border-t"
                      >
                        <td
                          v-for="(cell, c) in row"
                          :key="c"
                          class="whitespace-pre-line p-3"
                          :style="{ textAlign: section.textAlign || 'left' }"
                        >
                          <template
                            v-for="(part, partIndex) in parseBoldText(cell)"
                            :key="partIndex"
                          >
                            <strong v-if="part.bold">{{ part.text }}</strong>
                            <span v-else>{{ part.text }}</span>
                          </template>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="relatedProducts.length"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div class="mb-5 flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-cyan-600">Recommended for you</p>
                <h2 class="mt-1 text-xl font-bold text-slate-900">You May Also Like</h2>
              </div>
              <p class="text-sm text-slate-500">Products that work well with this item.</p>
            </div>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ProductCard
                v-for="item in relatedProducts"
                :key="item.id"
                :product="item"
              />
            </div>
          </section>
          <section
            v-if="recentlyViewedProducts.length"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div class="mb-5 flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-cyan-600">Pick up where you left off</p>
                <h2 class="mt-1 text-xl font-bold text-slate-900">Recently Viewed</h2>
              </div>
              <button
                type="button"
                class="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                @click="clearRecentlyViewed"
              >
                Clear history
              </button>
            </div>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ProductCard
                v-for="item in recentlyViewedProducts"
                :key="item.id"
                :product="item"
              />
            </div>
          </section>

        </div>
      </main>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- IMAGE LIGHTBOX / ZOOM -->
  <!-- ========================================================= -->

  <Teleport to="body">
    <div
      v-if="lightboxOpen"
      class="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      @click="closeLightbox"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click.stop="closeLightbox"
        class="absolute top-5 right-5 z-50 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-800 text-2xl flex items-center justify-center shadow-lg"
        aria-label="Close image"
      >
        &times;
      </button>

      <!-- Zoom Controls -->
      <div
        class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/90 rounded-lg p-2 shadow-lg"
        @click.stop
      >
        <button
          type="button"
          @click="zoomOut"
          class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold"
          aria-label="Zoom out"
        >
          −
        </button>

        <span class="min-w-[70px] text-center font-semibold">
          {{ Math.round(zoomLevel * 100) }}%
        </span>

        <button
          type="button"
          @click="zoomIn"
          class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold"
          aria-label="Zoom in"
        >
          +
        </button>

        <button
          type="button"
          @click="resetZoom"
          class="px-3 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
        >
          Reset
        </button>
      </div>

      <!-- Previous Lightbox Image -->
      <button
        v-if="images.length > 1"
        type="button"
        @click.stop="previousLightboxImage"
        class="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg"
        aria-label="Previous image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-7 h-7"
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

      <!-- Next Lightbox Image -->
      <button
        v-if="images.length > 1"
        type="button"
        @click.stop="nextLightboxImage"
        class="absolute right-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg"
        aria-label="Next image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-7 h-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Image -->
      <div
        class="max-w-[90vw] max-h-[85vh] overflow-hidden flex items-center justify-center"
        @click.stop
        @wheel.prevent="handleWheel"
      >
        <img
          :src="currentImage"
          :alt="product.name"
          class="max-w-none max-h-[85vh] object-contain select-none transition-transform duration-200"
          :style="{
            transform: `scale(${zoomLevel})`,
            cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
          }"
          @click="handleImageClick"
          draggable="false"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const supabase = useSupabaseClient();
const route = useRoute();

const cart = useCartStore();
const customerUser = useSupabaseUser();
const { isSaved, toggle: toggleWishlistProduct, load: loadWishlist } = useWishlist();
const wishlistSaved = computed(() => isSaved(product.value?.id));
const toggleWishlist = async () => { await toggleWishlistProduct(product.value?.id); };
const { quote, applyToProducts, pricingLevelName } = useCustomerPricing();

const quotedProductPrice = ref(null);
const quotedVariantPrices = ref({});
const selectedVariantId = ref(null);
const backInStockBusy = ref(false);
const backInStockMessage = ref("");
const backInStockError = ref(false);
async function subscribeBackInStock() {
  backInStockBusy.value = true;
  backInStockMessage.value = "";
  backInStockError.value = false;
  try {
    if (!customerUser.value) {
      await navigateTo(`/auth/signin?redirect=${encodeURIComponent(route.fullPath)}`);
      return;
    }

    if (!wishlistSaved.value) {
      await toggleWishlistProduct(product.value?.id);
      await loadWishlist(true);
    }

    const body = {
      product_id: Number(product.value?.id),
      variant_id: selectedVariant.value?.id ? Number(selectedVariant.value.id) : null,
    };
    const result = await $fetch("/api/back-in-stock", { method: "POST", body });
    backInStockMessage.value = result?.message || "Saved. We’ll only email you while this product remains in your wishlist.";
  } catch (error) {
    backInStockError.value = true;
    backInStockMessage.value = error?.data?.statusMessage || error?.message || "Unable to save your notification request.";
  } finally {
    backInStockBusy.value = false;
  }
}

watch(selectedVariantId, () => { backInStockMessage.value = ""; backInStockError.value = false; });

const activeVariants = computed(() => (product.value?.product_variants || []).filter((v) => v.active !== false));
const selectedVariant = computed(() => activeVariants.value.find((v) => Number(v.id) === Number(selectedVariantId.value)) || null);
const effectivePrice = computed(() => {
  if (selectedVariant.value) {
    const quotedVariantPrice = Number(
      quotedVariantPrices.value[String(selectedVariant.value.id)],
    );
    if (Number.isFinite(quotedVariantPrice) && quotedVariantPrice > 0) {
      return quotedVariantPrice;
    }

    const variantPrice = selectedVariant.value?.price;
    const parsedVariantPrice =
      variantPrice == null || variantPrice === "" ? NaN : Number(variantPrice);
    if (Number.isFinite(parsedVariantPrice) && parsedVariantPrice > 0) {
      return parsedVariantPrice;
    }
  }

  const quotedBasePrice = Number(quotedProductPrice.value);
  if (Number.isFinite(quotedBasePrice) && quotedBasePrice > 0) {
    return quotedBasePrice;
  }

  return Number(product.value?.price ?? 0);
});
const effectiveStandardPrice = computed(() => {
  if (selectedVariant.value) {
    const variantPrice = Number(selectedVariant.value?.price);
    if (Number.isFinite(variantPrice) && variantPrice > 0) return variantPrice;
  }
  return Number(product.value?.price || 0);
});

const hasCustomerDiscount = computed(() =>
  pricingLevelName.value !== "Standard" &&
  effectivePrice.value > 0 &&
  effectiveStandardPrice.value > effectivePrice.value
);

const effectiveOldPrice = computed(() => Number(selectedVariant.value?.old_price ?? product.value?.old_price ?? product.value?.oldPrice ?? 0));
const effectiveStock = computed(() => Number(selectedVariant.value?.stock ?? product.value?.stock ?? 0));
const addCurrentToCart = () => {
  if (product.value?.has_variants && !selectedVariant.value) return;
  cart.addToCart({
    ...product.value,
    price: effectivePrice.value,
    stock: effectiveStock.value,
    images: images.value,
    selectedVariant: selectedVariant.value ? { id: selectedVariant.value.id, name: selectedVariant.value.name, product_code: selectedVariant.value.product_code } : null,
  });
};

/*
|--------------------------------------------------------------------------
| Description Bold Text
|--------------------------------------------------------------------------
*/

const parseBoldText = (text = "") => {
  const parts = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }

    parts.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  return parts.length ? parts : [{ text, bold: false }];
};

const descriptionTextBlockStyle = (
  section,
  defaultFontColor = '#374151',
  defaultBackgroundColor = '#ffffff',
  defaultAlign = 'left',
) => ({
  color: section?.fontColor || defaultFontColor,
  backgroundColor: section?.backgroundColor || defaultBackgroundColor,
  textAlign: section?.textAlign || defaultAlign,
});

const descriptionFlexAlignClass = (align = 'left') => {
  if (align === 'center') return 'justify-center';
  if (align === 'right') return 'justify-end';
  return 'justify-start';
};

const listPointer = (style = 'bullet') => ({
  bullet: '•',
  circle: '○',
  square: '■',
  dash: '–',
  arrow: '→',
  chevron: '›',
  check: '✓',
  star: '★',
  diamond: '◆',
  plus: '+',
}[style] || '•');

/*
|--------------------------------------------------------------------------
| Description Image Width
|--------------------------------------------------------------------------
*/

const sanitiseCaptionHtml = (html = '') => {
  if (!html) return '';

  return String(html)
    .replace(/<(?!\/?(?:strong|b|span|br)\b)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/style\s*=\s*["']([^"']*)["']/gi, (_match, styleValue) => {
      const safeStyles = String(styleValue)
        .split(';')
        .map((rule) => rule.trim())
        .filter((rule) => /^(font-size|color|background-color)\s*:/i.test(rule))
        .filter((rule) => !/url\s*\(|expression\s*\(|javascript:/i.test(rule))
        .join(';');

      return safeStyles ? `style="${safeStyles}"` : '';
    });
};

const captionFontSizeClass = (size) => {
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  return sizes[size || "sm"] || "text-sm";
};

const descriptionImageClass = (width) => {
  if (width === "small") {
    return "w-full max-w-xs";
  }

  if (width === "medium") {
    return "w-full max-w-md";
  }

  if (width === "large") {
    return "w-full max-w-2xl";
  }

  return "w-full";
};

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
        id, name, slug, product_code, has_variants, blurb, description,
        price, oldPrice, stock, active, featured, refurbished, images, category_id,
        categories (name, slug),
        product_variants (id, product_id, name, product_code, price, old_price, stock, active, images)
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

const { data: relatedProductRows } = await useAsyncData(
  `related-products-${route.params.slug}`,
  async () => {
    if (!product.value?.id) return [];
    return await $fetch(`/api/products/${product.value.id}/related`);
  },
);

const relatedProducts = ref(Array.isArray(relatedProductRows.value) ? relatedProductRows.value : []);
const refreshRelatedProductPrices = async () => {
  const source = Array.isArray(relatedProductRows.value) ? relatedProductRows.value : [];
  if (!source.length) {
    relatedProducts.value = [];
    return;
  }

  const rows = source.map((item) => ({
    ...item,
    product_variants: Array.isArray(item.product_variants)
      ? item.product_variants.map((variant) => ({ ...variant }))
      : [],
  }));

  if (import.meta.client) {
    await applyToProducts(rows);
  }
  relatedProducts.value = rows;
};

watch(
  [() => relatedProductRows.value, () => customerUser.value?.id],
  async () => {
    await refreshRelatedProductPrices();
  },
  { immediate: true, deep: true },
);

const RECENTLY_VIEWED_STORAGE_KEY = "kc_recently_viewed_products";
const recentlyViewedProducts = ref([]);

const readRecentlyViewedIds = () => {
  if (!import.meta.client) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      : [];
  } catch {
    return [];
  }
};

const writeRecentlyViewedIds = (ids) => {
  if (!import.meta.client) return;
  localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(ids.slice(0, 12)));
};

const rememberCurrentProduct = () => {
  const currentId = Number(product.value?.id);
  if (!import.meta.client || !Number.isInteger(currentId) || currentId <= 0) return;
  const ids = readRecentlyViewedIds().filter((id) => id !== currentId);
  writeRecentlyViewedIds([currentId, ...ids]);
};

const refreshRecentlyViewedProducts = async () => {
  if (!import.meta.client || !product.value?.id) return;

  const currentId = Number(product.value.id);
  const ids = readRecentlyViewedIds()
    .filter((id) => id !== currentId)
    .slice(0, 4);

  if (!ids.length) {
    recentlyViewedProducts.value = [];
    return;
  }

  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, blurb, product_code, has_variants,
      price, oldPrice, stock, active, featured, refurbished, images, category_id,
      categories (id, name, slug, parent_id),
      product_variants (id, product_id, name, product_code, price, old_price, stock, active, images)
    `)
    .in("id", ids)
    .eq("active", true);

  if (error) {
    console.error("RECENTLY VIEWED LOAD ERROR:", error);
    return;
  }

  const byId = new Map((data || []).map((item) => [Number(item.id), item]));
  const rows = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((item) => ({
      ...item,
      product_variants: Array.isArray(item.product_variants)
        ? item.product_variants.map((variant) => ({ ...variant }))
        : [],
    }));

  await applyToProducts(rows);
  recentlyViewedProducts.value = rows;
};

const clearRecentlyViewed = () => {
  if (import.meta.client) localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
  recentlyViewedProducts.value = [];
  rememberCurrentProduct();
};

watchEffect(() => {
  if (product.value?.has_variants && selectedVariantId.value == null && activeVariants.value.length) {
    selectedVariantId.value = Number(activeVariants.value[0].id);
  }
});

const refreshCustomerPrice = async () => {
  if (!import.meta.client || !product.value?.id) return;

  try {
    const items = [
      { productId: product.value.id },
      ...(product.value.product_variants || []).map((variant) => ({
        productId: product.value.id,
        variantId: variant.id,
      })),
    ];

    const result = await quote(items);

    const basePrice = Number(result?.products?.[String(product.value.id)]);
    quotedProductPrice.value =
      Number.isFinite(basePrice) && basePrice > 0 ? basePrice : null;

    quotedVariantPrices.value = result?.variants || {};
  } catch (error) {
    console.error("CUSTOMER PRODUCT PRICE ERROR:", error);
    quotedProductPrice.value = null;
    quotedVariantPrices.value = {};
  }
};

// Supabase restores the logged-in user on the client after hydration.
// Refresh pricing when that happens so the product page cannot get stuck
// showing the Standard price from its first anonymous render.
watch(
  [() => product.value?.id, () => customerUser.value?.id],
  async ([productId]) => {
    if (!productId || !import.meta.client) return;
    await refreshCustomerPrice();
  },
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([
    refreshCustomerPrice(),
    refreshRelatedProductPrices(),
    refreshRecentlyViewedProducts(),
    loadWishlist(),
  ]);
  rememberCurrentProduct();
});

watch(
  () => customerUser.value?.id,
  async () => {
    if (!import.meta.client) return;
    await refreshRecentlyViewedProducts();
  },
);

/*
|--------------------------------------------------------------------------
| Current Image
|--------------------------------------------------------------------------
*/

const currentImageIndex = ref(0);

watch(selectedVariantId, () => { currentImageIndex.value = 0; });

/*
|--------------------------------------------------------------------------
| Convert Images Into An Array
|--------------------------------------------------------------------------
*/

const images = computed(() => {
  const variantImages = selectedVariant.value?.images;
  const source = Array.isArray(variantImages) && variantImages.length
    ? variantImages
    : product.value?.images;

  if (!source) return [];
  if (Array.isArray(source)) return source.filter(Boolean);
  if (typeof source === "string") {
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
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

const absoluteProductImage = computed(() => {
  const image = images.value[0] || "";
  if (!image) {
    return "https://shop.kiallacomputers.com.au/kialla-computers-logo.png";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `https://shop.kiallacomputers.com.au${image.startsWith("/") ? "" : "/"}${image}`;
});

const productPageUrl = computed(() =>
  `https://shop.kiallacomputers.com.au/product/${encodeURIComponent(
    String(product.value?.slug || route.params.slug || ""),
  )}`,
);

const shareCopied = ref(false);

const shareText = computed(() => {
  const name = product.value?.name || "Product";
  // Shared posts use the public/base product price, not a customer's private pricing-level price.
  const price = Number(product.value?.price || 0);
  const formattedPrice = Number.isFinite(price) && price > 0
    ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(price)
    : "";

  return `${name}${formattedPrice ? ` — ${formattedPrice}` : ""} at Kialla Computers`;
});

const facebookShareUrl = computed(() =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productPageUrl.value)}`,
);

const whatsAppShareUrl = computed(() =>
  `https://wa.me/?text=${encodeURIComponent(`${shareText.value}\n${productPageUrl.value}`)}`,
);

const emailShareUrl = computed(() =>
  `mailto:?subject=${encodeURIComponent(product.value?.name || "Kialla Computers product")}&body=${encodeURIComponent(`${shareText.value}\n\n${productPageUrl.value}`)}`,
);

const copyProductLink = async () => {
  try {
    await navigator.clipboard.writeText(productPageUrl.value);
    shareCopied.value = true;
    window.setTimeout(() => { shareCopied.value = false; }, 1800);
  } catch {
    // Clipboard may be unavailable in older browsers.
  }
};

const shareProduct = async () => {
  if (!import.meta.client) return;

  const shareData = {
    title: product.value?.name || "Kialla Computers",
    text: shareText.value,
    url: productPageUrl.value,
  };

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  await copyProductLink();
};

const productSeoDescription = computed(() => {
  const name = product.value?.name || "Product";
  const price = Number(product.value?.price || 0);
  const formattedPrice =
    Number.isFinite(price) && price > 0
      ? new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
        }).format(price)
      : "";
  const category = product.value?.categories?.name
    ? ` in ${product.value.categories.name}`
    : "";

  return `${name}${category}${formattedPrice ? ` — ${formattedPrice}` : ""}. Available from Kialla Computers.`;
});

useSeoMeta({
  title: () =>
    product.value?.name
      ? `${product.value.name} | Kialla Computers`
      : "Kialla Computers",
  description: () => productSeoDescription.value,
  ogTitle: () => product.value?.name || "Kialla Computers",
  ogDescription: () => productSeoDescription.value,
  ogType: "product",
  ogUrl: () => productPageUrl.value,
  ogImage: () => absoluteProductImage.value,
  twitterCard: "summary_large_image",
  twitterTitle: () => product.value?.name || "Kialla Computers",
  twitterDescription: () => productSeoDescription.value,
  twitterImage: () => absoluteProductImage.value,
});

useHead({
  link: [
    {
      rel: "canonical",
      href: () => productPageUrl.value,
    },
  ],
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
| IMAGE LIGHTBOX / ZOOM
|--------------------------------------------------------------------------
*/

const lightboxOpen = ref(false);

const zoomLevel = ref(1);

const openLightbox = () => {
  if (!currentImage.value) {
    return;
  }

  zoomLevel.value = 1;

  lightboxOpen.value = true;

  document.body.style.overflow = "hidden";
};

const closeLightbox = () => {
  lightboxOpen.value = false;

  zoomLevel.value = 1;

  document.body.style.overflow = "";
};

/*
|--------------------------------------------------------------------------
| Zoom In
|--------------------------------------------------------------------------
*/

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 4);
};

/*
|--------------------------------------------------------------------------
| Zoom Out
|--------------------------------------------------------------------------
*/

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 1);
};

/*
|--------------------------------------------------------------------------
| Reset Zoom
|--------------------------------------------------------------------------
*/

const resetZoom = () => {
  zoomLevel.value = 1;
};

/*
|--------------------------------------------------------------------------
| Click Image To Zoom
|--------------------------------------------------------------------------
*/

const handleImageClick = () => {
  if (zoomLevel.value < 4) {
    zoomIn();
  } else {
    resetZoom();
  }
};

/*
|--------------------------------------------------------------------------
| Mouse Wheel Zoom
|--------------------------------------------------------------------------
*/

const handleWheel = (event) => {
  if (event.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
};

/*
|--------------------------------------------------------------------------
| Lightbox Previous Image
|--------------------------------------------------------------------------
*/

const previousLightboxImage = () => {
  previousImage();

  resetZoom();
};

/*
|--------------------------------------------------------------------------
| Lightbox Next Image
|--------------------------------------------------------------------------
*/

const nextLightboxImage = () => {
  nextImage();

  resetZoom();
};

/*
|--------------------------------------------------------------------------
| Close With Escape
|--------------------------------------------------------------------------
*/

const handleEscape = (event) => {
  if (event.key === "Escape" && lightboxOpen.value) {
    closeLightbox();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);

  document.body.style.overflow = "";
});

/*
|--------------------------------------------------------------------------
| Debug
|--------------------------------------------------------------------------
*/

console.log("PRODUCT IMAGES:", product.value?.images);

console.log("NORMALISED IMAGES:", images.value);
</script>