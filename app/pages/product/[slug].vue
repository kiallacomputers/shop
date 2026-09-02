<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <Ads />

    <div class="flex flex-col md:flex-row gap-6">
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>

      <main class="min-w-0 flex-1">
        <div class="space-y-6">
          <!-- Product hero -->
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                    class="flex h-[360px] w-full cursor-zoom-in items-center justify-center sm:h-[440px] lg:h-[520px]"
                    @click="openLightbox"
                  >
                    <img
                      v-if="currentImage"
                      :src="currentImage"
                      :alt="product.name"
                      class="h-full w-full object-contain p-6 sm:p-8 lg:p-10 transition-transform duration-300 hover:scale-[1.025]"
                    />
                    <div v-else class="text-slate-400">No Image Available</div>
                  </div>

                  <button
                    v-if="images.length > 1"
                    type="button"
                    @click.stop.prevent="previousImage"
                    class="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
                    aria-label="Previous image"
                  >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <button
                    v-if="images.length > 1"
                    type="button"
                    @click.stop.prevent="nextImage"
                    class="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
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
                  class="flex gap-3 overflow-x-auto border-t border-slate-200 bg-white p-4"
                >
                  <button
                    v-for="(image, index) in images"
                    :key="index"
                    type="button"
                    @click="goToImage(index)"
                    class="h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition"
                    :class="index === currentImageIndex ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-400'"
                  >
                    <img :src="image" :alt="`${product.name} image ${index + 1}`" class="h-full w-full object-contain p-1.5" />
                  </button>
                </div>
              </div>

              <!-- Purchase panel -->
              <div class="flex flex-col p-6 sm:p-8 lg:p-9">
                <div>
                  <NuxtLink
                    :to="`/category/${product.categories.slug}`"
                    class="text-sm font-bold uppercase tracking-wide text-sky-600 hover:text-sky-700"
                  >
                    {{ product.categories.name }}
                  </NuxtLink>

                  <h1 class="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                    {{ product.name }}
                  </h1>

                  <div class="mt-6 border-y border-slate-200 py-5">
                    <div class="flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span class="text-4xl font-extrabold tracking-tight text-sky-600">
                        ${{ product.price }}
                      </span>
                      <span
                        v-if="product.oldPrice"
                        class="pb-1 text-base text-slate-400 line-through"
                      >
                        ${{ product.oldPrice }}
                      </span>
                    </div>
                    <p class="mt-1 text-xs text-slate-500">Price includes GST</p>
                  </div>

                  <div class="mt-5">
                    <div
                      v-if="product.stock > 0"
                      class="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 ring-1 ring-inset ring-green-200"
                    >
                      <span class="h-2 w-2 rounded-full bg-green-500"></span>
                      {{ product.stock }} in stock
                    </div>
                    <div
                      v-else
                      class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 ring-1 ring-inset ring-amber-200"
                    >
                      <span class="h-2 w-2 rounded-full bg-amber-500"></span>
                      Backorder — please call
                    </div>
                  </div>
                </div>

                <div class="mt-8 lg:mt-auto lg:pt-10">
                  <button
                    v-if="product.stock > 0"
                    type="button"
                    @click="cart.addToCart(product)"
                    class="w-full rounded-xl bg-sky-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  >
                    Add to Cart
                  </button>

                  <div
                    v-else
                    class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                  >
                    This item is currently on backorder. Please contact us for availability and an estimated delivery time.
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
                  :class="section.style === 'check' ? 'space-y-2 rounded-lg p-4' : 'list-disc list-inside space-y-2 rounded-lg p-4'"
                  :style="descriptionTextBlockStyle(section, '#374151', '#ffffff', 'left')"
                >
                  <li v-for="(item, i) in section.items" :key="i" :class="section.style === 'check' ? ['flex gap-2', descriptionFlexAlignClass(section.textAlign)] : ''">
                    <span v-if="section.style === 'check'" class="font-bold text-green-600">✓</span>
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
                  {{ section.text }}
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
                          class="border-b border-gray-200 p-3 font-semibold"
                          :style="{ textAlign: section.textAlign || 'left' }"
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
                        <td
                          v-for="(cell, c) in row"
                          :key="c"
                          class="p-3"
                          :style="{ textAlign: section.textAlign || 'left' }"
                        >
                          {{ cell }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
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
| Convert Images Into An Array
|--------------------------------------------------------------------------
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