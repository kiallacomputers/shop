<template>
  <main class="po-page">
    <div class="screen-actions">
      <NuxtLink to="/admin/purchasing/purchase-orders" class="btn">← Purchase Orders</NuxtLink>
      <button class="btn primary" @click="printDocument">Print / Save PDF</button>
    </div>

    <section v-if="loading" class="paper"><p>Loading purchase order…</p></section>
    <section v-else-if="error" class="paper"><h1>Purchase Order</h1><p>{{ error }}</p></section>
    <article v-else-if="po" class="paper">
      <header class="header">
        <div class="brand">
          <img src="/kialla-computers-logo.png" alt="Kialla Computers" class="logo">
          <div><h1>Kialla Computers</h1><p>Purchase Order</p></div>
        </div>
        <div class="po-meta">
          <div><span>PO Number</span><strong>{{ po.po_number }}</strong></div>
          <div><span>Order Date</span><strong>{{ date(po.order_date) }}</strong></div>
          <div v-if="po.expected_date"><span>Expected</span><strong>{{ date(po.expected_date) }}</strong></div>
          <div><span>Status</span><strong class="status">{{ statusLabel(po.status) }}</strong></div>
        </div>
      </header>

      <div class="rule"></div>
      <section class="details-grid">
        <div>
          <h2>Supplier</h2>
          <strong>{{ supplier?.name || po.accounting_suppliers?.name || 'Supplier' }}</strong>
          <p v-if="supplier?.contact_name">Attn: {{ supplier.contact_name }}</p>
          <p v-if="supplier?.address">{{ supplier.address }}</p>
          <p v-if="supplier?.email">{{ supplier.email }}</p>
          <p v-if="supplier?.phone">{{ supplier.phone }}</p>
          <p v-if="supplier?.abn">ABN: {{ supplier.abn }}</p>
        </div>
        <div>
          <h2>Order Details</h2>
          <p><b>Supplier reference:</b> {{ po.supplier_reference || '—' }}</p>
          <p><b>Currency:</b> AUD</p>
          <p><b>Prices:</b> Ex GST unless shown otherwise</p>
        </div>
      </section>

      <table class="lines">
        <thead><tr><th>SKU</th><th>Description</th><th class="num">Qty</th><th class="num">Unit ex GST</th><th class="num">Line ex GST</th></tr></thead>
        <tbody>
          <tr v-for="line in po.accounting_purchase_order_lines || []" :key="line.id">
            <td>{{ line.sku || '—' }}</td><td>{{ line.description }}</td><td class="num">{{ number(line.quantity) }}</td><td class="num">{{ money(line.unit_cost_ex_gst) }}</td><td class="num">{{ money(Number(line.quantity || 0) * Number(line.unit_cost_ex_gst || 0)) }}</td>
          </tr>
        </tbody>
      </table>

      <section class="totals">
        <div><span>Subtotal ex GST</span><strong>{{ money(subtotal) }}</strong></div>
        <div><span>GST</span><strong>{{ money(gst) }}</strong></div>
        <div class="grand"><span>Total AUD</span><strong>{{ money(total) }}</strong></div>
      </section>

      <section v-if="po.notes" class="notes"><h2>Notes</h2><p>{{ po.notes }}</p></section>
      <footer>Purchase Order · {{ po.po_number }} · Kialla Computers</footer>
    </article>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['admin'] })
const route = useRoute()
const { adminFetch } = useAdminFetch()
const po = ref<any>(null), supplier = ref<any>(null), loading = ref(true), error = ref('')
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const number=(v:any)=>new Intl.NumberFormat('en-AU',{maximumFractionDigits:2}).format(Number(v||0))
const date=(v:any)=>v?new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${String(v).slice(0,10)}T00:00:00`)):'—'
const statusLabel=(v:any)=>String(v||'draft').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())
const subtotal=computed(()=>Number(po.value?.subtotal ?? (po.value?.accounting_purchase_order_lines||[]).reduce((s:number,l:any)=>s+Number(l.quantity||0)*Number(l.unit_cost_ex_gst||0),0)))
const gst=computed(()=>Number(po.value?.gst_amount ?? subtotal.value*.1))
const total=computed(()=>Number(po.value?.total ?? subtotal.value+gst.value))
function printDocument(){window.print()}
onMounted(async()=>{try{const [orders,suppliers]:any=await Promise.all([adminFetch('/api/admin/accounting/purchase-orders'),adminFetch('/api/admin/accounting/suppliers')]);po.value=(orders||[]).find((x:any)=>String(x.id)===String(route.params.id));if(!po.value)throw new Error('Purchase order not found.');supplier.value=(suppliers||[]).find((x:any)=>String(x.id)===String(po.value.supplier_id))||null}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to load purchase order.'}finally{loading.value=false}})
</script>

<style scoped>
.po-page{min-height:100vh;background:#eef2f7;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a}.screen-actions{max-width:980px;margin:0 auto 14px;display:flex;justify-content:space-between;gap:12px}.btn{border:1px solid #cbd5e1;background:white;border-radius:9px;padding:10px 14px;font-weight:700;font-size:14px}.primary{background:#2563eb;color:white;border-color:#2563eb}.paper{width:100%;max-width:980px;min-height:1120px;margin:auto;background:white;padding:44px 50px;box-shadow:0 12px 30px rgba(15,23,42,.12)}.header{display:flex;justify-content:space-between;gap:35px;align-items:flex-start}.brand{display:flex;gap:18px;align-items:center}.logo{width:150px;max-height:78px;object-fit:contain}.brand h1{font-size:26px;font-weight:900;margin:0}.brand p{font-size:18px;margin:5px 0;color:#475569}.po-meta{min-width:290px}.po-meta div{display:flex;justify-content:space-between;gap:25px;padding:4px 0}.po-meta span{color:#64748b}.status{text-transform:none}.rule{height:3px;background:#1d4ed8;margin:24px 0}.details-grid{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin:22px 0 30px}.details-grid h2,.notes h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:0 0 8px}.details-grid p{margin:4px 0;font-size:14px;white-space:pre-line}.lines{width:100%;border-collapse:collapse;font-size:13px}.lines th{background:#f1f5f9;text-align:left;padding:10px 8px;border-bottom:2px solid #cbd5e1}.lines td{padding:10px 8px;border-bottom:1px solid #e2e8f0}.num{text-align:right!important}.totals{width:340px;margin:22px 0 0 auto}.totals div{display:flex;justify-content:space-between;padding:6px 0}.totals .grand{font-size:18px;border-top:2px solid #0f172a;margin-top:5px;padding-top:10px}.notes{margin-top:32px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0}.notes p{white-space:pre-wrap;margin:0;font-size:13px}footer{margin-top:45px;border-top:1px solid #e2e8f0;padding-top:12px;color:#64748b;font-size:11px;text-align:center}
@media(max-width:700px){.po-page{padding:10px}.paper{padding:24px 18px;min-height:0}.header,.details-grid{display:block}.po-meta{margin-top:20px;min-width:0}.details-grid>div+div{margin-top:22px}.logo{width:110px}.lines{font-size:11px}.totals{width:100%}}
@media print{@page{size:A4;margin:12mm}.po-page{background:white;padding:0}.screen-actions{display:none!important}.paper{max-width:none;min-height:0;padding:0;box-shadow:none}.btn{display:none!important}footer{position:relative;page-break-inside:avoid}.lines tr{page-break-inside:avoid}.notes,.totals{page-break-inside:avoid}}
</style>
