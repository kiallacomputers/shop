<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />
    <NuxtLink :to="`/admin/purchasing/suppliers/${supplierId}`" class="text-sm font-bold text-blue-600">← Supplier</NuxtLink>

    <div class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-[.16em] text-blue-600">Purchase Order Preview</p>
        <h1 class="text-3xl font-black text-slate-950">{{ supplier?.name || 'Supplier' }}</h1>
        <p class="mt-1 text-slate-500">Generated from products where this supplier is Primary and the product has reached its reorder level.</p>
      </div>
      <label class="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold">
        <input v-model="showAll" type="checkbox" class="h-4 w-4"> Show primary products not requiring reorder
      </label>
    </div>

    <div v-if="loading" class="panel mt-5 p-8 text-center text-slate-500">Generating preview…</div>
    <div v-else-if="error" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{{ error }}</div>
    <template v-else>
      <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div class="stat"><span>Primary Products</span><b>{{ primaryRows.length }}</b><small>assigned to supplier</small></div>
        <div class="stat"><span>Need Reorder</span><b>{{ reorderRows.length }}</b><small>stock ≤ reorder level</small></div>
        <div class="stat"><span>Units Suggested</span><b>{{ suggestedUnits }}</b><small>to target stock</small></div>
        <div class="stat"><span>Selected Lines</span><b>{{ selectedRows.length }}</b><small>{{ selectedUnits }} units</small></div>
        <div class="stat"><span>Preview Total</span><b>{{ money(total) }}</b><small>{{ money(subtotal) }} ex GST</small></div>
      </section>

      <section class="panel mt-5 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div><h2 class="text-xl font-black">Primary Product Replenishment</h2><p class="mt-1 text-sm text-slate-500">Suggested Qty = Target Stock − Current Stock. Adjust any quantity before creating the PO.</p></div>
          <button class="secondary" @click="selectSuggested">Reset Suggested Quantities</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1120px] text-sm">
            <thead><tr><th class="w-12">Add</th><th>Product</th><th>Supplier SKU</th><th class="text-right">Stock</th><th class="text-right">Low</th><th class="text-right">Reorder</th><th class="text-right">Target</th><th class="text-right">Order Qty</th><th class="text-right">Buy ex GST</th><th class="text-right">Line Total</th></tr></thead>
            <tbody>
              <tr v-for="row in visibleRows" :key="row.product_id" :class="row.needsReorder ? 'bg-amber-50/50' : ''">
                <td><input v-model="row.selected" type="checkbox" class="h-4 w-4"></td>
                <td><div class="font-black text-slate-900">{{ row.name }}</div><div class="text-xs text-slate-400">{{ row.store_sku || 'No store SKU' }}</div><span v-if="row.needsReorder" class="badge amber">Reorder</span><span v-else class="badge green">Stock OK</span></td>
                <td>{{ row.supplier_sku || '—' }}</td><td class="text-right font-bold">{{ row.stock }}</td><td class="text-right">{{ row.low_stock_level }}</td><td class="text-right font-bold">{{ row.reorder_level }}</td><td class="text-right font-bold">{{ row.target_stock_level }}</td>
                <td class="text-right"><input v-model.number="row.quantity" type="number" min="0" step="1" class="input ml-auto w-24 text-right" @input="row.selected=Number(row.quantity)>0"></td>
                <td class="text-right"><input v-model.number="row.unit_cost_ex_gst" type="number" min="0" step="0.01" class="input ml-auto w-28 text-right"></td><td class="text-right font-black">{{ money(row.quantity * row.unit_cost_ex_gst) }}</td>
              </tr>
              <tr v-if="!visibleRows.length"><td colspan="10" class="empty">No primary products currently require reorder. Turn on “Show primary products not requiring reorder” to view all primary products.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="border-t bg-slate-50 p-5">
          <div class="ml-auto w-full max-w-sm space-y-2 text-sm"><div class="flex justify-between"><span>Subtotal ex GST</span><b>{{ money(subtotal) }}</b></div><div class="flex justify-between"><span>GST</span><b>{{ money(gst) }}</b></div><div class="flex justify-between border-t pt-2 text-lg"><span class="font-black">Preview Total</span><b>{{ money(total) }}</b></div></div>
        </div>
      </section>

      <div class="mt-5 flex flex-wrap justify-end gap-3"><NuxtLink :to="`/admin/purchasing/suppliers/${supplierId}`" class="secondary">Cancel</NuxtLink><button class="primary" :disabled="!selectedRows.length" @click="createPO">Review in New Purchase Order →</button></div>
    </template>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:['admin'] })
const route=useRoute(), router=useRouter(); const {adminFetch}=useAdminFetch()
const supplierId=computed(()=>Number(route.params.id)); const loading=ref(true), error=ref(''), showAll=ref(false), supplier=ref<any>(null), rows=ref<any[]>([])
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const primaryRows=computed(()=>rows.value.filter(r=>r.is_primary)); const reorderRows=computed(()=>primaryRows.value.filter(r=>r.needsReorder)); const visibleRows=computed(()=>showAll.value?primaryRows.value:reorderRows.value)
const selectedRows=computed(()=>primaryRows.value.filter(r=>r.selected&&Number(r.quantity)>0)); const suggestedUnits=computed(()=>reorderRows.value.reduce((s,r)=>s+r.suggestedQty,0)); const selectedUnits=computed(()=>selectedRows.value.reduce((s,r)=>s+Number(r.quantity||0),0))
const subtotal=computed(()=>selectedRows.value.reduce((s,r)=>s+Number(r.quantity||0)*Number(r.unit_cost_ex_gst||0),0)); const gst=computed(()=>Math.round(subtotal.value*.1*100)/100); const total=computed(()=>subtotal.value+gst.value)
function selectSuggested(){for(const r of primaryRows.value){r.quantity=r.needsReorder?r.suggestedQty:0;r.selected=r.needsReorder&&r.suggestedQty>0}}
async function load(){loading.value=true;error.value='';try{const [suppliers,products,mappings]:any=await Promise.all([adminFetch('/api/admin/accounting/suppliers'),adminFetch('/api/admin/accounting/store-products'),adminFetch('/api/admin/accounting/product-suppliers')]);supplier.value=(suppliers||[]).find((s:any)=>Number(s.id)===supplierId.value);if(!supplier.value)throw new Error('Supplier not found.');const productMap=new Map((products||[]).map((p:any)=>[Number(p.id),p]));rows.value=(mappings||[]).filter((m:any)=>Number(m.supplier_id)===supplierId.value&&m.is_primary===true).map((m:any)=>{const p:any=productMap.get(Number(m.product_id))||m.products||{};const stock=Number(p.stock||0), low=Number(p.low_stock_level??0), reorder=Number(p.reorder_level??low??0), target=Math.max(Number(p.target_stock_level??reorder??0),reorder);const needs=stock<=reorder;const suggested=Math.max(0,target-stock);return{product_id:Number(m.product_id),name:p.name||m.supplier_product_name||'Product',store_sku:p.product_code||'',supplier_sku:m.supplier_sku||p.product_code||'',stock,low_stock_level:low,reorder_level:reorder,target_stock_level:target,unit_cost_ex_gst:Number(m.buy_price_ex_gst??p.buy_price_ex_gst??0),is_primary:true,needsReorder:needs,suggestedQty:suggested,quantity:needs?suggested:0,selected:needs&&suggested>0}})}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to generate purchase order preview.'}finally{loading.value=false}}
async function createPO(){if(!selectedRows.value.length)return;const payload={supplier_id:supplierId.value,notes:'Generated from supplier primary products and stock levels.',lines:selectedRows.value.map(r=>({product_id:r.product_id,description:r.name,sku:r.supplier_sku,quantity:Number(r.quantity),unit_cost_ex_gst:Number(r.unit_cost_ex_gst)}))};sessionStorage.setItem('kc_po_preview',JSON.stringify(payload));await router.push(`/admin/purchasing/purchase-orders/new?supplier=${supplierId.value}&preview=1`)}
onMounted(load)
</script>

<style scoped>
.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.stat{@apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm}.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}.stat b{@apply mt-2 block text-2xl font-black text-slate-950}.stat small{@apply mt-1 block text-xs text-slate-500}.input{@apply rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50}.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50}.badge{@apply mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black}.badge.amber{@apply bg-amber-100 text-amber-800}.badge.green{@apply bg-emerald-100 text-emerald-700}th{@apply bg-slate-50 px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500}td{@apply border-t border-slate-100 px-3 py-3}.empty{@apply p-8 text-center text-slate-500}
</style>
