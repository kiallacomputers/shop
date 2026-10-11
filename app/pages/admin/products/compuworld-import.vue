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
      <p class="font-bold">{{result.total}} products available from Compuworld <span v-if="result.truncated" class="text-amber-700">(more products available)</span></p>
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
            <option value="existing">Already in Shop (including Leader)</option>
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
      <div v-if="selectedSupplierCategories.length" class="mt-4 flex flex-wrap items-center gap-3">
        <button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" :disabled="loading" @click="loadCategoryProducts(0)">Load Products in Selected Categories</button>
        <span class="text-sm text-slate-600">{{result.matchedTotal}} matching products · {{result.rows.length}} loaded</span>
      </div>
      <div v-if="selectedSupplierCategories.length && result.rows.length" class="mt-5">
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
        <section class="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 class="font-black text-slate-900">3. Product images</h3>
          <p class="mt-1 text-sm text-slate-600">Find images for selected products from Compuworld image URLs, then approve each image before saving it to Supabase. Missing images can be uploaded manually.</p>
          <label class="mt-3 block text-sm font-semibold">Supplier image URL column
            <select v-model="imageColumn" class="mt-1 block w-full max-w-lg rounded-lg border p-2">
              <option value="">No image URL column found</option><option v-for="h in result.headers" :key="h" :value="h">{{h}}</option>
            </select>
          </label>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white" :disabled="!selectedProductIndices.length" @click="findImages">Find Images for Selected Products</button>
            <span class="text-xs text-slate-600">{{imageCandidatesCount}} supplier images found; {{savedImagesCount}} saved to Supabase</span>
          </div>
        </section>
        <div class="mt-4 max-h-[550px] overflow-auto rounded-lg border">
          <table class="min-w-full text-left text-sm">
            <thead class="sticky top-0 bg-slate-100"><tr><th class="p-3">Select</th><th class="p-3">Product</th><th class="p-3">Status</th><th class="p-3">Supplier category</th><th class="p-3">Category action</th><th class="p-3">Kialla category</th><th class="p-3">Product image</th></tr></thead>
            <tbody><tr v-for="item in eligibleProducts" :key="item.index" class="border-b">
              <td class="p-3"><input v-model="selectedProductIndices" type="checkbox" :value="item.index" /></td>
              <td class="max-w-80 p-3">{{item.row[nameColumn]||Object.values(item.row)[0]||'—'}}</td>
              <td class="p-3"><span class="font-semibold">{{statusLabel(item.index)}}</span><NuxtLink v-if="matches[item.index]?.productId" :to="`/admin/products/${matches[item.index].productId}`" class="block text-xs font-semibold text-blue-700 hover:underline">{{matches[item.index].name}} ↗</NuxtLink>
                <span v-if="matches[item.index]?.supplierNames?.length" class="block text-xs text-slate-600">Suppliers: {{matches[item.index].supplierNames.join(', ')}}</span>
                <span v-if="matches[item.index]?.leaderBuyPrice!=null" class="block text-xs text-slate-600">Leader buy: {{new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(matches[item.index].leaderBuyPrice!)}} ex GST</span>
                <span v-if="matches[item.index]?.status==='review'" class="block text-xs text-amber-700">{{matches[item.index].reason}}</span></td>
              <td class="p-3">{{item.row[categoryColumn]||'Uncategorised'}}</td>
              <td class="p-3"><select v-model="actions[item.index]" class="rounded border p-2">
                <option value="supplier">Use supplier category</option><option value="shop">Choose shop category</option>
              </select></td>
              <td class="p-3"><select v-model="selectedCategories[item.index]" class="rounded border p-2" :disabled="actions[item.index]!=='shop'">
                <option value="">Choose category…</option><option v-for="c in categories" :key="c.id" :value="String(c.id)">{{c.name}}</option>
              </select></td>
              <td class="min-w-56 p-3">
                <template v-if="selectedProductIndices.includes(item.index)">
                  <img v-if="savedImages[item.index]||imageCandidates[item.index]" :src="savedImages[item.index]||imageCandidates[item.index]" alt="Supplier product image preview" class="mb-2 h-24 w-24 rounded border bg-white object-contain" referrerpolicy="no-referrer" />
                  <p v-else class="text-xs text-amber-700">Image required</p>
                  <div class="flex flex-col gap-2">
                    <button v-if="imageCandidates[item.index]&&!savedImages[item.index]" class="rounded bg-blue-700 px-2 py-1 text-xs font-bold text-white disabled:opacity-50" :disabled="imageBusy[item.index]" @click="approveImage(item.index)">{{imageBusy[item.index]?'Saving…':'Approve & Save Image'}}</button>
                    <div class="mt-2 rounded-lg border border-slate-200 p-2">
                      <p class="text-xs font-semibold">Official manufacturer images</p>
                      <a :href="manufacturerSearchUrl(item.index)" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-700 underline">Find manufacturer product page by part number ↗</a>
                      <input v-model.trim="manufacturerUrls[item.index]" type="url" placeholder="Paste official manufacturer product URL" class="mt-2 w-full rounded border p-2 text-xs" />
                      <button class="mt-2 rounded bg-slate-800 px-2 py-1 text-xs font-bold text-white disabled:opacity-50" :disabled="imageBusy[item.index]||!manufacturerUrls[item.index]" @click="findManufacturerImages(item.index)">Fetch Manufacturer Images</button>
                      <div v-if="manufacturerImages[item.index]?.length" class="mt-2 flex flex-wrap gap-2">
                        <div v-for="(candidate,k) in manufacturerImages[item.index]" :key="candidate" class="w-28 rounded border p-1">
                          <img :src="candidate" alt="Manufacturer candidate" referrerpolicy="no-referrer" class="h-20 w-full object-contain" />
                          <button class="mt-1 w-full rounded bg-blue-700 px-1 py-1 text-xs text-white disabled:opacity-50" :disabled="imageBusy[item.index]" @click="saveManufacturerImage(item.index,candidate)">Approve image</button>
                        </div>
                      </div>
                    </div>
                    <label class="cursor-pointer text-xs font-semibold text-blue-700">Upload image manually
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="mt-1 block w-48 text-xs" :disabled="imageBusy[item.index]" @change="uploadImage($event,item.index)" />
                    </label>
                    <span v-if="savedImages[item.index]" class="text-xs font-semibold text-emerald-700">Saved to Supabase (not linked to a product yet)</span>
                    <span v-if="imageErrors[item.index]" class="text-xs text-red-700">{{imageErrors[item.index]}}</span>
                  </div>
                </template><span v-else class="text-xs text-slate-500">Select product first</span>
              </td>
            </tr></tbody>
          </table>
        </div>
      </div>
      <div v-if="selectedSupplierCategories.length && result.truncated" class="mt-4 flex items-center gap-3">
        <button class="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50" :disabled="loading" @click="loadCategoryProducts(result.offset+result.rows.length)">Next 500 products →</button>
        <span class="text-sm text-slate-500">Showing {{result.offset+1}}–{{result.offset+result.rows.length}} of {{result.matchedTotal}} in selected categories</span>
      </div>
      <p class="mt-4 text-sm text-amber-800">Product import and image-to-product linking are not enabled yet. Saved images remain in Supabase, but the current selection is not persisted across page reloads. Only explicitly selected products will be eligible for the future import action. Supplier categories must be mapped to shop categories before creating products.</p>
    </section>
  </main>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']});
const {adminFetch}=useAdminFetch();
const result=ref<{headers:string[];rows:Record<string,string>[];total:number;matchedTotal:number;categoryCounts:Record<string,number>;offset:number;limit:number;truncated:boolean}|null>(null);
const categories=ref<{id:number;name:string}[]>([]);
const loading=ref(false),error=ref(''),categoryColumn=ref(''),nameColumn=ref(''),bulkCategory=ref('');
const actions=ref<string[]>([]),selectedCategories=ref<string[]>([]);
const identityFields=[{key:'sku',label:'Supplier SKU column'},{key:'mpn',label:'Manufacturer part number column'},{key:'gtin',label:'Barcode / GTIN column'}];
const identityColumns=reactive<Record<string,string>>({sku:'',mpn:'',gtin:''});
const productFilter=ref('new'),checking=ref(false);
const manufacturerUrls=reactive<Record<number,string>>({});
const manufacturerImages=reactive<Record<number,string[]>>({});
function manufacturerSearchUrl(i:number){
 const row=result.value?.rows[i]||{};
 const mpn=row[identityColumns.mpn]||row[identityColumns.sku]||'';
 return 'https://www.google.com/search?q='+encodeURIComponent(mpn+' official manufacturer product images');
}
async function findManufacturerImages(i:number){
 imageBusy[i]=true;imageErrors[i]='';manufacturerImages[i]=[];
 try{
  const response=await adminFetch('/api/admin/products/import-url/vendor',{method:'POST',body:{url:manufacturerUrls[i]}});
  manufacturerImages[i]=Array.isArray(response.images)?response.images.filter((x:unknown)=>typeof x==='string'&&x.startsWith('https://')).slice(0,12):[];
  if(!manufacturerImages[i].length)imageErrors[i]='No images detected on this manufacturer page.';
 }catch(e:any){imageErrors[i]=e?.data?.statusMessage||e.message||'Could not fetch manufacturer images'}
 finally{imageBusy[i]=false}
}
async function saveManufacturerImage(i:number,url:string){
 imageBusy[i]=true;imageErrors[i]='';
 try{
  const row=result.value?.rows[i]||{};
  const sku=row[identityColumns.sku]||row[identityColumns.mpn]||`row-${i}`;
  const response=await adminFetch('/api/admin/products/compuworld/save-manufacturer-image',{method:'POST',body:{url,sourceUrl:manufacturerUrls[i],sku}});
  savedImages[i]=response.url;
 }catch(e:any){imageErrors[i]=e?.data?.statusMessage||e.message||'Could not save manufacturer image'}
 finally{imageBusy[i]=false}
}
const imageColumn=ref('');
const imageCandidates=reactive<Record<number,string>>({});
const savedImages=reactive<Record<number,string>>({});
const imageErrors=reactive<Record<number,string>>({});
const imageBusy=reactive<Record<number,boolean>>({});
const imageCandidatesCount=computed(()=>selectedProductIndices.value.filter(i=>!!imageCandidates[i]).length);
const savedImagesCount=computed(()=>selectedProductIndices.value.filter(i=>!!savedImages[i]).length);
function findImages(){
  if(!result.value)return;
  for(const i of selectedProductIndices.value){
    imageErrors[i]='';
    const raw=String(result.value.rows[i]?.[imageColumn.value]||'').trim();
    try{
      const u=new URL(raw);
      imageCandidates[i]=u.protocol==='https:'&&['www.compuworld.com.au','compuworld.com.au'].includes(u.hostname)&&!u.port&&!u.username&&!u.password?u.toString():'';
      if(raw&&!imageCandidates[i])imageErrors[i]='Image URL is not hosted on Compuworld; use manual upload.';
    }catch{imageCandidates[i]=''}
  }
}
async function approveImage(i:number){
  if(!imageCandidates[i]||!result.value)return;
  imageBusy[i]=true;imageErrors[i]='';
  try{
    const sku=result.value.rows[i]?.[identityColumns.sku]||String(i);
    const response=await adminFetch('/api/admin/products/compuworld/save-image',{method:'POST',body:{url:imageCandidates[i],sku}});
    savedImages[i]=response.url;
  }catch(e:any){imageErrors[i]=e?.data?.statusMessage||e.message||'Could not save supplier image'}
  finally{imageBusy[i]=false}
}
async function uploadImage(event:Event,i:number){
  const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;
  imageBusy[i]=true;imageErrors[i]='';
  try{
    const data=new FormData();data.append('file',file);
    const response=await adminFetch('/api/admin/products/upload-image',{method:'POST',body:data});
    savedImages[i]=response.url;
  }catch(e:any){imageErrors[i]=e?.data?.statusMessage||e.message||'Could not upload image'}
  finally{imageBusy[i]=false}
}

const matches=ref<{status:string;reason:string;name?:string;productId?:number;variantId?:number|null;supplierNames?:string[];leaderBuyPrice?:number|null;alreadyLinkedCompuworld?:boolean;active?:boolean}[]>([]);
function statusLabel(i:number){const m=matches.value[i];return m?.status==='new'?'New':m?.status==='existing'?(m.alreadyLinkedCompuworld?'Already linked to Compuworld':m.supplierNames?.some(x=>/leader/i.test(x))?'Already in shop — Leader':'Already in shop'):'Needs Review'}
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
  for(const [name,count] of Object.entries(result.value?.categoryCounts||{})){counts.set(name,count)}
  return [...counts].map(([name,count])=>({name,count})).sort((a,b)=>a.name.localeCompare(b.name));
});
const filteredSupplierCategories=computed(()=>supplierCategories.value.filter(c=>c.name.toLowerCase().includes(categorySearch.value.toLowerCase())));
const eligibleProducts=computed(()=> (result.value?.rows||[]).map((row,index)=>({row,index})).filter(x=>{
  if(!selectedSupplierCategories.value.includes(x.row[categoryColumn.value]?.trim()||'Uncategorised'))return false;
  const status=matches.value[x.index]?.status||'review';
  return productFilter.value==='all'||status===productFilter.value;
}));
function selectAllEligible(){selectedProductIndices.value=eligibleProducts.value.map(x=>x.index)}
watch(categoryColumn,async()=>{
  selectedSupplierCategories.value=[];selectedProductIndices.value=[];
  if(!result.value || !categoryColumn.value)return;
  try{ const data=await adminFetch('/api/admin/products/compuworld/preview',{query:{categoryColumn:categoryColumn.value}}); result.value=data;matches.value=[]; }
  catch(e:any){error.value=e?.data?.statusMessage||e.message||'Could not load supplier categories'}
});
watch(selectedSupplierCategories,()=>{selectedProductIndices.value=[];matches.value=[];if(result.value)result.value={...result.value,rows:[],matchedTotal:0,truncated:false}},{deep:true});
async function loadCategoryProducts(offset:number){
 if(!result.value||!categoryColumn.value||!selectedSupplierCategories.value.length)return;
 loading.value=true;error.value='';
 try{
  const data=await adminFetch('/api/admin/products/compuworld/preview',{query:{categoryColumn:categoryColumn.value,categories:selectedSupplierCategories.value.join('|'),offset}});
  result.value=data;selectedProductIndices.value=[];matches.value=[];
  await checkExisting();
 }catch(e:any){error.value=e?.data?.statusMessage||e.message||'Could not load products in selected categories'}
 finally{loading.value=false}
}

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
    identityColumns.gtin=guess(data.headers,['barcode','gtin','ean','upc']);
    imageColumn.value=guess(data.headers,['image url','imageurl','image link','image']);
    for(const key of Object.keys(imageCandidates))delete imageCandidates[Number(key)];
    for(const key of Object.keys(savedImages))delete savedImages[Number(key)];
    if(!categoryColumn.value)await checkExisting();
  }catch(e:any){error.value=e?.data?.statusMessage||e.message||'Unable to fetch Compuworld price list'}
  finally{loading.value=false}
}
</script>
