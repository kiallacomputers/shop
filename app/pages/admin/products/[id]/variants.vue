<template>
  <main class="max-w-6xl mx-auto px-4 py-8">
    <div class="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <NuxtLink :to="`/admin/products/${productId}`" class="text-sm font-semibold text-blue-600">← Edit Product</NuxtLink>
        <h1 class="mt-3 text-3xl font-bold text-slate-900">Product Variants</h1>
        <p class="mt-1 text-slate-500">Variants inherit the base product Sell Price and RRP unless you enter an override. If the base price changes later, inherited variants update automatically.</p>
        <div v-if="baseProduct" class="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span class="rounded-full bg-slate-100 px-3 py-1.5">Base Sell: {{ money(baseProduct.price) }}</span>
          <span class="rounded-full bg-slate-100 px-3 py-1.5">Base RRP: {{ baseProduct.old_price == null ? 'Not set' : money(baseProduct.old_price) }}</span>
        </div>
      </div>
      <button class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white" @click="addVariant">+ Add Variant</button>
    </div>
    <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</div>
    <div v-if="loading" class="rounded-xl border bg-white p-10 text-center text-slate-500">Loading variants...</div>
    <div v-else class="space-y-4">
      <article v-for="variant in variants" :key="variant._key" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <label class="lg:col-span-2"><span class="label">Variant / Colour *</span><input v-model="variant.name" class="input" placeholder="Black" /></label>
          <label><span class="label">Product Code *</span><input v-model="variant.product_code" class="input uppercase" placeholder="KC-1001-BLK" /></label>
          <label>
            <span class="label">Sell Price Override</span>
            <input
              v-model="variant.price"
              type="number"
              min="0"
              step="0.01"
              class="input"
              :placeholder="baseProduct ? `Base: ${money(baseProduct.price)}` : 'Leave blank to use base price'"
            />
            <div class="mt-1 flex items-center gap-2 text-xs">
              <span v-if="variant.price === '' || variant.price == null" class="font-semibold text-emerald-600">Inheriting {{ money(baseProduct?.price) }}</span>
              <button v-else type="button" class="font-semibold text-blue-600 hover:underline" @click="variant.price = ''">Use base price</button>
            </div>
          </label>
          <label>
            <span class="label">RRP Override</span>
            <input
              v-model="variant.old_price"
              type="number"
              min="0"
              step="0.01"
              class="input"
              :placeholder="baseProduct?.old_price == null ? 'Base RRP not set' : `Base: ${money(baseProduct.old_price)}`"
            />
            <div class="mt-1 flex items-center gap-2 text-xs">
              <span v-if="variant.old_price === '' || variant.old_price == null" class="font-semibold text-emerald-600">
                {{ baseProduct?.old_price == null ? 'Inheriting no base RRP' : `Inheriting ${money(baseProduct.old_price)}` }}
              </span>
              <button v-else type="button" class="font-semibold text-blue-600 hover:underline" @click="variant.old_price = ''">Use base RRP</button>
            </div>
          </label>
          <label><span class="label">Stock *</span><input v-model="variant.stock" type="number" min="0" step="1" class="input" /></label>
        </div>
        <div class="mt-4 rounded-lg bg-slate-50 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div><p class="text-sm font-bold text-slate-800">Variant Images</p><p class="text-xs text-slate-500">Optional. If supplied, these replace the main product images when this option is selected.</p></div>
            <label class="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
              {{ variant.uploading ? 'Uploading...' : '+ Upload Images' }}
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" :disabled="variant.uploading" @change="uploadVariantImages($event, variant)" />
            </label>
          </div>
          <div v-if="variant.images?.length" class="mt-3 flex flex-wrap gap-3">
            <div v-for="(image,index) in variant.images" :key="image" class="relative h-20 w-20 overflow-hidden rounded-lg border bg-white">
              <img :src="image" class="h-full w-full object-contain p-1" />
              <button type="button" class="absolute right-1 top-1 h-5 w-5 rounded-full bg-red-600 text-xs font-bold text-white" @click="variant.images.splice(index,1)">×</button>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label class="flex items-center gap-2 text-sm font-semibold text-slate-700"><input v-model="variant.active" type="checkbox" /> Active</label>
          <div class="flex gap-2"><button class="rounded-lg border px-4 py-2 text-sm font-semibold" :disabled="variant.saving" @click="saveVariant(variant)">{{ variant.saving ? 'Saving...' : 'Save' }}</button><button class="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700" @click="removeVariant(variant)">Delete</button></div>
        </div>
      </article>
      <div v-if="!variants.length" class="rounded-xl border border-dashed p-10 text-center text-slate-500">No variants yet. Add one for each colour or option.</div>
    </div>
  </main>
</template>
<script setup lang="ts">
// Sibling route note: the product edit page lives at [id]/index.vue so this page renders at /admin/products/:id/variants.
definePageMeta({ middleware: 'admin' });
const route=useRoute(); const productId=String(route.params.id); const {adminFetch}=useAdminFetch();
const variants=ref<any[]>([]), baseProduct=ref<any>(null), loading=ref(true), errorMessage=ref('');

const numeric=(value:any)=>{const n=Number(value);return Number.isFinite(n)?n:0;};
const money=(value:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(numeric(value));

const fresh=()=>({
  _key:crypto.randomUUID(),
  id:null,
  name:'',
  product_code:'',
  // Blank price fields mean "inherit from base product".
  price:'',
  old_price:'',
  stock:'0',
  active:true,
  sort_order:variants.value.length,
  saving:false,
  uploading:false,
  images:[]
});

const load=async()=>{
  loading.value=true;
  errorMessage.value='';
  try{
    const [product,rows]:any[]=await Promise.all([
      adminFetch(`/api/admin/products/${productId}`),
      adminFetch(`/api/admin/products/${productId}/variants`)
    ]);
    baseProduct.value=product;
    variants.value=(rows||[]).map((v:any)=>({
      ...v,
      _key:String(v.id),
      price:v.price==null?'':String(v.price),
      old_price:v.old_price==null?'':String(v.old_price),
      stock:String(v.stock),
      images:Array.isArray(v.images)?v.images:[],
      saving:false,
      uploading:false
    }));
  }catch(e:any){
    errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to load variants';
  }finally{
    loading.value=false;
  }
};
const addVariant=()=>variants.value.push(fresh());
const resetAllToBase=async()=>{
  if(!variants.value.length)return;
  if(!confirm("Reset every variant to inherit the current base Sell Price and RRP? Variant-specific price overrides will be removed."))return;
  errorMessage.value="";
  try{
    for(const variant of variants.value){
      variant.price='';
      variant.old_price='';
      if(variant.id) await saveVariant(variant);
    }
  }catch(e:any){
    errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to reset variant prices';
  }
};
const uploadVariantImages=async(event:Event,v:any)=>{const input=event.target as HTMLInputElement;const files=Array.from(input.files||[]);if(!files.length)return;v.uploading=true;try{for(const file of files){const form=new FormData();form.append('file',file);const result:any=await adminFetch('/api/admin/products/upload-image',{method:'POST',body:form});v.images=v.images||[];v.images.push(result.url);}}catch(e:any){errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to upload variant image';}finally{v.uploading=false;input.value='';}};

const saveVariant=async(v:any)=>{
  errorMessage.value='';
  v.saving=true;
  try{
    // IMPORTANT: blank price fields mean "inherit from the base product".
    // Do not use Number('') here because JavaScript turns an empty string into 0.
    const body={
      name:v.name,
      product_code:v.product_code,
      price:v.price==null||String(v.price).trim()===''?null:Number(v.price),
      old_price:v.old_price==null||String(v.old_price).trim()===''?null:Number(v.old_price),
      stock:Number(v.stock),
      active:v.active,
      images:v.images||[],
      sort_order:v.sort_order||0
    };
    const saved:any=v.id
      ? await adminFetch(`/api/admin/products/${productId}/variants/${v.id}`,{method:'PUT',body})
      : await adminFetch(`/api/admin/products/${productId}/variants`,{method:'POST',body});

    Object.assign(v,saved,{
      _key:String(saved.id),
      price:saved.price==null?'':String(saved.price),
      old_price:saved.old_price==null?'':String(saved.old_price),
      stock:String(saved.stock),
      images:Array.isArray(saved.images)?saved.images:[],
      saving:false,
      uploading:false
    });
  }catch(e:any){
    errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to save variant';
    v.saving=false;
  }
};
const removeVariant=async(v:any)=>{if(!confirm(`Delete ${v.name||'this variant'}?`))return;if(v.id)await adminFetch(`/api/admin/products/${productId}/variants/${v.id}`,{method:'DELETE'});variants.value=variants.value.filter(x=>x._key!==v._key);};
onMounted(load);
</script>
<style scoped>.label{display:block;margin-bottom:.375rem;font-size:.875rem;font-weight:600;color:#334155}.input{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.625rem .75rem;background:#fff}</style>
