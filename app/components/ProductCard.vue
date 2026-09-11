<template>
  <article class="group kc-panel overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_18px_45px_rgba(15,35,64,.11)] transition duration-200">
    <div class="relative aspect-[4/3] bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <NuxtLink :to="`/product/${product.slug}`" class="block h-full">
        <img v-if="currentImage" :src="currentImage" :alt="product.name" class="w-full h-full object-contain p-4 sm:p-6 transition-transform duration-300 group-hover:scale-[1.04]" />
        <div v-else class="w-full h-full flex items-center justify-center text-sm text-slate-400">No image available</div>
      </NuxtLink>

      <span v-if="product.featured" class="absolute top-3 left-3 rounded-full bg-[#2367d1] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">Featured</span>
      <span v-if="product.refurbished" class="absolute top-3 right-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">Refurbished</span>
      <button
        type="button"
        class="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl shadow-sm transition hover:scale-105"
        :class="wishlistSaved ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'"
        :title="wishlistSaved ? 'Remove from wishlist' : 'Save to wishlist'"
        :aria-label="wishlistSaved ? 'Remove from wishlist' : 'Save to wishlist'"
        @click.prevent.stop="toggleWishlist"
      >
        {{ wishlistSaved ? '♥' : '♡' }}
      </button>

      <template v-if="images.length > 1">
        <button type="button" @click.prevent.stop="previousImage" class="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white/95 shadow-sm text-slate-700 opacity-0 group-hover:opacity-100 transition" aria-label="Previous image">‹</button>
        <button type="button" @click.prevent.stop="nextImage" class="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white/95 shadow-sm text-slate-700 opacity-0 group-hover:opacity-100 transition" aria-label="Next image">›</button>
      </template>
    </div>

    <div class="p-4 sm:p-5 flex flex-col flex-1">
      <p v-if="product.categories?.name" class="text-[11px] font-black uppercase tracking-[.12em] text-cyan-600">{{ product.categories.name }}</p>
      <NuxtLink :to="`/product/${product.slug}`" class="mt-1 block">
        <h3 class="min-h-[48px] font-extrabold leading-6 text-[#0b1f3a] group-hover:text-blue-600 transition line-clamp-2">{{ product.name }}</h3>
      </NuxtLink>
      <p v-if="product.blurb" class="mt-2 text-sm leading-5 text-slate-500 line-clamp-2">{{ product.blurb }}</p>

      <div class="mt-auto pt-5">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div v-if="displayRrp > displayPrice" class="mb-1 text-slate-400">
              <p class="text-[10px] font-black uppercase tracking-[.12em]">RRP <span class="ml-1 text-xs font-semibold normal-case tracking-normal line-through">${{ displayRrp.toFixed(2) }}</span></p>
            </div>
            <p v-if="hasCustomerDiscount" class="text-[11px] font-bold uppercase tracking-wide text-blue-600">Your {{ pricingLevelName }} price</p>
            <p class="text-2xl font-black tracking-tight text-[#0b1f3a]"><span v-if="product.has_variants" class="mr-1 text-xs font-bold text-slate-500">From</span>${{ displayPrice.toFixed(2) }}</p>
            <p v-if="hasCustomerDiscount" class="text-xs text-slate-400">Standard <span class="line-through">${{ standardDisplayPrice.toFixed(2) }}</span></p>
            <p class="mt-1 text-[11px] font-semibold text-slate-400">GST inclusive</p>
          </div>
          <span v-if="product.has_variants && variantStock > 0" class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{{ variantStock }} across options</span>
          <span v-else-if="product.has_variants" class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">On back order — due 3–4 days</span>
          <span v-else-if="Number(product.stock) > 0" class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">In stock</span>
          <span v-else class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">On back order — due 3–4 days</span>
        </div>
        <NuxtLink :to="`/product/${product.slug}`" class="mt-4 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[#2367d1] px-4 py-3 text-sm font-black text-white hover:bg-[#194fa8] transition">View product</NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({ product: { type:Object, required:true } });
const currentImageIndex = ref(0);
const { pricingLevelName } = useCustomerPricing();
const { isSaved, toggle, load: loadWishlist } = useWishlist();
const wishlistSaved = computed(() => isSaved(props.product?.id));
onMounted(() => loadWishlist());
const toggleWishlist = async () => { await toggle(props.product?.id); };
const variantRows = computed(() => Array.isArray(props.product?.product_variants) ? props.product.product_variants.filter((v) => v?.active !== false) : []);
const displayPrice = computed(() => {
  const basePrice = Number(props.product?.customer_price ?? props.product?.price ?? 0);
  if (!props.product?.has_variants || !variantRows.value.length) return basePrice;
  const prices = variantRows.value
    .map((v) => Number(v.customer_price ?? v.price))
    .filter((v) => Number.isFinite(v) && v > 0);
  return prices.length ? Math.min(...prices) : basePrice;
});
const displayRrp = computed(() => {
  // Product cards should show the product-level RRP from Edit Product.
  // Variant RRPs can contain older/manual values and should not override the
  // advertised product RRP on listing/featured cards.
  const baseRrp = Number(props.product?.oldPrice ?? props.product?.old_price ?? 0);
  if (Number.isFinite(baseRrp) && baseRrp > 0) return baseRrp;

  // Fallback only when the product itself has no RRP configured.
  const prices = variantRows.value
    .map((v) => Number(v.old_price ?? 0))
    .filter((v) => Number.isFinite(v) && v > 0);
  return prices.length ? Math.min(...prices) : 0;
});
const standardDisplayPrice = computed(() => {
  const basePrice = Number(props.product?.price || 0);
  if (!props.product?.has_variants || !variantRows.value.length) return basePrice;
  const prices = variantRows.value
    .map((v) => Number(v.price || basePrice))
    .filter((v) => Number.isFinite(v) && v > 0);
  return prices.length ? Math.min(...prices) : basePrice;
});
const hasCustomerDiscount = computed(() =>
  pricingLevelName.value !== "Standard" &&
  displayPrice.value > 0 &&
  standardDisplayPrice.value > displayPrice.value
);
const variantStock = computed(() => variantRows.value.reduce((sum, v) => sum + Math.max(0, Number(v.stock || 0)), 0));
const images = computed(() => {
  if (!props.product?.images) return [];
  if (Array.isArray(props.product.images)) return props.product.images.filter(Boolean);
  if (typeof props.product.images === "string") { try { const parsed=JSON.parse(props.product.images); return Array.isArray(parsed) ? parsed.filter(Boolean) : []; } catch { return []; } }
  return [];
});
const currentImage = computed(() => images.value[currentImageIndex.value] || "");
const nextImage = () => { if (images.value.length > 1) currentImageIndex.value=(currentImageIndex.value+1)%images.value.length; };
const previousImage = () => { if (images.value.length > 1) currentImageIndex.value=(currentImageIndex.value-1+images.value.length)%images.value.length; };
</script>
