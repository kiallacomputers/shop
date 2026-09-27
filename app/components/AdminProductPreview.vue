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
          <p class="mt-2 font-bold" :class="stock > 0 ? 'text-green-700' : 'text-red-600'">
            {{ product.has_variants ? 'Stock depends on selected variant' : stock > 0 ? `${stock} in stock` : 'Out of stock' }}
          </p>
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

    <section v-if="description.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="mb-5 border-b border-slate-200 pb-4"><h2 class="text-xl font-bold text-slate-900">Product Details</h2></div>
      <div class="text-sm text-[#566C9D]">
        <div v-for="(section,index) in description" :key="index" :class="section.type==='heading'?'mb-2':'mb-6'">
          <component :is="section.level===4?'h4':section.level===3?'h3':'h2'" v-if="section.type==='heading'" class="mb-1 rounded-lg px-3 py-1 font-semibold" :style="{color:section.fontColor||section.headingColor||'#566C9D',backgroundColor:section.backgroundColor||'#fff',textAlign:section.textAlign||'center',textDecoration:section.underline?'underline':'none',fontSize:section.level===4?'1.875rem':section.level===3?'2.25rem':'3rem'}">{{ section.text }}</component>
          <div v-else-if="section.type==='paragraph'" class="mb-4 rounded-lg px-3 py-2" :style="textStyle(section)">
            <div v-if="section.paragraphImageUrl" class="flex flex-col gap-5 md:flex-row md:items-start" :class="section.paragraphImagePosition==='right'?'md:flex-row-reverse':''">
              <div class="w-full shrink-0 overflow-hidden rounded-lg bg-white" :style="{width:`${section.paragraphImageWidth||35}%`}"><img :src="section.paragraphImageUrl" :alt="section.paragraphImageAlt||''" class="h-auto w-full object-contain"></div>
              <p class="min-w-0 flex-1 whitespace-pre-line leading-7">{{ section.text }}</p>
            </div>
            <p v-else class="whitespace-pre-line leading-7">{{ section.text }}</p>
          </div>
          <div v-else-if="section.type==='link'" class="mb-4" :class="alignClass(section.textAlign)"><a v-if="section.linkUrl" :href="section.linkUrl" target="_blank" rel="noopener noreferrer external" class="font-semibold text-blue-600 underline">{{ section.linkText||section.linkUrl }}</a></div>
          <div v-else-if="section.type==='downloads'" class="mb-6 overflow-x-auto rounded-xl border border-slate-200">
            <table class="w-full min-w-[620px] border-collapse text-left text-sm"><thead class="bg-slate-100 text-xs font-bold uppercase text-slate-600"><tr><th class="px-4 py-3">Description</th><th class="px-4 py-3">Size</th><th class="px-4 py-3">Type</th><th class="px-4 py-3">Download</th></tr></thead><tbody>
              <tr v-for="(d,di) in section.downloads||[]" :key="di" class="border-t border-slate-200"><td class="px-4 py-3 font-semibold text-slate-800">{{d.description||'Download'}}</td><td class="px-4 py-3">{{d.size||'—'}}</td><td class="px-4 py-3 font-semibold uppercase">{{d.fileType||'—'}}</td><td class="px-4 py-3"><a v-if="d.url" :href="d.url" target="_blank" rel="noopener noreferrer external" class="inline-flex items-center gap-2 font-bold text-blue-600"><img src="/icons/download.svg" alt="" class="h-5 w-5"><span>Download</span></a></td></tr>
            </tbody></table>
          </div>
          <blockquote v-else-if="section.type==='quote'" class="mb-4 whitespace-pre-line rounded-r-lg border-l-4 border-blue-500 px-4 py-3 italic" :style="textStyle(section)">{{section.text}}</blockquote>
          <ol v-else-if="section.type==='list'&&section.style==='number'" class="list-inside list-decimal space-y-2 rounded-lg p-4" :style="textStyle(section)"><li v-for="(item,i) in section.items" :key="i">{{item}}</li></ol>
          <ul v-else-if="section.type==='list'" class="space-y-2 rounded-lg p-4" :style="textStyle(section)"><li v-for="(item,i) in section.items" :key="i" class="flex gap-2"><span class="font-bold">{{section.style==='check'?'✓':'•'}}</span><span>{{item}}</span></li></ul>
          <div v-else-if="section.type==='warning'" class="whitespace-pre-line rounded-lg border border-yellow-300 p-4" :style="textStyle(section)">{{section.text}}</div>
          <div v-else-if="section.type==='info'" class="whitespace-pre-line rounded-lg border border-blue-200 p-4" :style="textStyle(section)">{{section.text}}</div>
          <figure v-else-if="section.type==='image'&&section.url" class="my-8"><img :src="section.url" :alt="section.alt||''" class="mx-auto max-w-full rounded-xl"><figcaption v-if="section.caption" class="mt-2 text-center text-xs text-slate-500">{{section.caption}}</figcaption></figure>
          <hr v-else-if="section.type==='divider'" class="my-6 border-slate-200">
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const props=defineProps<{product:any;categoryName?:string}>();
const imageIndex=ref(0);
const images=computed(()=>{const raw=props.product?.images;if(Array.isArray(raw))return raw.filter(Boolean);if(typeof raw==="string"){try{const p=JSON.parse(raw);return Array.isArray(p)?p.filter(Boolean):raw?[raw]:[]}catch{return raw?[raw]:[]}}return[]});
const currentImage=computed(()=>images.value[imageIndex.value]||"");
const stock=computed(()=>Number(props.product?.stock||0));
const description=computed(()=>Array.isArray(props.product?.description)?props.product.description:[]);
watch(()=>props.product?.id,()=>{imageIndex.value=0});
const previousImage=()=>{if(images.value.length)imageIndex.value=(imageIndex.value-1+images.value.length)%images.value.length};
const nextImage=()=>{if(images.value.length)imageIndex.value=(imageIndex.value+1)%images.value.length};
const currency=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
const textStyle=(s:any)=>({color:s.fontColor||"#374151",backgroundColor:s.backgroundColor||"#fff",textAlign:s.textAlign||"left",textDecoration:s.underline?"underline":"none"});
const alignClass=(v:string)=>v==="center"?"text-center":v==="right"?"text-right":"text-left";
</script>
