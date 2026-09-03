<template>
  <article class="group kc-panel overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:border-cyan-300 transition duration-200">
    <div class="relative aspect-[4/3] bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <NuxtLink :to="`/product/${product.slug}`" class="block h-full">
        <img v-if="currentImage" :src="currentImage" :alt="product.name" class="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]" />
        <div v-else class="w-full h-full flex items-center justify-center text-sm text-slate-400">No image available</div>
      </NuxtLink>

      <div class="absolute top-3 left-3 flex flex-wrap gap-2">
        <span v-if="product.featured" class="rounded-full bg-[#2367d1] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">Featured</span>
        <span v-if="product.refurbished" class="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">Refurbished</span>
      </div>

      <template v-if="images.length > 1">
        <button type="button" @click.prevent.stop="previousImage" class="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white/95 shadow-sm text-slate-700 opacity-0 group-hover:opacity-100 transition" aria-label="Previous image">‹</button>
        <button type="button" @click.prevent.stop="nextImage" class="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white/95 shadow-sm text-slate-700 opacity-0 group-hover:opacity-100 transition" aria-label="Next image">›</button>
      </template>
    </div>

    <div class="p-5 flex flex-col flex-1">
      <p v-if="product.categories?.name" class="text-[11px] font-black uppercase tracking-[.12em] text-cyan-600">{{ product.categories.name }}</p>
      <NuxtLink :to="`/product/${product.slug}`" class="mt-1 block">
        <h3 class="min-h-[48px] font-extrabold leading-6 text-[#0b1f3a] group-hover:text-blue-600 transition line-clamp-2">{{ product.name }}</h3>
      </NuxtLink>
      <p v-if="product.blurb" class="mt-2 text-sm leading-5 text-slate-500 line-clamp-2">{{ product.blurb }}</p>

      <div class="mt-auto pt-5">
        <div class="flex items-end justify-between gap-3">
          <div>
            <p class="text-2xl font-black tracking-tight text-[#0b1f3a]">${{ Number(product.price).toFixed(2) }}</p>
            <p class="text-[11px] font-semibold text-slate-400">GST inclusive</p>
          </div>
          <span v-if="Number(product.stock) > 0" class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">In stock</span>
          <span v-else class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Backorder</span>
        </div>
        <NuxtLink :to="`/product/${product.slug}`" class="mt-4 flex w-full items-center justify-center rounded-xl bg-[#2367d1] px-4 py-3 text-sm font-black text-white hover:bg-[#194fa8] transition">View product</NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({ product: { type:Object, required:true } });
const currentImageIndex = ref(0);
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
