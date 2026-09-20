<template>
  <main class="admin-core-page mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />
    <NuxtLink to="/admin/purchasing" class="text-sm font-bold text-blue-600">← Purchasing</NuxtLink>
    <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-black">Suppliers</h1>
        <p class="text-slate-500">Manage supplier details and connect store products to the suppliers you purchase them from.</p>
      </div>
      <NuxtLink to="/admin/purchasing/purchase-orders" class="primary">Purchase Orders →</NuxtLink>
    </div>
    <div v-if="msg" class="my-4 rounded-lg bg-slate-100 p-3">{{ msg }}</div>

    <div class="mt-5 grid gap-5 xl:grid-cols-2">
      <section class="panel p-5">
        <h2 class="text-xl font-black">Supplier Directory</h2>
        <p class="mt-1 text-sm text-slate-500">Add suppliers used for stock purchasing and Accounts Payable.</p>
        <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input v-model="supplier.name" class="input" placeholder="Supplier name">
          <input v-model="supplier.contact_name" class="input" placeholder="Contact">
          <input v-model="supplier.email" class="input" placeholder="Email">
          <input v-model="supplier.phone" class="input" placeholder="Phone">
          <input v-model="supplier.abn" class="input" placeholder="ABN">
          <button class="primary" @click="addSupplier">Add Supplier</button>
        </div>
        <div class="mt-5 divide-y rounded-xl border border-slate-200">
          <div v-if="!suppliers.length" class="p-4 text-sm text-slate-500">No suppliers have been added yet.</div>
          <div v-for="s in suppliers" :key="s.id" class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <b class="block truncate">{{ s.name }}</b>
              <span class="text-xs text-slate-500">{{ s.contact_name || 'No contact' }}<template v-if="s.email"> · {{ s.email }}</template><template v-if="s.phone"> · {{ s.phone }}</template></span>
              <div v-if="s.address || s.abn" class="mt-1 text-xs text-slate-400"><template v-if="s.abn">ABN {{ s.abn }}</template><template v-if="s.abn && s.address"> · </template>{{ s.address || '' }}</div>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <button class="secondary" @click="openEdit(s)">Edit</button>
              <NuxtLink :to="`/admin/purchasing/purchase-orders?supplier=${s.id}`" class="secondary">New PO</NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <section class="panel p-5">
        <h2 class="text-xl font-black">Supplier Products</h2>
        <p class="mt-1 text-sm text-slate-500">Assign products to suppliers, record supplier SKUs and maintain supplier-specific buy prices.</p>
        <select v-model.number="mapping.product_id" class="input mt-3"><option :value="0">Choose store product…</option><option v-for="x in products" :key="x.id" :value="x.id">{{ x.name }} · {{ x.product_code || 'No product code' }}</option></select>
        <select v-model.number="mapping.supplier_id" class="input mt-2"><option :value="0">Choose supplier…</option><option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option></select>
        <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"><input v-model="mapping.supplier_sku" class="input" placeholder="Supplier SKU / code"><input v-model.number="mapping.buy_price_ex_gst" type="number" step=".01" class="input" placeholder="Buy price ex GST"></div>
        <input v-model="mapping.supplier_product_name" class="input mt-2" placeholder="Supplier's product name (optional)">
        <label class="mt-3 flex items-center gap-2 text-sm font-bold"><input v-model="mapping.is_primary" type="checkbox"> Primary supplier for this product</label>
        <button class="primary mt-3" @click="assignSupplier">Save Product Supplier</button>
        <div class="mt-5 max-h-[420px] overflow-auto divide-y rounded-xl border border-slate-200">
          <div v-if="!mappings.length" class="p-4 text-sm text-slate-500">No supplier products have been assigned yet.</div>
          <div v-for="m in mappings" :key="m.id" class="p-4 text-sm"><div class="flex flex-wrap items-center gap-2"><b>{{ m.products?.name }}</b><span>→ {{ m.accounting_suppliers?.name }}</span><span v-if="m.is_primary" class="badge">Primary</span></div><div class="mt-1 text-xs text-slate-500">{{ m.supplier_sku || 'No supplier SKU' }} · {{ m.buy_price_ex_gst == null ? 'Store buy price' : money(m.buy_price_ex_gst) + ' ex GST' }}</div></div>
        </div>
      </section>
    </div>

    <div v-if="editing" class="modal-backdrop" @click.self="closeEdit">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-supplier-title">
        <div class="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div><h2 id="edit-supplier-title" class="text-xl font-black">Edit Supplier</h2><p class="mt-1 text-sm text-slate-500">Update supplier contact and business details without changing its purchasing history.</p></div>
          <button class="close-btn" aria-label="Close" @click="closeEdit">×</button>
        </div>
        <div class="grid gap-3 p-5 sm:grid-cols-2">
          <label class="field sm:col-span-2"><span>Supplier name *</span><input v-model="editSupplier.name" class="input"></label>
          <label class="field"><span>Contact name</span><input v-model="editSupplier.contact_name" class="input"></label>
          <label class="field"><span>ABN</span><input v-model="editSupplier.abn" class="input"></label>
          <label class="field"><span>Email</span><input v-model="editSupplier.email" type="email" class="input"></label>
          <label class="field"><span>Phone</span><input v-model="editSupplier.phone" class="input"></label>
          <label class="field sm:col-span-2"><span>Address</span><textarea v-model="editSupplier.address" rows="3" class="input"></textarea></label>
          <label class="field sm:col-span-2"><span>Notes</span><textarea v-model="editSupplier.notes" rows="4" class="input"></textarea></label>
        </div>
        <div class="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-5">
          <button class="secondary" :disabled="savingSupplier" @click="closeEdit">Cancel</button>
          <button class="primary" :disabled="savingSupplier" @click="saveSupplier">{{ savingSupplier ? 'Saving…' : 'Save Supplier' }}</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const { adminFetch } = useAdminFetch()
const suppliers = ref<any[]>([])
const products = ref<any[]>([])
const mappings = ref<any[]>([])
const msg = ref('')
const supplier = reactive<any>({ name: '', contact_name: '', email: '', phone: '', abn: '' })
const editing = ref(false)
const savingSupplier = ref(false)
const editSupplier = reactive<any>({ id: null, name: '', contact_name: '', email: '', phone: '', abn: '', address: '', notes: '' })
const mapping = reactive<any>({ product_id: 0, supplier_id: 0, supplier_sku: '', supplier_product_name: '', buy_price_ex_gst: '', is_primary: false })
const money = (v:any) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(v || 0))
async function load() {
  msg.value = ''
  const results = await Promise.allSettled([
    adminFetch('/api/admin/accounting/suppliers'),
    adminFetch('/api/admin/accounting/store-products'),
    adminFetch('/api/admin/accounting/product-suppliers')
  ])
  const targets = [suppliers, products, mappings]
  results.forEach((r:any, i) => { if (r.status === 'fulfilled') targets[i].value = r.value || []; else console.error('SUPPLIER LOAD ERROR', r.reason) })
  if (results.some((r:any) => r.status === 'rejected')) msg.value = 'Some supplier data could not be loaded. Check the server log for details.'
}
async function addSupplier() {
  try {
    if (!supplier.name.trim()) { msg.value = 'Enter a supplier name.'; return }
    await adminFetch('/api/admin/accounting/suppliers', { method: 'POST', body: supplier })
    Object.assign(supplier, { name: '', contact_name: '', email: '', phone: '', abn: '' })
    msg.value = 'Supplier added.'
    await load()
  } catch (e:any) { msg.value = e?.data?.statusMessage || e.message }
}
function openEdit(s:any) {
  Object.assign(editSupplier, { id: s.id, name: s.name || '', contact_name: s.contact_name || '', email: s.email || '', phone: s.phone || '', abn: s.abn || '', address: s.address || '', notes: s.notes || '' })
  editing.value = true
}
function closeEdit() { if (!savingSupplier.value) editing.value = false }
async function saveSupplier() {
  try {
    if (!editSupplier.id) return
    if (!String(editSupplier.name || '').trim()) { msg.value = 'Enter a supplier name.'; return }
    savingSupplier.value = true
    await adminFetch(`/api/admin/accounting/suppliers/${editSupplier.id}`, { method: 'PUT', body: { name: editSupplier.name, contact_name: editSupplier.contact_name, email: editSupplier.email, phone: editSupplier.phone, abn: editSupplier.abn, address: editSupplier.address, notes: editSupplier.notes } })
    editing.value = false
    msg.value = 'Supplier updated.'
    await load()
  } catch (e:any) { msg.value = e?.data?.statusMessage || e.message }
  finally { savingSupplier.value = false }
}
async function assignSupplier() {
  try {
    if (!mapping.product_id || !mapping.supplier_id) { msg.value = 'Choose both a product and supplier.'; return }
    await adminFetch('/api/admin/accounting/product-suppliers', { method: 'POST', body: mapping })
    Object.assign(mapping, { product_id: 0, supplier_id: 0, supplier_sku: '', supplier_product_name: '', buy_price_ex_gst: '', is_primary: false })
    msg.value = 'Product supplier saved.'
    await load()
  } catch (e:any) { msg.value = e?.data?.statusMessage || e.message }
}
onMounted(load)
</script>

<style scoped>
.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.input{@apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white}.secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold}.badge{@apply rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700}.modal-backdrop{@apply fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4}.modal-card{@apply max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl}.close-btn{@apply flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-600}.field{@apply grid gap-1 text-sm font-bold text-slate-700}.primary:disabled,.secondary:disabled{@apply cursor-not-allowed opacity-60}
</style>
