<template>
  <main class="mx-auto max-w-7xl px-4 py-7">
    <NuxtLink to="/admin/products/import-supplier-url" class="text-sm font-semibold text-blue-700">← Supplier Import</NuxtLink>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
      <div><h1 class="text-3xl font-black text-slate-950">Compuworld — Category Review</h1>
        <p class="mt-1 text-slate-600">Fetch the reseller price list directly. Review supplier categories and choose your shop categories before importing.</p></div>
      <button class="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50" :disabled="loading" @click="load">{{loading?'Fetching…':'Fetch Compuworld Price List'}}</button>
    </div>
    <p v-if="error" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{error}}</p>
    <section v-if="result" class="mt-6 rounded-xl border bg-white p-5">
      <p class="font-bold">{{result.total}} supplier products found <span v-if="result.truncated" class="text-amber-700">(first 500 shown for review)</span></p>
      <p class="mt-1 text-sm text-slate-500">Read-only preview. No product, category or price changes have been saved.</p>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <label class="text-sm font-semibold">Supplier category column
          <select v-model="categoryColumn" class="mt-1 w-full rounded-lg border p-2">
            <option value="">No category column</option><option v-for="h in result.headers" :key="h" :value="h">{{h}}</option>
          </select>
        </label>
        <label class="text-sm font-semibold">Product description column
          <select v-model="nameColumn" class="mt-1 w-full rounded-lg border p-2">
            <option value="">Choose column</option><option v-for="h in result.headers" :key="h" :value="h">{{h}}</option>
          </select>
        </label>
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <label class="text-sm font-semibold">Apply shop category to all visible products</label>
        <select v-model="bulkCategory" class="rounded-lg border p-2 text-sm"><option value="">Select category…</option><option v-for="c in categories" :key="c.id" :value="String(c.id)">{{c.name}}</option></select>
        <button class="rounded-lg border px-3 py-2 text-sm font-semibold" :disabled="!bulkCategory" @click="applyBulk">Apply to all</button>
      </div>
      <div class="mt-5 overflow-x-auto"><table class="min-w-full text-left text-sm">
        <thead class="bg-slate-100"><tr><th class="p-3">Product</th><th class="p-3">Supplier category</th><th class="p-3">Category action</th><th class="p-3">Kialla category</th></tr></thead>
        <tbody><tr v-for="(r,i) in result.rows" :key="i" class="border-b">
          <td class="max-w-80 p-3">{{r[nameColumn]||Object.values(r)[0]||'—'}}</td>
          <td class="p-3">{{r[categoryColumn]||'Not provided'}}</td>
          <td class="p-3"><select v-model="actions[i]" class="rounded border p-2">
            <option value="supplier">Use supplier category</option><option value="shop">Choose shop category</option>
          </select></td>
          <td class="p-3"><select v-model="selectedCategories[i]" class="rounded border p-2" :disabled="actions[i]!=='shop'">
            <option value="">Select category…</option><option v-for="c in categories" :key="c.id" :value="String(c.id)">{{c.name}}</option>
          </select></td>
        </tr></tbody>
      </table></div>
      <p class="mt-4 text-sm text-amber-800">Supplier categories that do not match your shop categories will need mapping before import. Existing product categories will be preserved by default.</p>
    </section>
  </main>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']});
const {adminFetch}=useAdminFetch();
const result=ref<{headers:string[];rows:Record<string,string>[];total:number;truncated:boolean}|null>(null);
const categories=ref<{id:number;name:string}[]>([]);
const loading=ref(false),error=ref(''),categoryColumn=ref(''),nameColumn=ref(''),bulkCategory=ref('');
const actions=ref<string[]>([]),selectedCategories=ref<string[]>([]);
function guess(headers:string[], keys:string[]){return headers.find(h=>keys.some(k=>h.toLowerCase().includes(k)))||''}
function applyBulk(){if(!result.value)return;result.value.rows.forEach((_,i)=>{actions.value[i]='shop';selectedCategories.value[i]=bulkCategory.value})}
async function load(){
  loading.value=true;error.value='';
  try{
    const [data,cats]=await Promise.all([adminFetch('/api/admin/products/compuworld/preview'),adminFetch('/api/admin/categories')]);
    result.value=data;categories.value=cats.filter((c:any)=>c.active!==false);
    categoryColumn.value=guess(data.headers,['category','group','department']);
    nameColumn.value=guess(data.headers,['description','product name','name']);
    actions.value=data.rows.map(()=>'supplier');selectedCategories.value=data.rows.map(()=>'');
  }catch(e:any){error.value=e?.data?.statusMessage||e.message||'Unable to fetch Compuworld price list'}
  finally{loading.value=false}
}
</script>
