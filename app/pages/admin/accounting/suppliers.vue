<template>
  <main class="admin-core-page mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />
    <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600">← Accounting</NuxtLink>
    <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-black">Suppliers</h1>
        <p class="text-slate-500">Manage supplier details and connect store products to the suppliers you purchase them from.</p>
      </div>
      <NuxtLink to="/admin/accounting/purchases" class="primary">Purchase Orders →</NuxtLink>
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
          <div v-for="s in suppliers" :key="s.id" class="flex items-center justify-between gap-3 p-4">
            <div class="min-w-0"><b class="block truncate">{{ s.name }}</b><span class="text-xs text-slate-500">{{ s.contact_name || 'No contact' }}<template v-if="s.email"> · {{ s.email }}</template></span></div>
            <NuxtLink :to="`/admin/accounting/purchases?supplier=${s.id}`" class="secondary shrink-0">New PO</NuxtLink>
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
.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.input{@apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white}.secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold}.badge{@apply rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700}
</style>
