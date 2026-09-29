<template>
<div class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div><p class="text-xs font-black uppercase tracking-wider text-blue-600">Marketing</p><h1 class="mt-1 text-3xl font-black">Google Performance</h1>
      <p class="mt-1 text-slate-500">Free-listing visibility and clicks from Google Merchant Center.</p></div>
    <div class="flex gap-2"><select v-model="days" class="input" @change="load"><option :value="7">Last 7 days</option><option :value="28">Last 28 days</option><option :value="30">Last 30 days</option><option :value="90">Last 90 days</option></select><button class="btn-secondary" @click="load">Refresh</button></div>
  </div>
  <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{{error}}</div>
  <div v-if="loading" class="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading Google performance…</div>
  <template v-else-if="data">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card label="Impressions" :value="num(data.summary.impressions)"/>
      <Card label="Clicks" :value="num(data.summary.clicks)"/>
      <Card label="CTR" :value="`${Number(data.summary.ctr||0).toFixed(2)}%`"/>
      <Card label="Products Seen" :value="num(data.summary.products_with_impressions)"/>
    </div>
    <section class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div class="border-b p-4 flex flex-wrap gap-3 items-center justify-between"><div><h2 class="font-black text-lg">Product Performance</h2><p class="text-xs text-slate-500">{{data.start_date}} to {{data.end_date}}</p></div><input v-model="search" class="input w-full sm:w-72" placeholder="Search product or offer ID…"/></div>
      <div class="overflow-x-auto"><table class="w-full min-w-[760px] text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-4 text-left">Product</th><th class="p-4 text-right">Impressions</th><th class="p-4 text-right">Clicks</th><th class="p-4 text-right">CTR</th></tr></thead>
      <tbody><tr v-for="p in rows" :key="p.offer_id" class="border-t"><td class="p-4"><div class="font-bold">{{p.title}}</div><div class="text-xs text-slate-500">ID: {{p.offer_id}}</div></td><td class="p-4 text-right font-bold">{{num(p.impressions)}}</td><td class="p-4 text-right font-bold">{{num(p.clicks)}}</td><td class="p-4 text-right font-bold">{{Number(p.ctr||0).toFixed(2)}}%</td></tr>
      <tr v-if="!rows.length"><td colspan="4" class="p-10 text-center text-slate-500">No Google performance data yet for this period.</td></tr></tbody></table></div>
    </section>
    <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><b>How to read this:</b> high impressions with low CTR can point to a title, image, price or search-intent opportunity. Products with little or no data may simply need more time before drawing conclusions.</div>
  </template>
</div>
</template>
<script setup lang="ts">
definePageMeta({layout:"admin",middleware:["admin"]});
const {adminFetch}=useAdminFetch();const data=ref<any>(null),error=ref(""),loading=ref(false),days=ref(28),search=ref("");
async function load(){
  loading.value=true; error.value="";
  try{
    data.value=await adminFetch(`/api/admin/google-performance?days=${days.value}`);
  }catch(e:any){
    console.error("GOOGLE PERFORMANCE LOAD ERROR:",e);
    error.value=
      e?.data?.statusMessage ||
      e?.data?.message ||
      e?.statusMessage ||
      e?.message ||
      "Unable to load Google performance.";
  }finally{
    loading.value=false;
  }
}
onMounted(load);
const rows=computed(()=>{const q=search.value.toLowerCase().trim();return (data.value?.products||[]).filter((p:any)=>!q||`${p.title} ${p.offer_id}`.toLowerCase().includes(q))});
const num=(v:any)=>Number(v||0).toLocaleString("en-AU");
const Card=defineComponent({props:{label:String,value:[String,Number]},setup(p){return()=>h("div",{class:"rounded-2xl border border-slate-200 bg-white p-5"},[h("div",{class:"text-3xl font-black"},String(p.value??0)),h("div",{class:"mt-1 text-sm font-bold text-slate-500"},p.label)])}});
</script>
