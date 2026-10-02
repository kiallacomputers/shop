<template>
<main class="mx-auto max-w-[1400px] px-4 py-6 md:px-7">
  <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div><NuxtLink to="/admin/products" class="text-sm font-bold text-blue-600">← Products</NuxtLink><p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">Product Import</p><h1 class="text-3xl font-black text-slate-950">Import from Supplier URL</h1><p class="mt-1 text-slate-500">Build a new product from a private supplier page and an official vendor product page. Standard Add Product is unchanged.</p></div>
    <NuxtLink to="/admin/products/new" class="secondary">Standard Add Product</NuxtLink>
  </div>

  <div v-if="error" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{{error}}</div>
  <div v-if="success" class="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{{success}}</div>

  <section class="panel mt-5 p-5">
    <div class="grid gap-4 lg:grid-cols-[260px_1fr_auto] lg:items-end">
      <label class="field"><span>Supplier</span><select v-model.number="supplierId" class="input"><option :value="0">Select supplier…</option><option v-for="s in suppliers" :key="s.id" :value="Number(s.id)">{{s.name}}</option></select></label>
      <label class="field"><span>Supplier Product URL</span><input v-model.trim="supplierUrl" class="input" type="url" placeholder="https://partner.leadersystems.com.au/products..."></label>
      <button class="primary" :disabled="fetching||!supplierId||!supplierUrl" @click="fetchSupplier">{{fetching?'Fetching…':'Fetch Supplier Product'}}</button>
    </div>
    <div v-if="supplierData?.warning" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{{supplierData.warning}}</div>
  </section>

  <template v-if="supplierData">
    <section class="mt-5 grid gap-5 xl:grid-cols-2">
      <div class="panel p-5"><p class="eyebrow">Private supplier data</p><h2 class="mt-1 text-xl font-black">{{selectedSupplier?.name}}</h2>
        <dl class="details mt-4"><div><dt>Supplier SKU</dt><dd>{{supplierData.supplier_sku||'—'}}</dd></div><div><dt>Buy Price ex GST</dt><dd>{{supplierData.price_ex_gst==null?'Not detected':money(supplierData.price_ex_gst)}}</dd></div><div><dt>Brand</dt><dd>{{supplierData.brand||'—'}}</dd></div><div><dt>MPN</dt><dd>{{supplierData.mpn||'—'}}</dd></div><div><dt>GTIN</dt><dd>{{supplierData.gtin||'—'}}</dd></div><div><dt>Stock</dt><dd>{{supplierData.stock||'—'}}</dd></div></dl>
      </div>
      <div class="panel p-5"><p class="eyebrow">Official vendor details</p><h2 class="mt-1 text-xl font-black">Manufacturer Product Page</h2><p class="mt-1 text-sm text-slate-500">Paste the official manufacturer product URL. This keeps customer-facing details separate from private supplier pricing.</p>
        <div class="mt-4 flex gap-2"><input v-model.trim="vendorUrl" class="input" type="url" placeholder="https://www.vendor.com/product/..."><button class="secondary shrink-0" :disabled="vendorFetching||!vendorUrl" @click="fetchVendor">{{vendorFetching?'Fetching…':'Fetch Vendor'}}</button></div>
        <div v-if="vendorData" class="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Official page loaded: {{vendorData.name||vendorData.brand||'product details found'}}</div>
      </div>
    </section>

    <section class="panel mt-5 p-5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p class="eyebrow">Review before creation</p><h2 class="mt-1 text-xl font-black">Kialla Product</h2><p class="mt-1 text-sm text-slate-500">Nothing is saved until you click Create Product.</p></div><button class="secondary" @click="applyBestData">Refresh from Sources</button></div>
      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label class="field xl:col-span-2"><span>Product Name *</span><input v-model="draft.name" class="input"></label>
        <label class="field"><span>Store Product Code *</span><input v-model="draft.product_code" class="input"></label>
        <label class="field"><span>Brand</span><input v-model="draft.brand" class="input"></label>
        <label class="field"><span>MPN</span><input v-model="draft.mpn" class="input"></label>
        <label class="field"><span>GTIN</span><input v-model="draft.gtin" class="input"></label>
        <label class="field"><span>Category *</span><select v-model="draft.category_id" class="input"><option value="">Select category…</option><optgroup v-for="g in categoryGroups" :key="g.parent.id" :label="g.parent.name"><option v-for="c in g.children" :key="c.id" :value="String(c.id)">{{c.name}}</option></optgroup></select></label>
        <label class="field"><span>Buy Price ex GST *</span><input v-model.number="draft.buy_price_ex_gst" class="input" type="number" min="0" step=".01"></label>
        <label class="field"><span>RRP Markup % *</span><input v-model.number="draft.rrp_markup_percent" class="input" type="number" min="0" step=".1"></label>
        <label class="field xl:col-span-3"><span>Short Description</span><textarea v-model="draft.blurb" rows="3" class="input"></textarea></label>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div><h3 class="font-black">Product Images</h3><p class="mt-1 text-sm text-slate-500">Official vendor images are preferred. Untick anything you do not want on the product.</p>
          <div v-if="candidateImages.length" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"><label v-for="img in candidateImages" :key="img" class="relative overflow-hidden rounded-xl border bg-white"><input v-model="selectedImages" :value="img" type="checkbox" class="absolute left-2 top-2 z-10 h-4 w-4"><img :src="img" class="aspect-square w-full object-contain p-2"></label></div><div v-else class="mt-3 rounded-xl border border-dashed p-5 text-sm text-slate-500">No usable images detected yet.</div>
        </div>
        <div><h3 class="font-black">Description Preview</h3><div class="mt-3 min-h-[180px] whitespace-pre-line rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700">{{bestDescription||'No description detected yet.'}}</div></div>
      </div>
      <div class="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><b>Supplier link:</b> {{selectedSupplier?.name}} will be saved as the default supplier with SKU <b>{{supplierData.supplier_sku||draft.product_code||'—'}}</b> and buy price <b>{{money(draft.buy_price_ex_gst)}}</b>.</div>
      <div class="mt-5 flex justify-end gap-2"><NuxtLink to="/admin/products" class="secondary">Cancel</NuxtLink><button class="primary" :disabled="saving" @click="createProduct">{{saving?'Creating…':'Create Product'}}</button></div>
    </section>
  </template>
</main>
</template>

<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']})
const route=useRoute(),router=useRouter(),{adminFetch}=useAdminFetch()
const suppliers=ref<any[]>([]),categories=ref<any[]>([]),supplierId=ref(Number(route.query.supplier||0)),supplierUrl=ref(''),vendorUrl=ref('')
const supplierData=ref<any>(null),vendorData=ref<any>(null),fetching=ref(false),vendorFetching=ref(false),saving=ref(false),error=ref(''),success=ref('')
const selectedImages=ref<string[]>([])
const draft=reactive<any>({name:'',product_code:'',brand:'',mpn:'',gtin:'',category_id:'',buy_price_ex_gst:0,rrp_markup_percent:30,blurb:''})
const selectedSupplier=computed(()=>suppliers.value.find(x=>Number(x.id)===Number(supplierId.value)))
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const categoryGroups=computed(()=>categories.value.filter((x:any)=>x.parent_id==null).map((parent:any)=>({parent,children:categories.value.filter((x:any)=>String(x.parent_id)===String(parent.id)&&x.active!==false)})).filter((g:any)=>g.children.length))
const bestDescription=computed(()=>vendorData.value?.description||supplierData.value?.description||'')
const candidateImages=computed(()=>[...new Set([...(vendorData.value?.images||[]),...(supplierData.value?.images||[])])].slice(0,12))
function applyBestData(){
  const v=vendorData.value||{},s=supplierData.value||{}
  draft.name=v.name||s.name||draft.name
  draft.product_code=draft.product_code||s.supplier_sku||v.mpn||s.mpn||''
  draft.brand=v.brand||s.brand||draft.brand
  draft.mpn=v.mpn||s.mpn||draft.mpn
  draft.gtin=v.gtin||s.gtin||draft.gtin
  if(s.price_ex_gst!=null)draft.buy_price_ex_gst=Number(s.price_ex_gst)
  draft.blurb=(v.description||s.description||draft.blurb||'').slice(0,500)
  selectedImages.value=candidateImages.value.slice(0,6)
}
async function fetchSupplier(){fetching.value=true;error.value='';try{supplierData.value=await adminFetch('/api/admin/products/import-url/fetch',{method:'POST',body:{url:supplierUrl.value}});vendorUrl.value=supplierData.value.vendor_url||'';applyBestData()}catch(e:any){error.value=e?.data?.statusMessage||e?.statusMessage||e.message||'Unable to fetch supplier product.'}finally{fetching.value=false}}
async function fetchVendor(){vendorFetching.value=true;error.value='';try{vendorData.value=await adminFetch('/api/admin/products/import-url/vendor',{method:'POST',body:{url:vendorUrl.value}});applyBestData()}catch(e:any){error.value=e?.data?.statusMessage||e?.statusMessage||e.message||'Unable to fetch official vendor product.'}finally{vendorFetching.value=false}}
async function createProduct(){
  error.value='';success.value=''
  if(!supplierId.value||!draft.name.trim()||!draft.product_code.trim()||!draft.category_id){error.value='Supplier, product name, product code and category are required.';return}
  if(!Number.isFinite(Number(draft.buy_price_ex_gst))||Number(draft.buy_price_ex_gst)<0){error.value='Enter a valid buy price ex GST.';return}
  saving.value=true
  try{
    const description=bestDescription.value?[{type:'paragraph',text:bestDescription.value}]:[]
    const product:any=await adminFetch('/api/admin/products',{method:'POST',body:{
      name:draft.name,slug:draft.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''),
      product_code:draft.product_code,brand:draft.brand,mpn:draft.mpn,gtin:draft.gtin,category_id:Number(draft.category_id),
      blurb:draft.blurb,buy_price_ex_gst:Number(draft.buy_price_ex_gst),pricing_level_markup_override_percent:0,rrp_markup_percent:Number(draft.rrp_markup_percent||0),
      stock:0,low_stock_level:2,reorder_level:3,target_stock_level:5,weight_kg:1,length_cm:30,width_cm:20,height_cm:10,
      active:true,featured:false,refurbished:false,has_variants:false,images:selectedImages.value,description,related_product_ids:[]
    }})
    await adminFetch(`/api/admin/products/${product.id}/suppliers`,{method:'PUT',body:{suppliers:[{supplier_id:supplierId.value,supplier_sku:supplierData.value?.supplier_sku||draft.product_code,buy_price_ex_gst:Number(draft.buy_price_ex_gst),is_primary:true}]}})
    success.value='Product created successfully.'
    await router.push(`/admin/products/${product.id}`)
  }catch(e:any){error.value=e?.data?.statusMessage||e?.statusMessage||e.message||'Unable to create product.'}finally{saving.value=false}
}
onMounted(async()=>{try{[suppliers.value,categories.value]=await Promise.all([adminFetch('/api/admin/products/suppliers'),adminFetch('/api/admin/categories')])}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to load import form.'}})
</script>

<style scoped>
.panel{@apply rounded-2xl border border-slate-200 bg-white shadow-sm}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50}.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50}.field{@apply grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500}.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.eyebrow{@apply text-xs font-black uppercase tracking-[.14em] text-blue-600}.details>div{@apply flex justify-between gap-4 border-b border-slate-100 py-2 text-sm}.details dt{@apply text-slate-500}.details dd{@apply text-right font-black text-slate-900}
</style>
