<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />

    <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <NuxtLink to="/admin/accounting/purchases" class="text-sm font-bold text-blue-600">← Purchase Orders</NuxtLink>
        <h1 class="mt-2 text-3xl font-black">{{ editingId ? `Edit ${editingNumber}` : 'Create Purchase Order' }}</h1>
        <p class="mt-1 text-slate-500">Choose a supplier, then add products directly from your store product list.</p>
      </div>
      <span v-if="editingId" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-800">Draft</span>
    </div>

    <div v-if="message" class="mb-5 rounded-xl border p-4 text-sm font-bold" :class="error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">{{ message }}</div>

    <section class="panel p-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label class="field xl:col-span-2"><span>Supplier *</span><select v-model.number="form.supplier_id" class="input" @change="supplierChanged"><option :value="0">Choose supplier…</option><option v-for="s in suppliers" :key="s.id" :value="Number(s.id)">{{ s.name }}</option></select></label>
        <label class="field"><span>Expected date</span><input v-model="form.expected_date" type="date" class="input"></label>
        <label class="field"><span>Supplier reference</span><input v-model="form.supplier_reference" class="input" placeholder="Quote / reference"></label>
      </div>
      <label class="field mt-4"><span>Purchase order notes</span><textarea v-model="form.notes" rows="3" class="input" placeholder="Notes for this purchase order"></textarea></label>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 class="text-xl font-black">Products</h2><p class="mt-1 text-sm text-slate-500">Search the complete store catalogue. Supplier-specific SKU and buy price are used automatically when configured.</p></div>
          <button class="secondary" type="button" :disabled="!form.supplier_id" @click="showPicker=true">+ Add Product</button>
        </div>
      </div>

      <div v-if="!form.lines.length" class="p-10 text-center text-slate-500"><div class="text-4xl">📦</div><p class="mt-3 font-bold text-slate-700">No products added yet</p><p class="mt-1 text-sm">Choose a supplier, then add products from your store catalogue.</p></div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[950px] text-sm">
          <thead class="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500"><tr><th class="p-3">Product</th><th class="p-3">Supplier SKU</th><th class="p-3 w-28">Qty</th><th class="p-3 w-44">Buy Price ex GST</th><th class="p-3 text-right">Line ex GST</th><th class="p-3 w-24"></th></tr></thead>
          <tbody><tr v-for="(line,index) in form.lines" :key="line._key" class="border-t border-slate-100 align-top"><td class="p-3"><div class="flex items-center gap-3"><img v-if="productImage(line.product_id)" :src="productImage(line.product_id)" class="h-12 w-12 rounded-lg border object-contain"><div><input v-model="line.description" class="input font-bold"><p class="mt-1 text-xs text-slate-500">Store SKU: {{ storeSku(line.product_id) || '—' }}</p></div></div></td><td class="p-3"><input v-model="line.sku" class="input" placeholder="Supplier SKU"></td><td class="p-3"><input v-model.number="line.quantity" class="input" type="number" min="1" step="1"></td><td class="p-3"><input v-model.number="line.unit_cost_ex_gst" class="input" type="number" min="0" step="0.01"></td><td class="p-3 text-right font-black">{{ money(lineTotal(line)) }}</td><td class="p-3 text-right"><button class="text-sm font-bold text-red-600" type="button" @click="removeLine(index)">Remove</button></td></tr></tbody>
        </table>
      </div>

      <div class="border-t border-slate-200 bg-slate-50 p-5">
        <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <button class="secondary self-start" type="button" @click="addCustomLine">+ Custom Line</button>
          <div class="w-full max-w-sm space-y-2 text-sm"><div class="flex justify-between"><span>Subtotal ex GST</span><b>{{ money(subtotal) }}</b></div><div class="flex justify-between"><span>GST</span><b>{{ money(gst) }}</b></div><div class="flex justify-between border-t border-slate-300 pt-2 text-lg"><span class="font-black">Total inc GST</span><b>{{ money(total) }}</b></div></div>
        </div>
      </div>
    </section>

    <div class="mt-5 flex flex-wrap justify-end gap-3"><NuxtLink to="/admin/accounting/purchases" class="secondary">Cancel</NuxtLink><button class="primary" type="button" :disabled="saving" @click="save">{{ saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Purchase Order' }}</button></div>

    <div v-if="showPicker" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showPicker=false">
      <div class="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b p-5"><div><h2 class="text-xl font-black">Add Store Products</h2><p class="text-sm text-slate-500">{{ supplierName }} · {{ filteredProducts.length }} products</p></div><button class="secondary" @click="showPicker=false">Close</button></div>
        <div class="border-b p-4"><input v-model="search" class="input" autofocus placeholder="Search product name or SKU…"></div>
        <div class="overflow-y-auto p-3">
          <button v-for="p in filteredProducts" :key="p.id" type="button" class="mb-2 flex w-full items-center gap-4 rounded-xl border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50" @click="addProduct(p)">
            <img v-if="imageFor(p)" :src="imageFor(p)" class="h-14 w-14 shrink-0 rounded-lg border bg-white object-contain">
            <div class="min-w-0 flex-1"><div class="font-black text-slate-900">{{ p.name }}</div><div class="mt-1 text-xs text-slate-500">Store SKU: {{ p.product_code || '—' }} · Stock: {{ p.stock ?? 0 }}</div><div v-if="mappingFor(p.id)" class="mt-1 text-xs font-bold text-blue-700">Supplier SKU: {{ mappingFor(p.id)?.supplier_sku || '—' }} · Buy: {{ money(mappingFor(p.id)?.buy_price_ex_gst ?? p.buy_price_ex_gst ?? 0) }}</div><div v-else class="mt-1 text-xs text-amber-700">No supplier mapping — store buy price will be used and can be changed on the PO.</div></div>
            <span class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white">Add</span>
          </button>
          <div v-if="!filteredProducts.length" class="p-8 text-center text-slate-500">No matching products.</div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:['admin'] })
const { adminFetch } = useAdminFetch()
const route = useRoute()
const router = useRouter()
const suppliers = ref<any[]>([])
const products = ref<any[]>([])
const mappings = ref<any[]>([])
const pos = ref<any[]>([])
const showPicker = ref(false)
const search = ref('')
const saving = ref(false)
const message = ref('')
const error = ref(false)
const editingId = computed(() => Number(route.query.edit || 0) || 0)
const editingNumber = ref('')
let key = 0
const form = reactive<any>({ supplier_id:0, expected_date:'', supplier_reference:'', notes:'', lines:[] })
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const subtotal=computed(()=>form.lines.reduce((sum:number,l:any)=>sum+lineTotal(l),0))
const gst=computed(()=>Math.round(subtotal.value*.1*100)/100)
const total=computed(()=>subtotal.value+gst.value)
const supplierName=computed(()=>suppliers.value.find(s=>Number(s.id)===Number(form.supplier_id))?.name||'Supplier')
const filteredProducts=computed(()=>{const q=search.value.trim().toLowerCase();return products.value.filter(p=>!q||String(p.name||'').toLowerCase().includes(q)||String(p.product_code||'').toLowerCase().includes(q)).slice(0,200)})
function lineTotal(l:any){return Math.round(Number(l.quantity||0)*Number(l.unit_cost_ex_gst||0)*100)/100}
function mappingFor(productId:any){return mappings.value.find(m=>Number(m.product_id)===Number(productId)&&Number(m.supplier_id)===Number(form.supplier_id))}
function imageFor(p:any){const imgs=Array.isArray(p?.images)?p.images:[];const first=imgs[0];return typeof first==='string'?first:(first?.url||first?.src||'')}
function productImage(id:any){return imageFor(products.value.find(p=>Number(p.id)===Number(id)))}
function storeSku(id:any){return products.value.find(p=>Number(p.id)===Number(id))?.product_code||''}
function addProduct(p:any){const m=mappingFor(p.id);const existing=form.lines.find((l:any)=>Number(l.product_id)===Number(p.id));if(existing){existing.quantity=Number(existing.quantity||0)+1}else{form.lines.push({_key:++key,product_id:p.id,description:m?.supplier_product_name||p.name,sku:m?.supplier_sku||p.product_code||'',quantity:1,unit_cost_ex_gst:Number(m?.buy_price_ex_gst??p.buy_price_ex_gst??0)})}showPicker.value=false;search.value=''}
function addCustomLine(){form.lines.push({_key:++key,product_id:null,description:'',sku:'',quantity:1,unit_cost_ex_gst:0})}
function removeLine(i:number){form.lines.splice(i,1)}
function supplierChanged(){/* mappings are already loaded; changing supplier changes the values used for newly-added products */}
async function load(){try{const [s,p,m]=await Promise.all([adminFetch('/api/admin/accounting/suppliers'),adminFetch('/api/admin/accounting/store-products'),adminFetch('/api/admin/accounting/product-suppliers')]);suppliers.value=s||[];products.value=p||[];mappings.value=m||[];if(editingId.value){pos.value=await adminFetch('/api/admin/accounting/purchase-orders')||[];const po=pos.value.find((x:any)=>Number(x.id)===editingId.value);if(!po)throw new Error('Purchase order not found.');if(String(po.status||'').toLowerCase()!=='draft')throw new Error('Only draft purchase orders can be edited.');editingNumber.value=po.po_number||`PO ${po.id}`;Object.assign(form,{supplier_id:Number(po.supplier_id),expected_date:po.expected_date||'',supplier_reference:po.supplier_reference||'',notes:po.notes||'',lines:(po.accounting_purchase_order_lines||[]).map((l:any)=>({_key:++key,id:l.id,product_id:l.product_id,description:l.description||'',sku:l.sku||'',quantity:Number(l.quantity||1),unit_cost_ex_gst:Number(l.unit_cost_ex_gst||0)}))})}}catch(e:any){error.value=true;message.value=e?.data?.statusMessage||e?.message||'Unable to load purchase order data.'}}
async function save(){message.value='';error.value=false;if(!form.supplier_id){error.value=true;message.value='Please choose a supplier.';return}if(!form.lines.length){error.value=true;message.value='Add at least one product or custom line.';return}if(form.lines.some((l:any)=>!String(l.description||'').trim()||Number(l.quantity)<=0||Number(l.unit_cost_ex_gst)<0)){error.value=true;message.value='Check each line has a description, quantity and valid buy price.';return}saving.value=true;try{const body={supplier_id:form.supplier_id,expected_date:form.expected_date||null,supplier_reference:form.supplier_reference||null,notes:form.notes||null,lines:form.lines.map((l:any)=>({id:l.id,product_id:l.product_id||null,description:l.description,sku:l.sku||null,quantity:Number(l.quantity),unit_cost_ex_gst:Number(l.unit_cost_ex_gst)}))};if(editingId.value){await adminFetch(`/api/admin/accounting/purchase-orders/${editingId.value}`,{method:'PUT',body})}else{await adminFetch('/api/admin/accounting/purchase-orders',{method:'POST',body})}await router.push('/admin/accounting/purchases')}catch(e:any){error.value=true;message.value=e?.data?.statusMessage||e?.message||'Unable to save purchase order.'}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>
.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.field{@apply flex flex-col gap-1.5 text-sm font-bold text-slate-700}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50}.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50}
</style>
