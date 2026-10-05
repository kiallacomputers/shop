<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div class="min-w-0 border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div class="relative bg-white">
            <span v-if="product.featured" class="absolute left-4 top-4 z-20 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Featured</span>
            <span v-if="product.refurbished" class="absolute right-4 top-4 z-20 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">Refurbished</span>
            <div class="flex h-[300px] items-center justify-center sm:h-[420px] lg:h-[460px]">
              <img v-if="currentImage" :src="currentImage" :alt="product.name" class="h-full w-full object-contain p-4 sm:p-8 lg:p-10">
              <div v-else class="text-slate-400">No Image Available</div>
            </div>
            <button v-if="images.length > 1" type="button" class="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl shadow-lg" @click="previousImage">‹</button>
            <button v-if="images.length > 1" type="button" class="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl shadow-lg" @click="nextImage">›</button>
            <div v-if="images.length > 1" class="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">{{ imageIndex + 1 }} / {{ images.length }}</div>
          </div>
          <div v-if="images.length > 1" class="flex gap-3 overflow-x-auto border-t border-slate-200 bg-white p-4">
            <button v-for="(image,index) in images" :key="image" type="button" class="h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white" :class="index===imageIndex?'border-blue-500':'border-slate-200'" @click="imageIndex=index">
              <img :src="image" alt="" class="h-full w-full object-contain p-1">
            </button>
          </div>
        </div>

        <div class="p-5 sm:p-7">
          <p v-if="categoryName" class="text-xs font-bold uppercase tracking-wider text-blue-600">{{ categoryName }}</p>
          <h1 class="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{{ product.name }}</h1>
          <p v-if="product.product_code" class="mt-2 text-sm text-slate-500">SKU: {{ product.product_code }}</p>
          <p v-if="product.blurb" class="mt-5 whitespace-pre-line leading-7 text-slate-600">{{ product.blurb }}</p>
          <div class="mt-6 text-3xl font-black text-slate-900">{{ currency(product.price) }}</div>
          <div class="mt-3">
            <p class="font-bold" :class="availabilityClass">{{ availabilityText }}</p>
            <div v-if="!product.has_variants && stock <= 0 && leaderTotalStock > 0" class="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p class="text-xs font-black uppercase tracking-wide text-amber-800">Leader Backorder Availability</p>
              <p class="mt-1 text-sm font-bold text-amber-900">{{ backorderEta }}</p>
              <p class="mt-2 text-xs text-amber-800">
                VIC {{ leaderVicStock }} · NSW {{ leaderNswStock }} · QLD {{ leaderQldStock }} · SA {{ leaderSaStock }} · WA {{ leaderWaStock }}
              </p>
              <p v-if="product.leader_stock_updated_at" class="mt-1 text-[11px] text-amber-700">Supplier stock last synced {{ formatDateTime(product.leader_stock_updated_at) }}</p>
            </div>
          </div>
          <div v-if="product.brand || product.mpn || product.gtin" class="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
            <p v-if="product.brand"><strong>Brand:</strong> {{ product.brand }}</p>
            <p v-if="product.mpn"><strong>MPN:</strong> {{ product.mpn }}</p>
            <p v-if="product.gtin"><strong>GTIN:</strong> {{ product.gtin }}</p>
          </div>
          <div class="mt-7 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Admin preview only — cart, wishlist and customer tracking actions are intentionally disabled.
          </div>
        </div>
      </div>
    </section>

    <ProductDescriptionRenderer :description="description" />
  </div>
</template>

<script setup lang="ts">
const props=defineProps<{product:any;categoryName?:string}>();
const imageIndex=ref(0);
const images=computed(()=>{const raw=props.product?.images;if(Array.isArray(raw))return raw.filter(Boolean);if(typeof raw==="string"){try{const p=JSON.parse(raw);return Array.isArray(p)?p.filter(Boolean):raw?[raw]:[]}catch{return raw?[raw]:[]}}return[]});
const currentImage=computed(()=>images.value[imageIndex.value]||"");
const stock=computed(()=>Number(props.product?.stock||0));
const leaderVicStock=computed(()=>Math.max(0,Number(props.product?.leader_stock_vic||0)));
const leaderNswStock=computed(()=>Math.max(0,Number(props.product?.leader_stock_nsw||0)));
const leaderQldStock=computed(()=>Math.max(0,Number(props.product?.leader_stock_qld||0)));
const leaderSaStock=computed(()=>Math.max(0,Number(props.product?.leader_stock_sa||0)));
const leaderWaStock=computed(()=>Math.max(0,Number(props.product?.leader_stock_wa||0)));
const leaderOtherStock=computed(()=>leaderNswStock.value+leaderQldStock.value+leaderSaStock.value+leaderWaStock.value);
const leaderTotalStock=computed(()=>leaderVicStock.value+leaderOtherStock.value);
const backorderEta=computed(()=>{
  if(leaderVicStock.value>0)return "Usually 2–3 business days";
  if(leaderOtherStock.value>0)return "Usually 4–7 business days";
  return "Contact us for ETA";
});
const availabilityText=computed(()=>{
  if(props.product?.has_variants)return "Stock depends on selected variant";
  if(stock.value>0)return `${stock.value} in stock`;
  if(leaderTotalStock.value>0)return `Back order — ${backorderEta.value.toLowerCase()}`;
  return "Out of stock — no current Leader warehouse stock";
});
const availabilityClass=computed(()=>{
  if(props.product?.has_variants)return "text-blue-700";
  if(stock.value>0)return "text-green-700";
  if(leaderTotalStock.value>0)return "text-amber-700";
  return "text-red-600";
});
const formatDateTime=(v:any)=>{
  if(!v)return "";
  const d=new Date(v);
  return Number.isNaN(d.getTime())?"":new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeStyle:"short"}).format(d);
};
const description=computed(()=>Array.isArray(props.product?.description)?props.product.description:[]);
watch(()=>props.product?.id,()=>{imageIndex.value=0});
const previousImage=()=>{if(images.value.length)imageIndex.value=(imageIndex.value-1+images.value.length)%images.value.length};
const nextImage=()=>{if(images.value.length)imageIndex.value=(imageIndex.value+1)%images.value.length};
const currency=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
</script>
