<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><p class="text-xs font-black uppercase tracking-wider text-blue-600">Marketing</p><h1 class="mt-1 text-3xl font-black text-slate-900">Marketing & SEO Centre</h1><p class="mt-1 text-slate-500">See how ready your catalogue is for search engines and Google Merchant listings.</p></div>
      <button class="btn-secondary" :disabled="loading" @click="load">{{ loading ? 'Checking…' : 'Refresh Check' }}</button>
    </div>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{{ error }}</div>
    <template v-if="data">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active Products" :value="data.summary.active_products" />
        <Stat label="SEO Healthy" :value="data.summary.healthy_products" />
        <Stat label="Need Attention" :value="data.summary.products_with_issues" />
        <Stat label="Missing Images" :value="data.summary.missing_image" />
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <section class="card p-5"><h2 class="text-lg font-black">Google Search</h2><p class="mt-1 text-sm text-slate-500">Dynamic sitemap and robots discovery.</p><div class="mt-4 space-y-2"><a :href="data.endpoints.sitemap" target="_blank" class="seo-link">✓ Sitemap.xml</a><a :href="data.endpoints.robots" target="_blank" class="seo-link">✓ Robots.txt</a></div></section>
        <section class="card p-5"><h2 class="text-lg font-black">Google Merchant</h2><p class="mt-1 text-sm text-slate-500">Live XML feed generated from active products.</p><a :href="data.endpoints.merchant" target="_blank" class="seo-link mt-4">View Merchant Feed →</a></section>
        <section class="card p-5"><h2 class="text-lg font-black">Automatic Product SEO</h2><p class="mt-1 text-sm text-slate-500">Product title, description, canonical URL, social preview and Product structured data are generated automatically.</p><div class="mt-4 text-sm font-bold text-green-700">✓ Enabled on product pages</div></section>
      </div>

      <section class="card overflow-hidden">
        <div class="border-b p-5"><div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-xl font-black">Product SEO Health</h2><p class="text-sm text-slate-500">Products with incomplete search/shopping data appear first.</p></div><input v-model="search" class="input max-w-sm" placeholder="Search products…" /></div></div>
        <div class="overflow-x-auto"><table class="w-full min-w-[900px] text-left text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Product</th><th class="px-4 py-3">Score</th><th class="px-4 py-3">Issues</th><th class="px-4 py-3">Google Preview</th><th class="px-4 py-3"></th></tr></thead><tbody><tr v-for="p in filtered" :key="p.id" class="border-t align-top"><td class="px-4 py-4"><div class="font-black text-slate-900">{{ p.name }}</div><div class="mt-1 text-xs text-slate-500">{{ p.product_code || 'No product code' }} · {{ p.category || 'No category' }}</div></td><td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-xs font-black" :class="p.score===100?'bg-green-100 text-green-700':p.score>=60?'bg-amber-100 text-amber-800':'bg-red-100 text-red-700'">{{ p.score }}%</span></td><td class="px-4 py-4"><span v-if="!p.issues.length" class="font-bold text-green-700">✓ Healthy</span><div v-else class="flex max-w-sm flex-wrap gap-1.5"><span v-for="issue in p.issues" :key="issue" class="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">{{ issue }}</span></div></td><td class="px-4 py-4"><div class="max-w-md"><div class="truncate text-base font-medium text-blue-700">{{ p.seo_title }}</div><div class="truncate text-xs text-green-700">{{ productUrl(p) }}</div><div class="mt-1 line-clamp-2 text-xs text-slate-600">{{ p.seo_description }}</div></div></td><td class="px-4 py-4"><NuxtLink :to="`/admin/products/${p.id}`" class="font-bold text-blue-600">Edit Product →</NuxtLink></td></tr></tbody></table></div>
      </section>
    </template>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] });
const { adminFetch, isSuperAdmin } = useAdminFetch();
const router = useRouter();
const loading=ref(true), error=ref(''), data=ref<any>(null), search=ref('');
onMounted(async()=>{ if(!isSuperAdmin.value){ await router.replace('/admin'); return; } await load(); });
async function load(){loading.value=true;error.value='';try{data.value=await adminFetch('/api/admin/marketing-seo')}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to load SEO health.'}finally{loading.value=false}}
const filtered=computed(()=>{const q=search.value.trim().toLowerCase();const rows=[...(data.value?.products||[])].sort((a:any,b:any)=>a.score-b.score||String(a.name).localeCompare(String(b.name)));return q?rows.filter((p:any)=>`${p.name} ${p.product_code||''} ${p.category||''}`.toLowerCase().includes(q)):rows});
const productUrl=(p:any)=>`${String(data.value?.endpoints?.sitemap||'').replace('/sitemap.xml','')}/product/${p.slug||''}`;
const Stat=defineComponent({props:{label:String,value:[String,Number]},setup(props){return()=>h('div',{class:'card p-5'},[h('div',{class:'text-3xl font-black text-slate-900'},String(props.value??0)),h('div',{class:'mt-1 text-sm font-bold text-slate-500'},props.label)])}});
</script>
<style scoped>
.card{border:1px solid #e2e8f0;border-radius:1rem;background:white;box-shadow:0 1px 2px rgb(15 23 42 / .04)}.seo-link{display:block;border:1px solid #dbeafe;border-radius:.75rem;background:#eff6ff;padding:.7rem .85rem;font-weight:800;color:#1d4ed8}.seo-link:hover{background:#dbeafe}
</style>
