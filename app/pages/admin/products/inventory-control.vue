<template>
  <main class="admin-content">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><NuxtLink to="/admin/products" class="text-sm font-bold text-blue-600">← Products</NuxtLink><p class="mt-3 text-xs font-black uppercase tracking-wider text-blue-600">Products</p><h1 class="text-3xl font-black">Inventory Control</h1><p class="text-slate-500">On hand, allocated, available stock and landed inventory value.</p></div>
      <div class="flex flex-wrap gap-2"><NuxtLink to="/admin/products/stocktake" class="btn-secondary">Stocktake</NuxtLink><NuxtLink to="/admin/products/reorder-centre" class="btn-secondary">Reorder Centre</NuxtLink><NuxtLink to="/admin/products/stock-levels" class="btn-secondary">Bulk Stock Levels</NuxtLink><button class="btn-secondary" @click="load">Refresh</button></div>
    </div>
    <div v-if="err" class="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{{err}}</div>
    <section class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div class="metric"><small>On Hand</small><b>{{summary.onHand}}</b></div><div class="metric"><small>Allocated</small><b>{{summary.allocated}}</b></div><div class="metric"><small>Available</small><b>{{summary.available}}</b></div><div class="metric"><small>Landed Stock Value</small><b>{{money(summary.value)}}</b></div></section>
    <section class="panel mt-5 p-4"><input v-model="search" class="input w-full" placeholder="Search product, variant, SKU or category…"></section>
    <section class="panel mt-5 overflow-hidden">
      <div v-if="loading" class="p-10 text-center text-slate-500">Loading inventory…</div>
      <div v-else class="overflow-x-auto"><table class="w-full min-w-[1180px] table-fixed text-sm"><thead><tr class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><th class="w-[31%] p-3">Product</th><th class="w-[13%] px-3">SKU</th><th class="w-[12%] px-3">Category</th><th class="w-[7%] px-3 text-right">On Hand</th><th class="w-[7%] px-3 text-right">Allocated</th><th class="w-[7%] px-3 text-right">Available</th><th class="w-[8%] px-3 text-right">Supplier Cost</th><th class="w-[8%] px-3 text-right">Landed Cost</th><th class="w-[9%] p-3 text-right">Stock Value</th></tr></thead><tbody><tr v-for="x in shown" :key="x.key" class="cursor-pointer border-t hover:bg-blue-50/60" tabindex="0" @click="openItem(x)" @keydown.enter="openItem(x)"><td class="p-3"><b class="text-slate-900">{{x.product_name}}</b><div v-if="x.variant_name" class="text-xs text-slate-500">{{x.variant_name}}</div><div class="mt-1 text-[11px] font-bold text-blue-600">View inventory details</div></td><td class="px-3 break-words">{{x.code||'—'}}</td><td class="px-3">{{x.category}}</td><td class="px-3 text-right font-bold">{{x.stock}}</td><td class="px-3 text-right">{{x.allocated||0}}</td><td class="px-3 text-right" :class="Number(x.available)<=0?'font-bold text-red-600':''">{{x.available}}</td><td class="px-3 text-right">{{money(x.buy_price_ex_gst)}}</td><td class="px-3 text-right">{{money(x.landed_cost_ex_gst)}}</td><td class="p-3 text-right font-bold">{{money(x.stock_value_ex_gst)}}</td></tr></tbody></table></div>
    </section>

    <Teleport to="body"><div v-if="selected" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 sm:p-6" @click.self="closeModal">
      <section class="inventory-modal-shell flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6"><div><p class="text-xs font-black uppercase tracking-wider text-blue-600">Inventory Details</p><h2 class="text-xl font-black sm:text-2xl">{{selected.product_name}}</h2><p class="text-sm text-slate-500">{{selected.variant_name ? selected.variant_name+' · ' : ''}}{{selected.code||'No SKU'}}</p></div><button class="rounded-lg px-3 py-2 text-2xl leading-none text-slate-500 hover:bg-slate-100" @click="closeModal">×</button></header>
        <div v-if="detailLoading" class="flex flex-1 items-center justify-center p-12 text-center text-slate-500">Loading inventory details…</div>
        <template v-else-if="detail">
          <div class="flex min-h-0 flex-1 flex-col">
          <div class="grid shrink-0 gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 lg:grid-cols-6 sm:p-5"><div class="mini"><small>On Hand</small><b>{{detail.product.stock}}</b></div><div class="mini"><small>Allocated</small><b>{{selected.allocated||0}}</b></div><div class="mini"><small>Available</small><b>{{selected.available}}</b></div><div class="mini"><small>On PO</small><b>{{detail.product.on_order||0}}</b></div><div class="mini"><small>Landed Cost</small><b>{{money(detail.product.landed_cost_ex_gst)}}</b></div><div class="mini"><small>Stock Value</small><b>{{money(detail.product.stock_value_ex_gst)}}</b></div></div>
          <nav class="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-3 sm:px-6"><button v-for="t in tabs" :key="t.id" class="whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-bold" :class="tab===t.id?'bg-blue-50 text-blue-700':'text-slate-600 hover:bg-slate-50'" @click="tab=t.id">{{t.label}}</button></nav>
          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div v-if="modalErr" class="mb-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{{modalErr}}</div>
            <div v-if="modalOk" class="mb-4 rounded-xl bg-green-50 p-3 font-semibold text-green-700">{{modalOk}}</div>
            <div v-if="tab==='overview'" class="grid gap-5 lg:grid-cols-2"><div class="subpanel"><h3>Stock settings</h3><dl class="details"><div><dt>Minimum / Low stock</dt><dd>{{detail.product.low_stock_level}}</dd></div><div><dt>Reorder level</dt><dd>{{detail.product.reorder_level}}</dd></div><div><dt>Target stock</dt><dd>{{detail.product.target_stock_level}}</dd></div><div><dt>Supplier cost</dt><dd>{{money(detail.product.buy_price_ex_gst)}}</dd></div><div><dt>Landed cost</dt><dd>{{money(detail.product.landed_cost_ex_gst)}}</dd></div><div><dt>Sell price</dt><dd>{{money(detail.product.sell_price)}}</dd></div></dl></div><div class="subpanel"><h3>Suppliers</h3><div v-if="!detail.suppliers.length" class="empty">No suppliers assigned.</div><div v-for="s in detail.suppliers" :key="s.id" class="flex items-center justify-between gap-4 border-b py-3 last:border-0"><div><b>{{s.accounting_suppliers?.name||'Supplier'}}</b><div class="text-xs text-slate-500">{{s.supplier_sku||'No supplier SKU'}} <span v-if="s.is_primary" class="ml-2 rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-700">Primary</span></div></div><b>{{money(s.buy_price_ex_gst)}}</b></div></div></div>
            <div v-if="tab==='movements'" class="subpanel overflow-x-auto"><h3>Stock movements</h3><div v-if="!detail.movements.length" class="empty">No stock movements recorded.</div><table v-else class="w-full min-w-[760px] text-sm"><thead><tr><th>Date</th><th>Type</th><th class="text-right">Qty</th><th class="text-right">Unit Cost</th><th>Reference</th><th>Notes</th></tr></thead><tbody><tr v-for="m in detail.movements" :key="m.id"><td>{{date(m.movement_date)}}</td><td>{{pretty(m.movement_type)}}</td><td class="text-right font-bold" :class="Number(m.quantity)<0?'text-red-600':'text-green-700'">{{Number(m.quantity)>0?'+':''}}{{m.quantity}}</td><td class="text-right">{{money(m.unit_cost)}}</td><td>{{m.reference||'—'}}</td><td>{{m.notes||'—'}}</td></tr></tbody></table></div>
            <div v-if="tab==='adjust'" class="mx-auto max-w-2xl subpanel"><h3>Manual stock adjustment</h3><p class="mb-4 text-sm text-slate-500">Every adjustment requires a type and reason. The stock movement and matching General Ledger journal are posted together.</p><div class="grid gap-4 sm:grid-cols-2"><label>Direction<select v-model="adjust.direction" class="input mt-1 w-full" @change="adjust.type=defaultAdjustmentType"><option value="in">Increase stock</option><option value="out">Reduce stock</option></select></label><label>Quantity<input v-model="adjust.quantity" type="number" min="1" step="1" inputmode="numeric" class="input mt-1 w-full"></label><label class="sm:col-span-2">Adjustment Type<select v-model="adjust.type" class="input mt-1 w-full"><option v-for="o in adjustmentTypeOptions" :key="o.value" :value="o.value">{{o.label}}</option></select></label><label class="sm:col-span-2">Reason<input v-model="adjust.reason" class="input mt-1 w-full" placeholder="Describe why this adjustment is required"></label><label class="sm:col-span-2">Notes<textarea v-model="adjust.notes" rows="3" class="input mt-1 w-full" placeholder="Optional additional details"></textarea></label></div><div class="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><b>Accounting:</b> {{adjustmentAccountingHint}}</div><div class="mt-5 flex justify-end"><button class="btn-primary" :disabled="saving" @click="saveAdjustment">{{saving?'Posting…':'Post Adjustment'}}</button></div></div>
            <div v-if="tab==='purchases'" class="subpanel overflow-x-auto"><h3>Purchase history</h3><div v-if="!detail.purchases.length" class="empty">No purchase orders found for this product.</div><table v-else class="w-full min-w-[760px] text-sm"><thead><tr><th>Date</th><th>PO</th><th>Supplier</th><th>Status</th><th class="text-right">Qty</th><th class="text-right">Unit Cost</th><th class="text-right">Line Total</th></tr></thead><tbody><tr v-for="p in detail.purchases" :key="p.id"><td>{{date(p.order_date)}}</td><td><NuxtLink :to="`/admin/purchasing/purchase-orders/${p.purchase_order_id}`" class="font-bold text-blue-600">{{p.po_number}}</NuxtLink></td><td>{{p.supplier}}</td><td>{{pretty(p.status)}}</td><td class="text-right">{{p.quantity}}</td><td class="text-right">{{money(p.unit_cost_ex_gst)}}</td><td class="text-right">{{money(p.line_total)}}</td></tr></tbody></table></div>
          </div>
          </div>
        </template>
      </section>
    </div></Teleport>
  </main>
</template>

<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']});
const{adminFetch}=useAdminFetch();
const loading=ref(true),err=ref(''),search=ref(''),items=ref<any[]>([]);
const selected=ref<any|null>(null),detail=ref<any|null>(null),detailLoading=ref(false),tab=ref('overview'),modalErr=ref(''),modalOk=ref(''),saving=ref(false);
const tabs=[{id:'overview',label:'Overview'},{id:'movements',label:'Stock Movements'},{id:'adjust',label:'Adjust Stock'},{id:'purchases',label:'Purchase History'}];
const adjust=reactive({direction:'in',quantity:'1',type:'found_stock',reason:'',notes:''});
const adjustmentTypeOptions=computed(()=>adjust.direction==='out'?[{value:'damaged',label:'Damaged Stock'},{value:'lost_missing',label:'Lost / Missing'},{value:'internal_use',label:'Internal Business Use'},{value:'stocktake_variance',label:'Stocktake Variance'},{value:'correction',label:'Correction'},{value:'other',label:'Other'}]:[{value:'found_stock',label:'Found Stock'},{value:'stocktake_variance',label:'Stocktake Variance'},{value:'opening_stock',label:'Opening Stock'},{value:'correction',label:'Correction'},{value:'other',label:'Other'}]);
const defaultAdjustmentType=computed(()=>adjust.direction==='out'?'damaged':'found_stock');
const adjustmentAccountingHint=computed(()=>{const labels:any={damaged:'Inventory Write-Off Expense',lost_missing:'Inventory Shrinkage Expense',internal_use:'Internal Use / Consumables Expense',stocktake_variance:adjust.direction==='out'?'Inventory Variance Expense':'Inventory Adjustment Gain',opening_stock:'Opening Balance Equity',correction:adjust.direction==='out'?'Inventory Adjustment Expense':'Inventory Adjustment Gain',found_stock:'Inventory Adjustment Gain',other:adjust.direction==='out'?'Inventory Adjustment Expense':'Inventory Adjustment Gain'};return adjust.direction==='out'?`Debit ${labels[adjust.type]||'Inventory Adjustment Expense'} / Credit Inventory Asset`:`Debit Inventory Asset / Credit ${labels[adjust.type]||'Inventory Adjustment Gain'}`});
function adjustmentQuantity(){
  const raw=String(adjust.quantity??'').trim();
  if(!/^\d+$/.test(raw))return 0;
  const qty=Number.parseInt(raw,10);
  return Number.isSafeInteger(qty)&&qty>0?qty:0;
}
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0));
const date=(v:any)=>v?new Intl.DateTimeFormat('en-AU').format(new Date(`${String(v).slice(0,10)}T00:00:00`)):'—';
const pretty=(v:any)=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const shown=computed(()=>{const q=search.value.toLowerCase().trim();return items.value.filter((x:any)=>!q||[x.product_name,x.variant_name,x.code,x.category].some(v=>String(v||'').toLowerCase().includes(q)))});
const summary=computed(()=>({onHand:items.value.reduce((a,x)=>a+Number(x.stock||0),0),allocated:items.value.reduce((a,x)=>a+Number(x.allocated||0),0),available:items.value.reduce((a,x)=>a+Number(x.available||0),0),value:items.value.reduce((a,x)=>a+Number(x.stock_value_ex_gst||0),0)}));
async function load(){loading.value=true;err.value='';try{const r:any=await adminFetch('/api/admin/inventory');items.value=r.items||[]}catch(e:any){err.value=e?.data?.statusMessage||e?.message||'Unable to load inventory.'}finally{loading.value=false}}
async function loadDetail(){if(!selected.value)return;detailLoading.value=true;modalErr.value='';try{const qs=selected.value.variant_id?`?variant_id=${selected.value.variant_id}`:'';detail.value=await adminFetch(`/api/admin/inventory/${selected.value.product_id}${qs}`)}catch(e:any){modalErr.value=e?.data?.statusMessage||e?.message||'Unable to load inventory details.'}finally{detailLoading.value=false}}
async function openItem(x:any){selected.value=x;detail.value=null;tab.value='overview';modalErr.value='';modalOk.value='';adjust.direction='in';adjust.quantity='1';adjust.type='found_stock';adjust.reason='';adjust.notes='';await loadDetail()}
function closeModal(){selected.value=null;detail.value=null}
async function saveAdjustment(){if(!selected.value||saving.value)return;modalErr.value='';modalOk.value='';const qty=adjustmentQuantity();if(qty<=0){modalErr.value='Enter a whole adjustment quantity greater than zero.';return}if(adjust.reason.trim().length<3){modalErr.value='Enter a reason for the adjustment.';return}saving.value=true;try{await adminFetch('/api/admin/accounting/inventory/adjust',{method:'POST',body:{product_id:Number(selected.value.product_id),variant_id:selected.value.variant_id?Number(selected.value.variant_id):null,direction:String(adjust.direction),quantity:qty,adjustment_type:String(adjust.type),reason:adjust.reason.trim(),notes:adjust.notes.trim()}});modalOk.value='Stock adjustment posted successfully.';adjust.quantity='1';adjust.type=defaultAdjustmentType.value;adjust.reason='';adjust.notes='';await load();const fresh=items.value.find((x:any)=>x.key===selected.value.key);if(fresh)selected.value=fresh;await loadDetail();tab.value='movements'}catch(e:any){modalErr.value=e?.data?.statusMessage||e?.data?.message||e?.statusMessage||e?.message||'Unable to post stock adjustment.'}finally{saving.value=false}}
onMounted(load);
</script>

<style scoped>
.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.metric{@apply rounded-xl border border-slate-200 bg-white p-5 shadow-sm}.metric small,.mini small{@apply block text-xs font-bold uppercase text-slate-500}.metric b{@apply mt-1 block text-2xl}.mini{@apply rounded-xl border border-slate-200 bg-white p-3}.mini b{@apply mt-1 block text-lg}.input{@apply rounded-lg border border-slate-300 bg-white px-3 py-2}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50}.btn-primary{@apply rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50}.subpanel{@apply rounded-xl border border-slate-200 bg-white p-4}.subpanel h3{@apply mb-3 text-lg font-black}.details>div{@apply flex justify-between gap-4 border-b py-3 last:border-0}.details dt{@apply text-slate-500}.details dd{@apply font-bold}.empty{@apply py-8 text-center text-sm text-slate-500}table th{@apply whitespace-nowrap px-3 py-3 font-bold}table td{@apply px-3 py-3 align-top}

/* Keep the inventory modal at one physical height on desktop regardless of tab content.
   min-height + height + max-height are intentionally identical so flex/content sizing
   cannot collapse the shell when a short tab is selected. */
.inventory-modal-shell {
  height: calc(100dvh - 1.5rem);
  min-height: calc(100dvh - 1.5rem);
  max-height: calc(100dvh - 1.5rem);
}

@media (min-width: 640px) {
  .inventory-modal-shell {
    height: min(780px, calc(100dvh - 3rem)) !important;
    min-height: min(780px, calc(100dvh - 3rem)) !important;
    max-height: min(780px, calc(100dvh - 3rem)) !important;
  }
}
</style>
