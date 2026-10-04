<template>
<main class="mx-auto max-w-[1400px] px-4 py-6 md:px-7">
  <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div><NuxtLink to="/admin/products" class="text-sm font-bold text-blue-600">← Products</NuxtLink><p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">Product Import</p><h1 class="text-3xl font-black text-slate-950">Import from Supplier URL</h1><p class="mt-1 text-slate-500">Build a new product from a private supplier page and an official vendor product page. Standard Add Product is unchanged.</p></div>
    <NuxtLink to="/admin/products/new" class="secondary">Standard Add Product</NuxtLink>
  </div>

  <div v-if="error" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{{error}}</div>
  <div v-if="success" class="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{{success}}</div>

  <section class="panel mt-5 p-5">
    <div class="grid gap-4 lg:grid-cols-[240px_1fr_240px_auto] lg:items-end">
      <label class="field"><span>Supplier</span><select v-model.number="supplierId" class="input"><option :value="0">Select supplier…</option><option v-for="s in suppliers" :key="s.id" :value="Number(s.id)">{{s.name}}</option></select></label>
      <label class="field"><span>Supplier Product URL</span><input v-model.trim="supplierUrl" class="input" type="url" placeholder="https://partner.leadersystems.com.au/products..."></label>
      <label class="field"><span>Leader Product Code</span><input v-model.trim="leaderProductCode" class="input" placeholder="e.g. MNL-32BR50C-B"></label>
      <button class="primary" :disabled="fetching||!supplierId||!supplierUrl||!leaderProductCode" @click="fetchSupplier">{{fetching?'Fetching…':'Fetch Supplier Product'}}</button>
    </div>
    <p class="mt-3 text-xs text-slate-500">Use the product code shown on the Leader product page. Leader's product URL is opaque, so the code is used for its GetProducts service.</p>
    <div v-if="supplierData?.warning" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{{supplierData.warning}}</div>
  </section>

  <template v-if="supplierData">
    <section class="mt-5 grid gap-5 xl:grid-cols-2">
      <div class="panel p-5"><p class="eyebrow">Private supplier data</p><h2 class="mt-1 text-xl font-black">{{selectedSupplier?.name}}</h2>
        <dl class="details mt-4"><div><dt>Supplier SKU</dt><dd>{{supplierData.supplier_sku||'—'}}</dd></div><div><dt>Buy Price ex GST</dt><dd>{{supplierData.price_ex_gst==null?'Not detected':money(supplierData.price_ex_gst)}}</dd></div><div><dt>Leader RRP inc GST</dt><dd>{{supplierData.rrp_inc_gst?money(supplierData.rrp_inc_gst):'—'}}</dd></div><div><dt>Brand</dt><dd>{{supplierData.brand||'—'}}</dd></div><div><dt>MPN</dt><dd>{{supplierData.mpn||'—'}}</dd></div><div><dt>Leader Category</dt><dd>{{supplierData.category||'—'}} / {{supplierData.subcategory||'—'}}</dd></div><div><dt>Stock</dt><dd>{{supplierData.stock_total ?? '—'}} total <span v-if="supplierData.stock_by_state" class="font-normal text-slate-500">({{Object.entries(supplierData.stock_by_state).map(([k,v])=>`${k} ${v}`).join(' · ')}})</span></dd></div><div><dt>Box</dt><dd>{{supplierData.box_length_mm||0}} × {{supplierData.box_width_mm||0}} × {{supplierData.box_height_mm||0}} mm</dd></div></dl>
      </div>
      <div class="panel p-5"><p class="eyebrow">Official vendor details</p><h2 class="mt-1 text-xl font-black">Manufacturer Product Page</h2><p class="mt-1 text-sm text-slate-500">Paste the official manufacturer product URL. This keeps customer-facing details separate from private supplier pricing.</p>
        <div class="mt-4 flex gap-2"><input v-model.trim="vendorUrl" class="input" type="url" placeholder="https://www.vendor.com/product/..."><button class="secondary shrink-0" :disabled="vendorFetching||!vendorUrl" @click="fetchVendor">{{vendorFetching?'Fetching…':'Fetch Vendor'}}</button></div>
        <div v-if="vendorData" class="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Official page loaded: {{vendorData.name||vendorData.brand||'product details found'}}</div>
      </div>
    </section>

    <section class="panel mt-5 p-5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p class="eyebrow">Review before creation</p><h2 class="mt-1 text-xl font-black">Kialla Product</h2><p class="mt-1 text-sm text-slate-500">After Fetch Vendor, choose Supplier or Vendor for each customer-facing field. You can still edit the final value.</p></div><button class="secondary" @click="applySelections">Apply Source Choices</button></div>

      <div v-if="vendorData" class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <div class="grid grid-cols-[150px_1fr_1fr] bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-600">
          <div class="p-3">Field</div><div class="p-3">Supplier</div><div class="p-3">Vendor</div>
        </div>
        <div v-for="row in comparisonRows" :key="row.key" class="grid grid-cols-[150px_1fr_1fr] border-t border-slate-200 text-sm">
          <div class="p-3 font-black text-slate-700">{{row.label}}</div>
          <button type="button" class="source-choice" :class="sourceChoice[row.key]==='supplier'?'source-selected':''" @click="chooseSource(row.key,'supplier')" :disabled="!row.supplier">
            <span class="source-badge">Supplier</span><span>{{row.supplier||'Not supplied'}}</span>
          </button>
          <button type="button" class="source-choice" :class="sourceChoice[row.key]==='vendor'?'source-selected':''" @click="chooseSource(row.key,'vendor')" :disabled="!row.vendor">
            <span class="source-badge vendor">Vendor</span><span>{{row.vendor||'Not supplied'}}</span>
          </button>
        </div>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label class="field xl:col-span-2"><span>Product Name * <SourceTag :source="sourceChoice.name" /></span><input v-model="draft.name" class="input"></label>
        <label class="field"><span>Store Product Code *</span><input v-model="draft.product_code" class="input"></label>
        <label class="field"><span>Brand <SourceTag :source="sourceChoice.brand" /></span><input v-model="draft.brand" class="input"></label>
        <label class="field"><span>MPN <SourceTag :source="sourceChoice.mpn" /></span><input v-model="draft.mpn" class="input"></label>
        <label class="field"><span>GTIN <SourceTag :source="sourceChoice.gtin" /></span><input v-model="draft.gtin" class="input"></label>
        <div class="field">
          <span>Category *</span>
          <select v-model="draft.category_id" class="input"><option value="">Select category…</option><optgroup v-for="g in categoryGroups" :key="g.parent.id" :label="g.parent.name"><option v-for="c in g.children" :key="c.id" :value="String(c.id)">{{c.name}}</option></optgroup></select>
          <div v-if="categorySuggestion" class="mt-1 rounded-lg border border-violet-200 bg-violet-50 p-2 normal-case tracking-normal">
            <div class="flex items-center justify-between gap-2"><span class="text-xs font-black text-violet-800">Suggested: {{categorySuggestion.name}}</span><span class="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">{{categorySuggestion.confidence}}% match</span></div>
            <p class="mt-1 text-[11px] font-normal text-violet-700">{{categorySuggestion.reason}}</p>
            <button v-if="String(draft.category_id)!==String(categorySuggestion.id)" type="button" class="mt-2 text-xs font-black text-violet-700 hover:underline" @click="useSuggestedCategory">Use suggested category</button>
            <span v-else class="mt-2 inline-block text-[11px] font-bold text-emerald-700">✓ Selected</span>
          </div>
        </div>
        <label class="field"><span>Buy Price ex GST *</span><input v-model.number="draft.buy_price_ex_gst" class="input" type="number" min="0" step=".01"></label>
        <label class="field"><span>RRP Markup % *</span><input v-model.number="draft.rrp_markup_percent" class="input" type="number" min="0" step=".1"></label>
        <label class="field xl:col-span-3"><span>Short Description <SourceTag :source="sourceChoice.description" /></span><textarea v-model="draft.blurb" rows="3" class="input"></textarea></label>
        <label class="field xl:col-span-2"><span>SEO Title</span><input v-model="draft.seo_title" class="input" maxlength="70"><small class="normal-case font-normal tracking-normal text-slate-400">{{draft.seo_title.length}} / 60 recommended</small></label>
        <label class="field"><span>URL Slug</span><input v-model="draft.slug" class="input"></label>
        <label class="field xl:col-span-3"><span>Meta Description</span><textarea v-model="draft.meta_description" rows="3" maxlength="180" class="input"></textarea><small class="normal-case font-normal tracking-normal text-slate-400">{{draft.meta_description.length}} / 160 recommended</small></label>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div><h3 class="font-black">Product Images</h3><p class="mt-1 text-sm text-slate-500">Choose any combination of Supplier and Vendor images.</p>
          <div v-if="supplierImages.length" class="mt-3"><div class="mb-2 flex items-center justify-between"><span class="source-badge">Supplier images</span><button type="button" class="text-xs font-bold text-blue-600" @click="selectAllImages('supplier')">Select all</button></div><div class="grid grid-cols-2 gap-3 sm:grid-cols-3"><label v-for="img in supplierImages" :key="'s-'+img" class="relative overflow-hidden rounded-xl border bg-white"><input v-model="selectedImages" :value="img" type="checkbox" class="absolute left-2 top-2 z-10 h-4 w-4"><span class="absolute right-2 top-2 z-10 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">SUPPLIER</span><img :src="img" class="aspect-square w-full object-contain p-2"></label></div></div>
          <div v-if="vendorImages.length" class="mt-4"><div class="mb-2 flex items-center justify-between"><span class="source-badge vendor">Vendor images</span><button type="button" class="text-xs font-bold text-emerald-700" @click="selectAllImages('vendor')">Select all</button></div><div class="grid grid-cols-2 gap-3 sm:grid-cols-3"><label v-for="img in vendorImages" :key="'v-'+img" class="relative overflow-hidden rounded-xl border bg-white"><input v-model="selectedImages" :value="img" type="checkbox" class="absolute left-2 top-2 z-10 h-4 w-4"><span class="absolute right-2 top-2 z-10 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black text-white">VENDOR</span><img :src="img" class="aspect-square w-full object-contain p-2"></label></div></div>
          <div v-if="!candidateImages.length" class="mt-3 rounded-xl border border-dashed p-5 text-sm text-slate-500">No usable images detected yet.</div>
        </div>
        <div><div class="flex items-center justify-between"><h3 class="font-black">Description Preview</h3><SourceTag :source="sourceChoice.description" /></div><div class="mt-3 min-h-[180px] whitespace-pre-line rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700">{{chosenDescription||'No description detected yet.'}}</div></div>
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
const suppliers=ref<any[]>([]),categories=ref<any[]>([]),supplierId=ref(Number(route.query.supplier||0)),supplierUrl=ref(''),leaderProductCode=ref(''),vendorUrl=ref('')
const supplierData=ref<any>(null),vendorData=ref<any>(null),fetching=ref(false),vendorFetching=ref(false),saving=ref(false),error=ref(''),success=ref('')
const selectedImages=ref<string[]>([])
const sourceChoice=reactive<Record<string,'supplier'|'vendor'>>({name:'supplier',brand:'supplier',mpn:'supplier',gtin:'supplier',description:'supplier'})
const SourceTag=defineComponent({
  props:{source:{type:String,default:''}},
  setup(props){return()=>h('span',{class:['ml-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-black normal-case tracking-normal',props.source==='vendor'?'bg-emerald-100 text-emerald-700':'bg-blue-100 text-blue-700']},props.source==='vendor'?'Vendor':'Supplier')}
})
const draft=reactive<any>({name:'',product_code:'',brand:'',mpn:'',gtin:'',category_id:'',buy_price_ex_gst:0,rrp_markup_percent:30,blurb:'',seo_title:'',meta_description:'',slug:''})
const selectedSupplier=computed(()=>suppliers.value.find(x=>Number(x.id)===Number(supplierId.value)))
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const categoryGroups=computed(()=>categories.value.filter((x:any)=>x.parent_id==null).map((parent:any)=>({parent,children:categories.value.filter((x:any)=>String(x.parent_id)===String(parent.id)&&x.active!==false)})).filter((g:any)=>g.children.length))
const categorySuggestion=computed(()=>{
  if(!supplierData.value||!categories.value.length)return null
  const source=[
    supplierData.value.category,
    supplierData.value.subcategory,
    supplierData.value.name,
    vendorData.value?.name,
    vendorData.value?.description
  ].filter(Boolean).join(' ')
  const norm=(v:any)=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
  const words=(v:any)=>new Set(norm(v).split(/\s+/).filter((w:string)=>w.length>2))
  const src=norm(source), srcWords=words(source)
  const aliases:Record<string,string[]>={
    'monitor':['monitor','monitors','display','displays','screen','screens'],
    'laptop':['laptop','laptops','notebook','notebooks'],
    'ssd':['ssd','solid state','storage'],
    'cpu':['cpu','cpus','processor','processors'],
    'networking':['network','networking','router','switch','wifi','wireless','access point'],
    'mac':['mac','macbook','apple','imac']
  }
  const activeChildren=categories.value.filter((c:any)=>c.parent_id!=null&&c.active!==false)
  let best:any=null
  for(const c of activeChildren){
    const parent=categories.value.find((p:any)=>String(p.id)===String(c.parent_id))
    const label=`${parent?.name||''} ${c.name||''}`
    const labelNorm=norm(label), labelWords=words(label)
    let score=0
    let hits:string[]=[]
    for(const w of labelWords){
      if(srcWords.has(w)){score+=18;hits.push(w)}
      else if(src.includes(w)){score+=8;hits.push(w)}
    }
    for(const [key,list] of Object.entries(aliases)){
      const categoryHas=labelNorm.includes(key)||list.some(a=>labelNorm.includes(a))
      const sourceHas=src.includes(key)||list.some(a=>src.includes(a))
      if(categoryHas&&sourceHas){score+=28;hits.push(key)}
    }
    const leaderCat=norm(`${supplierData.value.category||''} ${supplierData.value.subcategory||''}`)
    if(leaderCat&&labelNorm.includes(leaderCat))score+=35
    if(norm(c.name)&&leaderCat.includes(norm(c.name))){score+=40;hits.push(norm(c.name))}
    if(!best||score>best.score)best={id:c.id,name:`${parent?.name ? parent.name+' → ' : ''}${c.name}`,score,hits:[...new Set(hits)]}
  }
  if(!best||best.score<=0)return null
  const confidence=Math.min(98,Math.max(45,Math.round(45+best.score/2)))
  const leaderLabel=[supplierData.value.category,supplierData.value.subcategory].filter(Boolean).join(' / ')
  return {...best,confidence,reason:`Based on Leader category ${leaderLabel||'and the imported product details'}${best.hits.length?`; matched ${best.hits.slice(0,4).join(', ')}`:''}.`}
})

const supplierImages=computed(()=>[...new Set(supplierData.value?.images||[])])
const vendorImages=computed(()=>[...new Set(vendorData.value?.images||[])])
const candidateImages=computed(()=>[...new Set([...supplierImages.value,...vendorImages.value])].slice(0,20))
const chosenDescription=computed(()=>sourceChoice.description==='vendor'&&vendorData.value?.description?vendorData.value.description:supplierData.value?.description||vendorData.value?.description||'')
const bestDescription=chosenDescription
const comparisonRows=computed(()=>[
  {key:'name',label:'Product Name',supplier:supplierData.value?.name||'',vendor:vendorData.value?.name||''},
  {key:'brand',label:'Brand',supplier:supplierData.value?.brand||'',vendor:vendorData.value?.brand||''},
  {key:'mpn',label:'MPN',supplier:supplierData.value?.mpn||'',vendor:vendorData.value?.mpn||''},
  {key:'gtin',label:'GTIN',supplier:supplierData.value?.gtin||'',vendor:vendorData.value?.gtin||''},
  {key:'description',label:'Description',supplier:cleanText(supplierData.value?.description||'').slice(0,180),vendor:cleanText(vendorData.value?.description||'').slice(0,180)}
])
function cleanText(v:any){return String(v||'').replace(/\s+/g,' ').replace(/\s+([,.;:])/g,'$1').trim()}
function makeSlug(v:string){return cleanText(v).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)}
function buildSeo(){
  const s=supplierData.value||{},v=vendorData.value||{}
  const brand=cleanText(v.brand||s.brand||draft.brand)
  const mpn=cleanText(v.mpn||s.mpn||draft.mpn)
  let name=cleanText(v.name||s.name||draft.name)
  // Remove duplicated brand/model from the source title, then rebuild a clean search title.
  let core=name
  if(brand)core=core.replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*`,'i'),'')
  if(mpn)core=core.replace(new RegExp(mpn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),'').replace(/\s{2,}/g,' ').trim()
  let title=cleanText([brand,mpn,core].filter(Boolean).join(' '))
  if(title.length>60){
    const shortCore=core.split(',')[0].trim()
    title=cleanText([brand,mpn,shortCore].filter(Boolean).join(' '))
  }
  if(title.length>60)title=title.slice(0,60).replace(/\s+\S*$/,'').trim()
  draft.seo_title=title||name.slice(0,60)
  draft.slug=makeSlug([brand,mpn,core.split(',')[0]].filter(Boolean).join(' '))

  const source=cleanText(v.description||s.description||draft.blurb)
  const first=source.split(/(?<=[.!?])\s+/)[0]||''
  const productLabel=cleanText([brand,mpn].filter(Boolean).join(' '))||name
  let meta=first
  if(!meta||meta.length<70)meta=cleanText(`Shop ${productLabel} at Kialla Computers. ${first}`)
  if(meta.length>160)meta=meta.slice(0,160).replace(/\s+\S*$/,'').replace(/[,:;\-]+$/,'').trim()+'.'
  draft.meta_description=meta
}
function valueFor(key:string){
  const s=supplierData.value||{},v=vendorData.value||{}
  const source=sourceChoice[key]
  if(key==='description')return source==='vendor'&&v.description?v.description:s.description||v.description||''
  const vendorValue=v[key]
  const supplierValue=s[key]
  return source==='vendor'&&vendorValue?vendorValue:supplierValue||vendorValue||''
}
function chooseSource(key:string,source:'supplier'|'vendor'){
  const data=source==='vendor'?vendorData.value:supplierData.value
  if(!data)return
  const check=key==='description'?data.description:data[key]
  if(!check)return
  sourceChoice[key]=source
  applySelections()
}
function applySelections(){
  const s=supplierData.value||{}
  draft.name=valueFor('name')||draft.name
  draft.product_code=draft.product_code||s.supplier_sku||valueFor('mpn')||''
  draft.brand=valueFor('brand')||draft.brand
  draft.mpn=valueFor('mpn')||draft.mpn
  draft.gtin=valueFor('gtin')||draft.gtin
  if(s.price_ex_gst!=null)draft.buy_price_ex_gst=Number(s.price_ex_gst)
  draft.blurb=String(valueFor('description')||draft.blurb||'').slice(0,500)
  buildSeo()
}
function setInitialChoices(){
  for(const key of ['name','brand','mpn','gtin','description']){
    sourceChoice[key]=(vendorData.value?.[key==='description'?'description':key]?'vendor':'supplier') as 'supplier'|'vendor'
  }
}
function useSuggestedCategory(){
  if(categorySuggestion.value)draft.category_id=String(categorySuggestion.value.id)
}
function autoSelectCategory(){
  if(categorySuggestion.value&&!draft.category_id)draft.category_id=String(categorySuggestion.value.id)
}
function selectAllImages(source:'supplier'|'vendor'){
  const imgs=source==='vendor'?vendorImages.value:supplierImages.value
  selectedImages.value=[...new Set([...selectedImages.value,...imgs])]
}
function applyBestData(){
  if(vendorData.value)setInitialChoices()
  applySelections()
  if(!selectedImages.value.length)selectedImages.value=candidateImages.value.slice(0,6)
}
async function fetchSupplier(){
  fetching.value=true;error.value='';success.value='';supplierData.value=null;vendorData.value=null;vendorUrl.value='';selectedImages.value=[]
  try{
    const result:any=await adminFetch('/api/admin/products/import-url/fetch',{method:'POST',body:{url:supplierUrl.value,product_code:leaderProductCode.value}})
    if(!result?.authenticated)throw new Error('The supplier product could not be authenticated.')
    supplierData.value=result
    vendorUrl.value=result.vendor_url||''
    applyBestData()
    await nextTick()
    autoSelectCategory()
  }catch(e:any){
    supplierData.value=null
    error.value=e?.data?.statusMessage||e?.statusMessage||e.message||'Unable to fetch supplier product.'
  }finally{fetching.value=false}
}
async function fetchVendor(){
  vendorFetching.value=true;error.value=''
  try{
    vendorData.value=await adminFetch('/api/admin/products/import-url/vendor',{method:'POST',body:{url:vendorUrl.value}})
    setInitialChoices()
    applySelections()
    await nextTick()
    autoSelectCategory()
    selectedImages.value=[...new Set([...selectedImages.value,...vendorImages.value])].slice(0,12)
  }catch(e:any){error.value=e?.data?.statusMessage||e?.statusMessage||e.message||'Unable to fetch official vendor product.'}
  finally{vendorFetching.value=false}
}
async function createProduct(){
  error.value='';success.value=''
  if(!supplierData.value?.authenticated){error.value='Fetch and authenticate the supplier product before creating it.';return}
  if(!supplierId.value||!draft.name.trim()||!draft.product_code.trim()||!draft.category_id){error.value='Supplier, product name, product code and category are required.';return}
  if(!Number.isFinite(Number(draft.buy_price_ex_gst))||Number(draft.buy_price_ex_gst)<0){error.value='Enter a valid buy price ex GST.';return}
  saving.value=true
  try{
    const description=bestDescription.value?[{type:'paragraph',text:bestDescription.value}]:[]
    const product:any=await adminFetch('/api/admin/products',{method:'POST',body:{
      name:draft.name,slug:draft.slug||makeSlug(draft.name),seo_title:draft.seo_title,meta_description:draft.meta_description,
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
.source-choice{@apply flex min-h-[76px] flex-col items-start gap-2 border-l border-slate-200 p-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40}
.source-selected{@apply bg-blue-50 ring-2 ring-inset ring-blue-500}
.source-badge{@apply inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700}
.source-badge.vendor{@apply bg-emerald-100 text-emerald-700}
</style>
