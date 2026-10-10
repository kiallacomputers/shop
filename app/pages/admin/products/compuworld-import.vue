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
      <p class="font-bold">{{result.total}} products available from Compuworld <span v-if="result.truncated" class="text-amber-700">(first 500 loaded)</span></p>
      <p class="mt-1 text-sm text-slate-600">Select supplier categories first. Only products in your selected categories will be shown for review. Nothing is imported automatically.</p>
      <label class="mt-4 block text-sm font-semibold">Supplier category column
        <select v-model="categoryColumn" class="mt-1 block w-full max-w-md rounded-lg border p-2">
          <option value="">Choose column…</option><option v-for="h in result.headers" :key="h" :value="h">{{h}}</option>
        </select>
      </label>
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <label v-for="field in identityFields" :key="field.key" class="text-sm font-semibold">{{field.label}}
          <select v-model="identityColumns[field.key]" class="mt-1 block w-full rounded-lg border p-2">
            <option value="">Not available</option><option v-for="h in result.headers" :key="h" :value="h">{{h}}</option>
          </select>
        </label>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="checking" @click="checkExisting">{{checking?'Checking…':'Check Existing Shop Products'}}</button>
        <label class="text-sm font-semibold">Show products
          <select v-model="productFilter" class="ml-2 rounded-lg border p-2">
            <option value="new">New Products Only (default)</option>
            <option value="all">All Products</option>
            <option value="existing">Existing Products</option>
            <option value="review">Needs Review</option>
          </select>
        </label>
        <span v-if="matches.length" class="text-xs text-slate-500">Matched against current shop products and variations</span>
      </div>
      <div v-if="categoryColumn" class="mt-5 rounded-lg border border-slate-200 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-black">1. Select Compuworld categories</h2>
          <span class="text-sm font-semibold text-blue-700">{{selectedSupplierCategories.length}} categories selected</span>
        </div>
        <input v-model="categorySearch" type="search" placeholder="Search supplier categories…" class="mt-3 w-full rounded-lg border p-2" />
        <div class="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          <label v-for="item in filteredSupplierCategories" :key="item.name" class="flex items-center gap-2 rounded-lg border p-2 text-sm">
            <input v-model="selectedSupplierCategories" type="checkbox" :value="item.name" />
            <span class="flex-1">{{item.name}}</span><span class="text-xs text-slate-500">{{item.count}}</span>
          </label>
        </div>
      </div>
      <div v-if="selectedSupplierCategories.length" class="mt-5">
        <h2 class="font-black">2. Select products to review</h2>
        <p class="mt-1 text-sm text-slate-600">{{selectedProductIndices.length}} of {{eligibleProducts.length}} displayed products selected in the chosen categories.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button class="rounded-lg border px-3 py-2 text-sm font-semibold" @click="selectAllEligible">Select all in chosen categories</button>
          <button class="rounded-lg border px-3 py-2 text-sm font-semibold" @click="selectedProductIndices=[]">Clear product selection</button>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="text-sm font-semibold">Product description column
            <select v-model="nameColumn" class="mt-1 block w-full rounded-lg border p-2">
              <option value="">Choose column…</option><option v-for="h in result.headers" :key="h" :value="h">{{h}}</option>
            </select>
          </label>
          <label class="text-sm font-semibold">Set category for selected products
            <select v-model="bulkCategory" class="mt-1 block w-full rounded-lg border p-2">
              <option value="">Choose shop category…</option><option v-for="c in categories" :key="c.id" :value="String(c.id)">{{c.name}}</option>
            </select>
          </label>
        </div>
        <button class="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40" :disabled="!bulkCategory||!selectedProductIndices.length" @click="applyBulk">Apply shop category to selected products</button>
        <div class="mt-4 max-h-[550px] overflow-auto rounded-lg border">
          <table class="min-w-full text-left text-sm">
            <thead class="sticky top-0 bg-slate-100"><tr><th class="p-3">Select</th><th class="p-3">Product</th><th class="p-3">Status</th><th class="p-3">Supplier category</th><th class="p-3">Category action</th><th class="p-3">Kialla category</th></tr></thead>
            <tbody><tr v-for="item in eligibleProducts" :key="item.index" class="border-b">
              <td class="p-3"><input v-model="selectedProductIndices" type="checkbox" :value="item.index" /></td>
              <td class="max-w-80 p-3">{{item.row[nameColumn]||Object.values(item.row)[0]||'—'}}</td>
              <td class="p-3"><span class="font-semibold">{{statusLabel(item.index)}}</span><span v-if="matches[item.index]?.name" class="block text-xs text-slate-500">{{matches[item.index].name}}</span></td>\n              <td class="p-3">{{item.row[categoryColumn]||'Uncategorised'}}</td>
              <td class="p-3"><select v-model="actions[item.index]" class="rounded border p-2">
                <option value="supplier">Use supplier category</option><option value="shop">Choose shop category</option>
              </select></td>
              <td class="p-3"><select v-model="selectedCategories[item.index]" class="rounded border p-2" :disabled="actions[item.index]!=='shop'">
                <option value="">Choose category…</option><option v-for="c in categories" :key="c.id" :value="String(c.id)">{{c.name}}</option>
              </select></td>
            </tr></tbody>
          </table>
        </div>
      </div>
      <p class="mt-4 text-sm text-amber-800">Preview only: importing and saving mappings are not enabled yet. Only explicitly selected products will be eligible for the future import action. Supplier categories must be mapped to shop categories before creating products.</p>
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
const identityFields=[{key:'sku',label:'Supplier SKU column'},{key:'mpn',label:'Manufacturer part number column'},{key:'gtin',label:'Barcode / GTIN column'}];
const identityColumns=reactive<Record<string,string>>({sku:'',mpn:'',gtin:''});
const productFilter=ref('new'),checking=ref(false);
const matches=ref<{status:string;reason:string;name?:string}[]>([]);
function statusLabel(i:number){return matches.value[i]?.status==='new'?'New':matches.value[i]?.status==='existing'?'Existing': 'Needs Review'}
async function checkExisting(){
 if(!result.value)return;
 checking.value=true;error.value='';
 try{
   const items=result.value.rows.map(row=>({sku:row[identityColumns.sku]||'',mpn:row[identityColumns.mpn]||'',gtin:row[identityColumns.gtin]||''}));
   const response=await adminFetch('/api/admin/products/compuworld/match',{method:'POST',body:{items}});
   matches.value=response.matches;
   selectedProductIndices.value=[];
 }catch(e:any){error.value=e?.data?.statusMessage||e.message||'Could not compare products'}
 finally{checking.value=false}
}
watch(identityColumns,()=>{matches.value=[];selectedProductIndices.value=[]},{deep:true});

const selectedSupplierCategories=ref<string[]>([]),selectedProductIndices=ref<number[]>([]),categorySearch=ref('');
const supplierCategories=computed(()=>{
  const counts=new Map<string,number>();
  for(const row of result.value?.rows||[]){const name=row[categoryColumn.value]?.trim()||'Uncategorised';counts.set(name,(counts.get(name)||0)+1)}
  return [...counts].map(([name,count])=>({name,count})).sort((a,b)=>a.name.localeCompare(b.name));
});
const filteredSupplierCategories=computed(()=>supplierCategories.value.filter(c=>c.name.toLowerCase().includes(categorySearch.value.toLowerCase())));
const eligibleProducts=computed(()=> (result.value?.rows||[]).map((row,index)=>({row,index})).filter(x=>{
  if(!selectedSupplierCategories.value.includes(x.row[categoryColumn.value]?.trim()||'Uncategorised'))return false;
  const status=matches.value[x.index]?.status||'review';
  return productFilter.value==='all'||status===productFilter.value;
}));
function selectAllEligible(){selectedProductIndices.value=eligibleProducts.value.map(x=>x.index)}
watch(categoryColumn,()=>{selectedSupplierCategories.value=[];selectedProductIndices.value=[]});
watch(selectedSupplierCategories,()=>{const allowed=new Set(eligibleProducts.value.map(x=>x.index));selectedProductIndices.value=selectedProductIndices.value.filter(i=>allowed.has(i))},{deep:true});

function guess(headers:string[], keys:string[]){return headers.find(h=>keys.some(k=>h.toLowerCase().includes(k)))||''}
function applyBulk(){if(!result.value)return;selectedProductIndices.value.forEach(i=>{actions.value[i]='shop';selectedCategories.value[i]=bulkCategory.value})}
async function load(){
  loading.value=true;error.value='';
  try{
    const [data,cats]=await Promise.all([adminFetch('/api/admin/products/compuworld/preview'),adminFetch('/api/admin/categories')]);
    result.value=data;categories.value=cats.filter((c:any)=>c.active!==false);
    categoryColumn.value=guess(data.headers,['category','group','department']);
    nameColumn.value=guess(data.headers,['description','product name','name']);
    actions.value=data.rows.map(()=>'supplier');selectedCategories.value=data.rows.map(()=>'');
    selectedSupplierCategories.value=[];selectedProductIndices.value=[];matches.value=[];productFilter.value='new';
    identityColumns.sku=guess(data.headers,['supplier sku','sku','item code','product code','stock code']);
    identityColumns.mpn=guess(data.headers,['manufacturer part','mpn','mfr part']);
    identityColumns.gtin=guess(data.headers,['barcode','gtin','ean','upc']);\n    await checkExisting();
  }catch(e:any){error.value=e?.data?.statusMessage||e.message||'Unable to fetch Compuworld price list'}
  finally{loading.value=false}
}
</script>
