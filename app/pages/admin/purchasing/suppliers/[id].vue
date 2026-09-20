<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />
    <NuxtLink to="/admin/purchasing/suppliers" class="text-sm font-bold text-blue-600">← Suppliers</NuxtLink>

    <div v-if="loading" class="panel mt-5 p-8 text-center text-slate-500">Loading supplier…</div>
    <div v-else-if="!supplier" class="panel mt-5 p-8 text-center">
      <h1 class="text-2xl font-black">Supplier not found</h1>
      <p class="mt-2 text-slate-500">This supplier could not be loaded.</p>
    </div>

    <template v-else>
      <div class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[.16em] text-blue-600">Supplier</p>
          <h1 class="text-3xl font-black text-slate-950">{{ supplier.name }}</h1>
          <p class="mt-1 text-slate-500">Supplier details, products, purchase orders, bills and payment history.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="secondary" @click="editing=true">Edit Supplier</button>
          <NuxtLink :to="`/admin/purchasing/suppliers/${supplier.id}/purchase-order-preview`" class="secondary">Generate PO Preview</NuxtLink>
          <NuxtLink :to="`/admin/purchasing/purchase-orders/new?supplier=${supplier.id}`" class="primary">+ Purchase Order</NuxtLink>
        </div>
      </div>

      <div v-if="msg" class="mt-4 rounded-xl bg-slate-100 p-3 text-sm font-semibold">{{ msg }}</div>

      <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="stat"><span>Open Purchase Orders</span><b>{{ openPOs.length }}</b><small>{{ money(openPOValue) }}</small></div>
        <div class="stat"><span>Supplier Bills</span><b>{{ bills.length }}</b><small>{{ money(billTotal) }} total</small></div>
        <div class="stat"><span>Outstanding</span><b>{{ money(outstanding) }}</b><small>{{ overdueBills.length }} overdue bill{{ overdueBills.length === 1 ? '' : 's' }}</small></div>
        <div class="stat"><span>Assigned Products</span><b>{{ supplierProducts.length }}</b><small>{{ primaryProducts }} primary</small></div>
      </section>

      <div class="mt-5 grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="panel p-5">
          <div class="flex items-center justify-between gap-3"><h2 class="text-xl font-black">Supplier Details</h2><button class="text-sm font-bold text-blue-600" @click="editing=true">Edit</button></div>
          <dl class="mt-4 space-y-3 text-sm">
            <div><dt>Contact</dt><dd>{{ supplier.contact_name || '—' }}</dd></div>
            <div><dt>Email</dt><dd><a v-if="supplier.email" :href="`mailto:${supplier.email}`" class="text-blue-600 hover:underline">{{ supplier.email }}</a><span v-else>—</span></dd></div>
            <div><dt>Phone</dt><dd>{{ supplier.phone || '—' }}</dd></div>
            <div><dt>ABN</dt><dd>{{ supplier.abn || '—' }}</dd></div>
            <div><dt>Address</dt><dd class="whitespace-pre-line">{{ supplier.address || '—' }}</dd></div>
            <div><dt>Notes</dt><dd class="whitespace-pre-line">{{ supplier.notes || '—' }}</dd></div>
          </dl>
        </section>

        <section class="panel overflow-hidden">
          <div class="border-b p-5"><h2 class="text-xl font-black">Assigned Products</h2><p class="mt-1 text-sm text-slate-500">Products mapped to this supplier with supplier SKU and purchasing price.</p></div>
          <div class="overflow-x-auto"><table class="w-full min-w-[720px] text-sm"><thead><tr><th>Product</th><th>Store SKU</th><th>Supplier SKU</th><th class="text-right">Buy ex GST</th><th>Type</th></tr></thead><tbody>
            <tr v-for="m in supplierProducts" :key="m.id"><td class="font-bold">{{ m.products?.name || m.supplier_product_name || 'Product' }}</td><td>{{ m.products?.product_code || '—' }}</td><td>{{ m.supplier_sku || '—' }}</td><td class="text-right">{{ m.buy_price_ex_gst == null ? 'Store price' : money(m.buy_price_ex_gst) }}</td><td><span v-if="m.is_primary" class="badge blue">Primary</span><span v-else class="badge">Supplier</span></td></tr>
            <tr v-if="!supplierProducts.length"><td colspan="5" class="empty">No products are assigned to this supplier.</td></tr>
          </tbody></table></div>
        </section>
      </div>

      <section class="panel mt-5 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 class="text-xl font-black">Purchase Orders</h2><p class="mt-1 text-sm text-slate-500">Current and previous purchase orders for {{ supplier.name }}.</p></div><NuxtLink :to="`/admin/purchasing/purchase-orders/new?supplier=${supplier.id}`" class="secondary">+ New PO</NuxtLink></div>
        <div class="overflow-x-auto"><table class="w-full min-w-[900px] text-sm"><thead><tr><th>PO</th><th>Order Date</th><th>Expected</th><th>Status</th><th class="text-right">Total</th><th>Bill</th><th></th></tr></thead><tbody>
          <tr v-for="po in supplierPOs" :key="po.id"><td class="font-black">{{ po.po_number || `PO-${po.id}` }}</td><td>{{ date(po.order_date) }}</td><td>{{ date(po.expected_date) }}</td><td><span class="badge" :class="statusClass(po.status)">{{ label(po.status) }}</span></td><td class="text-right font-bold">{{ money(po.total) }}</td><td>{{ po.bill_number || '—' }}</td><td class="text-right"><NuxtLink v-if="String(po.status).toLowerCase()==='draft'" :to="`/admin/purchasing/purchase-orders/new?edit=${po.id}`" class="table-link">Edit</NuxtLink><NuxtLink :to="`/admin/purchasing/purchase-orders/${po.id}/print`" class="table-link">Print</NuxtLink></td></tr>
          <tr v-if="!supplierPOs.length"><td colspan="7" class="empty">No purchase orders for this supplier.</td></tr>
        </tbody></table></div>
      </section>

      <div class="mt-5 grid gap-5 xl:grid-cols-2">
        <section class="panel overflow-hidden">
          <div class="flex items-center justify-between gap-3 border-b p-5"><div><h2 class="text-xl font-black">Bills</h2><p class="mt-1 text-sm text-slate-500">Supplier invoices and outstanding balances.</p></div><NuxtLink to="/admin/purchasing/suppliers/bills" class="secondary">All Bills</NuxtLink></div>
          <div class="overflow-x-auto"><table class="w-full min-w-[650px] text-sm"><thead><tr><th>Bill</th><th>Due</th><th>Status</th><th class="text-right">Total</th><th class="text-right">Owing</th></tr></thead><tbody>
            <tr v-for="b in bills" :key="b.id"><td><b>{{ b.bill_number }}</b><div class="text-xs text-slate-400">{{ b.supplier_invoice_number || '' }}</div></td><td>{{ date(b.due_date) }}</td><td><span class="badge" :class="owing(b)<=0?'green':isOverdue(b)?'red':''">{{ owing(b)<=0?'Paid':label(b.status) }}</span></td><td class="text-right">{{ money(b.total) }}</td><td class="text-right font-black">{{ money(owing(b)) }}</td></tr>
            <tr v-if="!bills.length"><td colspan="5" class="empty">No bills for this supplier.</td></tr>
          </tbody></table></div>
        </section>

        <section class="panel overflow-hidden">
          <div class="border-b p-5"><h2 class="text-xl font-black">Payment History</h2><p class="mt-1 text-sm text-slate-500">Payments recorded against this supplier's bills.</p></div>
          <div class="overflow-x-auto"><table class="w-full min-w-[580px] text-sm"><thead><tr><th>Date</th><th>Bill</th><th>Reference</th><th class="text-right">Amount</th></tr></thead><tbody>
            <tr v-for="p in payments" :key="p.id"><td>{{ date(p.payment_date || p.created_at) }}</td><td>{{ p.accounting_supplier_bills?.bill_number || '—' }}</td><td>{{ p.reference || '—' }}</td><td class="text-right font-black">{{ money(p.amount) }}</td></tr>
            <tr v-if="!payments.length"><td colspan="4" class="empty">No supplier payments recorded yet.</td></tr>
          </tbody></table></div>
        </section>
      </div>
    </template>

    <div v-if="editing && supplier" class="modal-backdrop" @click.self="editing=false">
      <section class="modal-card"><div class="flex items-start justify-between gap-4 border-b p-5"><div><h2 class="text-xl font-black">Edit Supplier</h2><p class="text-sm text-slate-500">Update supplier details without changing linked purchasing history.</p></div><button class="close-btn" @click="editing=false">×</button></div>
        <div class="grid gap-3 p-5 sm:grid-cols-2"><label class="field sm:col-span-2"><span>Supplier name *</span><input v-model="edit.name" class="input"></label><label class="field"><span>Contact</span><input v-model="edit.contact_name" class="input"></label><label class="field"><span>ABN</span><input v-model="edit.abn" class="input"></label><label class="field"><span>Email</span><input v-model="edit.email" class="input"></label><label class="field"><span>Phone</span><input v-model="edit.phone" class="input"></label><label class="field sm:col-span-2"><span>Address</span><textarea v-model="edit.address" rows="3" class="input"></textarea></label><label class="field sm:col-span-2"><span>Notes</span><textarea v-model="edit.notes" rows="4" class="input"></textarea></label></div>
        <div class="flex justify-end gap-2 border-t p-5"><button class="secondary" @click="editing=false">Cancel</button><button class="primary" :disabled="saving" @click="saveSupplier">{{ saving ? 'Saving…' : 'Save Supplier' }}</button></div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:['admin'] })
const route=useRoute(); const {adminFetch}=useAdminFetch()
const id=computed(()=>Number(route.params.id)); const loading=ref(true); const msg=ref(''); const saving=ref(false); const editing=ref(false)
const suppliers=ref<any[]>([]), mappings=ref<any[]>([]), pos=ref<any[]>([]), allBills=ref<any[]>([]), allPayments=ref<any[]>([])
const supplier=computed(()=>suppliers.value.find((s:any)=>Number(s.id)===id.value)||null)
const supplierProducts=computed(()=>mappings.value.filter((m:any)=>Number(m.supplier_id)===id.value))
const supplierPOs=computed(()=>pos.value.filter((p:any)=>Number(p.supplier_id)===id.value))
const bills=computed(()=>allBills.value.filter((b:any)=>Number(b.supplier_id)===id.value))
const billIds=computed(()=>new Set(bills.value.map((b:any)=>Number(b.id))))
const payments=computed(()=>allPayments.value.filter((p:any)=>billIds.value.has(Number(p.bill_id))))
const openPOs=computed(()=>supplierPOs.value.filter((p:any)=>!['billed','closed'].includes(String(p.status||'').toLowerCase())))
const openPOValue=computed(()=>openPOs.value.reduce((n:number,p:any)=>n+Number(p.total||0),0)); const billTotal=computed(()=>bills.value.reduce((n:number,b:any)=>n+Number(b.total||0),0)); const outstanding=computed(()=>bills.value.reduce((n:number,b:any)=>n+owing(b),0)); const overdueBills=computed(()=>bills.value.filter(isOverdue)); const primaryProducts=computed(()=>supplierProducts.value.filter((m:any)=>m.is_primary).length)
const edit=reactive<any>({name:'',contact_name:'',email:'',phone:'',abn:'',address:'',notes:''})
watch([supplier,editing],()=>{if(editing.value&&supplier.value)Object.assign(edit,{name:supplier.value.name||'',contact_name:supplier.value.contact_name||'',email:supplier.value.email||'',phone:supplier.value.phone||'',abn:supplier.value.abn||'',address:supplier.value.address||'',notes:supplier.value.notes||''})})
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0)); const date=(v:any)=>v?new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v)):'—'; const label=(v:any)=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()); const owing=(b:any)=>Math.max(0,Number(b.total||0)-Number(b.paid_amount||0)); const isOverdue=(b:any)=>owing(b)>0&&b.due_date&&new Date(b.due_date)<new Date(new Date().toDateString()); const statusClass=(s:any)=>['received','paid','billed'].includes(String(s||'').toLowerCase())?'green':['draft'].includes(String(s||'').toLowerCase())?'':['closed'].includes(String(s||'').toLowerCase())?'red':'blue'
async function load(){loading.value=true;msg.value='';try{const [s,m,p,b,pay]=await Promise.all([adminFetch('/api/admin/accounting/suppliers'),adminFetch('/api/admin/accounting/product-suppliers'),adminFetch('/api/admin/accounting/purchase-orders'),adminFetch('/api/admin/accounting/supplier-bills'),adminFetch('/api/admin/accounting/supplier-payments')]);suppliers.value=s||[];mappings.value=m||[];pos.value=p||[];allBills.value=b||[];allPayments.value=pay||[]}catch(e:any){msg.value=e?.data?.statusMessage||e?.message||'Unable to load supplier.'}finally{loading.value=false}}
async function saveSupplier(){if(!String(edit.name||'').trim()){msg.value='Supplier name is required.';return}saving.value=true;try{await adminFetch(`/api/admin/accounting/suppliers/${id.value}`,{method:'PUT',body:edit});editing.value=false;msg.value='Supplier updated.';await load()}catch(e:any){msg.value=e?.data?.statusMessage||e?.message||'Unable to update supplier.'}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>
.panel{@apply rounded-2xl border border-slate-200 bg-white shadow-sm}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50}.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50}.stat{@apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm}.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}.stat b{@apply mt-2 block text-2xl font-black text-slate-950}.stat small{@apply mt-1 block text-xs font-semibold text-slate-500}dt{@apply text-xs font-black uppercase tracking-wide text-slate-400}dd{@apply mt-1 font-semibold text-slate-800}th{@apply border-b bg-slate-50 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500}td{@apply border-b border-slate-100 px-4 py-3}.empty{@apply p-8 text-center text-slate-500}.badge{@apply inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700}.badge.blue{@apply bg-blue-100 text-blue-700}.badge.green{@apply bg-emerald-100 text-emerald-700}.badge.red{@apply bg-red-100 text-red-700}.table-link{@apply ml-3 font-bold text-blue-600 hover:underline}.modal-backdrop{@apply fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4}.modal-card{@apply max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl}.close-btn{@apply flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-xl font-bold}.field{@apply grid gap-1 text-sm font-bold text-slate-700}.input{@apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm}
</style>
