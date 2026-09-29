<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><p class="text-xs font-black uppercase tracking-wider text-blue-600">Marketing</p><h1 class="mt-1 text-3xl font-black">Google Shopping</h1>
      <p class="mt-1 text-slate-500">Merchant feed readiness for active products and variants.</p></div>
      <div class="flex gap-2"><a v-if="data" :href="data.feed_url" target="_blank" class="btn-secondary">Open XML Feed</a><button class="btn-secondary" @click="load">Refresh</button></div>
    </div>
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{{error}}</div>
    <template v-if="data">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Feed Items" :value="data.summary.feed_items"/><Stat label="Ready" :value="data.summary.ready"/>
        <Stat label="Needs Attention" :value="data.summary.attention"/><Stat label="Not Eligible" :value="data.summary.not_eligible"/>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button class="chip" @click="filter='missing_brand'"><b>{{data.summary.missing_brand}}</b><span>Missing Brand</span></button>
        <button class="chip" @click="filter='missing_identifier'"><b>{{data.summary.missing_identifier}}</b><span>Missing GTIN / MPN</span></button>
        <button class="chip" @click="filter='missing_image'"><b>{{data.summary.missing_image}}</b><span>Missing Image</span></button>
        <button class="chip" @click="filter='missing_shipping_weight'"><b>{{data.summary.missing_shipping_weight}}</b><span>Missing Shipping Weight</span></button>
      </div>
      <section class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div class="p-4 border-b flex flex-col gap-3 lg:flex-row">
          <input v-model="search" class="input flex-1" placeholder="Search product, SKU or brand…"/>
          <select v-model="status" class="input lg:max-w-[200px]"><option value="all">All statuses</option><option value="ready">Ready</option><option value="attention">Needs attention</option><option value="not_eligible">Not eligible</option></select>
          <select v-model="filter" class="input lg:max-w-[220px]"><option value="all">All issues</option><option value="missing_brand">Missing brand</option><option value="missing_identifier">Missing GTIN / MPN</option><option value="missing_image">Missing image</option><option value="missing_shipping_weight">Missing shipping weight</option><option value="invalid_price">Invalid price</option><option value="missing_description">Missing description</option></select>
        </div>
        <div class="overflow-x-auto"><table class="w-full min-w-[950px] text-sm"><thead class="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th class="p-4">Product</th><th class="p-4">Feed Items</th><th class="p-4">Status</th><th class="p-4">Issues</th><th class="p-4"></th></tr></thead>
        <tbody><tr v-for="p in rows" :key="p.id" class="border-t align-top"><td class="p-4"><b>{{p.name}}</b><div class="text-xs text-slate-500 mt-1">SKU: {{p.product_code||"Missing"}} · {{p.brand||"No brand"}}</div></td>
        <td class="p-4 font-bold">{{p.item_count}}{{p.item_count>1?" variants/items":""}}</td><td class="p-4"><span :class="badge(p.status)">{{label(p.status)}}</span></td>
        <td class="p-4"><div class="flex flex-wrap gap-1.5"><span v-if="!p.issues.length" class="text-green-700 font-bold">✓ Ready for feed</span><span v-for="(i,n) in uniqueIssues(p.issues)" :key="n" :class="i.severity==='error'?'issue-error':'issue-warn'">{{i.label}}</span></div></td>
        <td class="p-4"><NuxtLink :to="`/admin/products/${p.id}`" class="font-bold text-blue-600">Fix Product →</NuxtLink></td></tr>
        <tr v-if="!rows.length"><td colspan="5" class="p-10 text-center text-slate-500">No products match these filters.</td></tr></tbody></table></div>
      </section>
      <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><b>Feed URL:</b> {{data.feed_url}}<br><span class="text-blue-700">Submit this URL as a scheduled product data source in Google Merchant Center. Public Standard pricing is used; staff/business customer pricing is not exported.</span></div>
    </template>
  </div>
</template>
<script setup lang="ts">
definePageMeta({layout:"admin",middleware:["admin"]});
const {adminFetch}=useAdminFetch(); const data=ref<any>(null),error=ref(""),search=ref(""),status=ref("all"),filter=ref("all");
async function load(){
  error.value="";
  try{ data.value=await adminFetch("/api/admin/google-shopping") }
  catch(e:any){
    console.error("GOOGLE SHOPPING LOAD ERROR:",e);
    error.value=e?.data?.statusMessage||e?.data?.message||e?.statusMessage||e?.message||"Unable to load Google Shopping health.";
  }
}
onMounted(load);
const rows=computed(()=>{const q=search.value.toLowerCase().trim();return (data.value?.products||[]).filter((p:any)=>(status.value==="all"||p.status===status.value)&&(filter.value==="all"||p.issues.some((i:any)=>i.key===filter.value))&&(!q||`${p.name} ${p.product_code||""} ${p.brand||""}`.toLowerCase().includes(q)))});
const uniqueIssues=(issues:any[])=>Array.from(new Map(issues.map(i=>[i.key,i])).values());
const label=(s:string)=>s==="ready"?"Ready":s==="attention"?"Needs Attention":"Not Eligible";
const badge=(s:string)=>["rounded-full px-2.5 py-1 text-xs font-black",s==="ready"?"bg-green-100 text-green-700":s==="attention"?"bg-amber-100 text-amber-800":"bg-red-100 text-red-700"];
const Stat=defineComponent({props:{label:String,value:[String,Number]},setup(p){return()=>h("div",{class:"rounded-2xl border border-slate-200 bg-white p-5"},[h("div",{class:"text-3xl font-black"},String(p.value??0)),h("div",{class:"mt-1 text-sm font-bold text-slate-500"},p.label)])}});
</script>
<style scoped>.chip{display:flex;align-items:center;gap:.8rem;border:1px solid #e2e8f0;border-radius:1rem;background:white;padding:1rem;text-align:left}.chip b{font-size:1.5rem}.chip span{font-size:.8rem;font-weight:800;color:#64748b}.issue-error,.issue-warn{border-radius:.4rem;padding:.25rem .5rem;font-size:.75rem;font-weight:700}.issue-error{background:#fef2f2;color:#b91c1c}.issue-warn{background:#fffbeb;color:#92400e}</style>
