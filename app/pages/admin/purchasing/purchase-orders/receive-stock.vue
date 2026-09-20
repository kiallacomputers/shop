<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />

    <div class="mt-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <NuxtLink to="/admin/purchasing/purchase-orders" class="text-sm font-bold text-blue-600">← Purchase Orders</NuxtLink>
        <h1 class="mt-2 text-3xl font-black text-slate-950">Receive Stock</h1>
        <p class="mt-1 text-slate-500">Receive full or partial supplier deliveries and move completed purchase orders through to billing.</p>
      </div>
      <button class="secondary" :disabled="loading" @click="load">{{ loading ? 'Refreshing…' : 'Refresh' }}</button>
    </div>

    <div v-if="msg" class="my-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{{ msg }}</div>

    <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="metric"><span>POs awaiting stock</span><strong>{{ receivable.length }}</strong></div>
      <div class="metric"><span>Partially received</span><strong>{{ partialCount }}</strong></div>
      <div class="metric"><span>Outstanding units</span><strong>{{ outstandingUnits }}</strong></div>
      <div class="metric"><span>Ready for billing</span><strong>{{ readyForBilling.length }}</strong></div>
    </section>

    <section class="panel mt-5 p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="text-xl font-black">Purchase Orders Awaiting Stock</h2><p class="text-sm text-slate-500">Select a PO to receive all or part of the outstanding delivery.</p></div>
      </div>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[1050px] text-sm">
          <thead><tr class="border-b text-left text-xs uppercase tracking-wide text-slate-500"><th class="p-2">PO</th><th>Supplier</th><th>Expected</th><th>Status</th><th>Progress</th><th>Outstanding</th><th class="text-right">Total</th><th></th></tr></thead>
          <tbody>
            <tr v-for="x in receivable" :key="x.id" class="border-b last:border-0">
              <td class="p-2"><div class="font-black text-slate-900">{{ x.po_number }}</div><div class="text-xs text-slate-500">{{ x.order_date }}</div></td>
              <td class="font-semibold">{{ x.accounting_suppliers?.name || '—' }}</td>
              <td>{{ x.expected_date || '—' }}</td>
              <td><span class="badge" :class="statusClass(x.status)">{{ statusLabel(x.status) }}</span></td>
              <td class="min-w-56"><div class="flex justify-between text-xs font-semibold"><span>{{ receivedUnits(x) }} / {{ orderedUnits(x) }} units</span><span>{{ progress(x) }}%</span></div><div class="progress mt-1"><span :style="{width: `${progress(x)}%`}" /></div></td>
              <td><div class="font-bold">{{ outstandingUnitsFor(x) }} units</div><div class="text-xs text-slate-500">{{ outstandingLines(x) }} line{{ outstandingLines(x) === 1 ? '' : 's' }}</div></td>
              <td class="text-right font-bold">{{ money(x.total) }}</td>
              <td class="text-right"><button class="primary" @click="openReceive(x)">Receive Stock</button></td>
            </tr>
            <tr v-if="!receivable.length"><td colspan="8" class="p-10 text-center text-slate-500">No purchase orders are waiting for stock.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel mt-5 p-5">
      <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-xl font-black">Received Purchase Orders</h2><p class="text-sm text-slate-500">Fully received orders, including their next billing action.</p></div><NuxtLink to="/admin/purchasing/suppliers/bills" class="secondary">Open Bills</NuxtLink></div>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[900px] text-sm">
          <thead><tr class="border-b text-left text-xs uppercase tracking-wide text-slate-500"><th class="p-2">PO</th><th>Supplier</th><th>Received</th><th>Status</th><th class="text-right">Total</th><th class="text-right">Next action</th></tr></thead>
          <tbody>
            <tr v-for="x in completed" :key="x.id" class="border-b last:border-0"><td class="p-2 font-black">{{ x.po_number }}</td><td>{{ x.accounting_suppliers?.name || '—' }}</td><td><button class="link" @click="showHistory(x)">View receiving history</button></td><td><span class="badge" :class="statusClass(x.status)">{{ statusLabel(x.status) }}</span></td><td class="text-right font-bold">{{ money(x.total) }}</td><td class="text-right"><NuxtLink v-if="x.is_billed" to="/admin/purchasing/suppliers/bills" class="secondary">View {{ x.bill_number || 'Bill' }}</NuxtLink><button v-else class="primary" @click="createBill(x)">Create Supplier Bill</button></td></tr>
            <tr v-if="!completed.length"><td colspan="6" class="p-8 text-center text-slate-500">No fully received purchase orders yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="receiving" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" @click.self="closeReceive">
      <div class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex flex-wrap items-start justify-between gap-3"><div><div class="text-xs font-black uppercase tracking-widest text-blue-600">Stock Receipt</div><h2 class="text-2xl font-black">{{ receiving.po_number }}</h2><p class="text-sm text-slate-500">{{ receiving.accounting_suppliers?.name }} · {{ statusLabel(receiving.status) }}</p></div><button class="secondary" @click="closeReceive">Close</button></div>

        <div class="mt-5 grid gap-3 md:grid-cols-3"><label class="field"><span>Received date</span><input v-model="receipt.received_date" type="date" class="input"></label><label class="field md:col-span-2"><span>Delivery docket / supplier reference</span><input v-model="receipt.supplier_reference" class="input" placeholder="e.g. Docket 12345"></label></div>

        <div class="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table class="w-full min-w-[850px] text-sm"><thead class="bg-slate-50"><tr class="text-left text-xs uppercase tracking-wide text-slate-500"><th class="p-3">Product</th><th>Ordered</th><th>Previously received</th><th>Outstanding</th><th class="w-36">Receive now</th><th>After receipt</th></tr></thead><tbody><tr v-for="l in receiving.accounting_purchase_order_lines" :key="l.id" class="border-t"><td class="p-3"><b>{{ l.description }}</b><div class="text-xs text-slate-500">{{ l.sku || (l.product_id ? `Product #${l.product_id}` : 'Non-stock line') }}</div></td><td>{{ qty(l.quantity) }}</td><td>{{ qty(l.received_quantity) }}</td><td class="font-bold">{{ qty(l.remaining_quantity) }}</td><td><input v-if="l.product_id && Number(l.remaining_quantity)>0" v-model.number="receiptQty[l.id]" type="number" min="0" :max="l.remaining_quantity" step="1" class="input" @input="clampQty(l)"><span v-else class="text-xs text-slate-400">{{ l.product_id ? 'Complete' : 'Non-stock' }}</span></td><td><span class="font-semibold" :class="afterRemaining(l) === 0 ? 'text-emerald-700' : 'text-slate-700'">{{ afterRemaining(l) === 0 ? 'Complete' : `${qty(afterRemaining(l))} remaining` }}</span></td></tr></tbody></table></div>

        <div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"><label class="field"><span>Receiving notes</span><textarea v-model="receipt.notes" class="input" rows="3" placeholder="Optional notes about this delivery"></textarea></label><div class="summary"><span>Receiving now</span><strong>{{ qty(receiveNowTotal) }} units</strong><small>{{ receiveNowLines }} line{{ receiveNowLines === 1 ? '' : 's' }}</small></div></div>

        <div v-if="historyLoading" class="mt-4 text-sm text-slate-500">Loading previous receipts…</div>
        <div v-else-if="receiptHistory.length" class="mt-5 rounded-xl border border-slate-200 p-4"><button class="flex w-full items-center justify-between text-left font-black" @click="historyOpen=!historyOpen"><span>Previous receipts ({{ receiptHistory.length }})</span><span>{{ historyOpen ? '−' : '+' }}</span></button><div v-if="historyOpen" class="mt-3 space-y-3"><div v-for="h in receiptHistory" :key="h.id" class="rounded-lg bg-slate-50 p-3"><div class="flex flex-wrap justify-between gap-2"><div><b>{{ h.received_date }}</b><span v-if="h.supplier_reference" class="ml-2 text-slate-500">{{ h.supplier_reference }}</span></div><b>{{ qty(historyQty(h)) }} units</b></div><div v-if="h.notes" class="mt-1 text-sm text-slate-600">{{ h.notes }}</div><div class="mt-2 text-xs text-slate-500">{{ historyLineText(h) }}</div></div></div></div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-3"><div class="text-sm text-slate-500">Stock levels and weighted-average buy cost update when this receipt is posted.</div><button class="primary" :disabled="saving || receiveNowTotal <= 0" @click="receiveStock">{{ saving ? 'Receiving…' : 'Post Stock Receipt' }}</button></div>
      </div>
    </div>

    <div v-if="historyPo" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" @click.self="historyPo=null"><div class="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div class="flex justify-between gap-3"><div><h2 class="text-xl font-black">Receiving History — {{ historyPo.po_number }}</h2><p class="text-sm text-slate-500">{{ historyPo.accounting_suppliers?.name }}</p></div><button class="secondary" @click="historyPo=null">Close</button></div><div v-if="historyLoading" class="py-8 text-center text-slate-500">Loading…</div><div v-else class="mt-4 space-y-3"><div v-for="h in receiptHistory" :key="h.id" class="rounded-xl border border-slate-200 p-4"><div class="flex flex-wrap justify-between gap-2"><div><b>{{ h.received_date }}</b><div class="text-sm text-slate-500">{{ h.supplier_reference || 'No supplier reference' }}</div></div><b>{{ qty(historyQty(h)) }} units</b></div><div v-if="h.notes" class="mt-2 text-sm">{{ h.notes }}</div><div class="mt-2 text-xs text-slate-500">{{ historyLineText(h) }}</div></div><div v-if="!receiptHistory.length" class="py-8 text-center text-slate-500">No receipt history found.</div></div></div></div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const { adminFetch } = useAdminFetch()
const dialog = useAppDialog()
const pos = ref<any[]>([]), msg = ref(''), receiving = ref<any>(null), historyPo = ref<any>(null)
const receiptQty = reactive<Record<number, number>>({})
const receipt = reactive<any>({ received_date: new Date().toISOString().slice(0, 10), supplier_reference: '', notes: '' })
const receiptHistory = ref<any[]>([]), historyLoading = ref(false), historyOpen = ref(false), loading = ref(false), saving = ref(false)

const money = (v:any) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(v || 0))
const qty = (v:any) => Number(v || 0).toLocaleString('en-AU', { maximumFractionDigits: 2 })
const lines = (x:any) => x?.accounting_purchase_order_lines || []
const canReceive = (x:any) => ['sent', 'ordered', 'part_received'].includes(String(x?.status || '').toLowerCase())
const hasReceivable = (x:any) => lines(x).some((l:any) => l.product_id && Number(l.remaining_quantity || 0) > 0)
const receivable = computed(() => pos.value.filter(x => canReceive(x) && hasReceivable(x)))
const completed = computed(() => pos.value.filter(x => ['received', 'billed'].includes(String(x.status || '').toLowerCase()) && !hasReceivable(x)))
const readyForBilling = computed(() => completed.value.filter(x => !x.is_billed))
const partialCount = computed(() => receivable.value.filter(x => Number(receivedUnits(x)) > 0).length)
const outstandingUnits = computed(() => receivable.value.reduce((t, x) => t + outstandingUnitsFor(x), 0))
const outstandingLines = (x:any) => lines(x).filter((l:any) => l.product_id && Number(l.remaining_quantity || 0) > 0).length
const orderedUnits = (x:any) => lines(x).filter((l:any) => l.product_id).reduce((t:number,l:any)=>t+Number(l.quantity||0),0)
const receivedUnits = (x:any) => lines(x).filter((l:any) => l.product_id).reduce((t:number,l:any)=>t+Number(l.received_quantity||0),0)
const outstandingUnitsFor = (x:any) => lines(x).filter((l:any) => l.product_id).reduce((t:number,l:any)=>t+Number(l.remaining_quantity||0),0)
const progress = (x:any) => orderedUnits(x) ? Math.min(100, Math.round((receivedUnits(x) / orderedUnits(x)) * 100)) : 0
const receiveNowTotal = computed(() => receiving.value ? lines(receiving.value).reduce((t:number,l:any)=>t+Math.max(0,Number(receiptQty[l.id]||0)),0) : 0)
const receiveNowLines = computed(() => receiving.value ? lines(receiving.value).filter((l:any)=>Number(receiptQty[l.id]||0)>0).length : 0)
const afterRemaining = (l:any) => Math.max(0, Number(l.remaining_quantity || 0) - Number(receiptQty[l.id] || 0))
const historyQty = (h:any) => (h.lines || []).reduce((t:number,l:any)=>t+Number(l.quantity||0),0)
const statusLabel = (s:any) => ({ part_received:'Partially Received', received:'Received', billed:'Billed', ordered:'Ordered', sent:'Sent' } as any)[String(s||'').toLowerCase()] || String(s||'').replaceAll('_',' ')
const statusClass = (s:any) => ['received','billed'].includes(String(s||'').toLowerCase()) ? 'good' : String(s||'').toLowerCase()==='part_received' ? 'warn' : ''
const lineName = (id:any) => lines(receiving.value || historyPo.value).find((l:any)=>Number(l.id)===Number(id))?.description || `Line #${id}`
const historyLineText = (h:any) => (h.lines || []).map((l:any)=>`${lineName(l.purchase_order_line_id)} × ${qty(l.quantity)}`).join(' · ')

async function load() { loading.value = true; try { pos.value = await adminFetch('/api/admin/accounting/purchase-orders') || [] } catch (e:any) { msg.value = e?.data?.statusMessage || e.message } finally { loading.value = false } }
async function loadHistory(po:any) { historyLoading.value = true; receiptHistory.value = []; try { receiptHistory.value = await adminFetch(`/api/admin/accounting/purchase-orders/${po.id}/receipts`) || [] } catch (e:any) { msg.value = e?.data?.statusMessage || e.message } finally { historyLoading.value = false } }
async function openReceive(x:any) { receiving.value = x; historyPo.value = null; historyOpen.value = false; for (const k of Object.keys(receiptQty)) delete receiptQty[Number(k)]; for (const l of lines(x)) if (l.product_id && Number(l.remaining_quantity)>0) receiptQty[l.id] = Number(l.remaining_quantity); receipt.received_date = new Date().toISOString().slice(0,10); receipt.supplier_reference = ''; receipt.notes = ''; await loadHistory(x) }
function closeReceive(){ receiving.value=null; receiptHistory.value=[] }
function clampQty(l:any){ const max=Number(l.remaining_quantity||0); receiptQty[l.id]=Math.max(0,Math.min(max,Number(receiptQty[l.id]||0))) }
async function showHistory(x:any){ historyPo.value=x; receiving.value=null; await loadHistory(x) }
async function receiveStock(){ if(!receiving.value || receiveNowTotal.value<=0)return; saving.value=true; try { const result:any=await adminFetch(`/api/admin/accounting/purchase-orders/${receiving.value.id}/receive`,{method:'POST',body:{...receipt,lines:lines(receiving.value).map((l:any)=>({purchase_order_line_id:l.id,quantity:Number(receiptQty[l.id]||0)}))}}); const poNumber=receiving.value.po_number; closeReceive(); await load(); msg.value = result?.status === 'received' ? `${poNumber} is fully received and ready for a supplier bill.` : `Stock receipt posted to ${poNumber}. The purchase order remains partially received.` } catch(e:any){msg.value=e?.data?.statusMessage||e.message} finally{saving.value=false} }
async function createBill(x:any){ if(x.is_billed){ await dialog.alert(`${x.bill_number || 'A supplier bill'} already exists for this purchase order.`); return } const supplierInvoice=await dialog.prompt(`Supplier invoice number for ${x.po_number}`,x.supplier_reference||''); if(supplierInvoice===null)return; const due=await dialog.prompt('Due date (YYYY-MM-DD) — leave blank if not known',''); if(due===null)return; try{ const bill:any=await adminFetch(`/api/admin/accounting/purchase-orders/${x.id}/bill`,{method:'POST',body:{supplier_invoice_number:supplierInvoice||null,bill_date:new Date().toISOString().slice(0,10),due_date:due||null}}); msg.value=`${bill?.bill_number || 'Supplier bill'} created from ${x.po_number}.`; await load() }catch(e:any){msg.value=e?.data?.statusMessage||e.message} }
onMounted(load)
</script>

<style scoped>
.panel{border:1px solid #e2e8f0;border-radius:1rem;background:white}.metric{border:1px solid #e2e8f0;border-radius:1rem;background:white;padding:1rem 1.1rem}.metric span{display:block;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b}.metric strong{display:block;margin-top:.25rem;font-size:1.65rem;color:#0f172a}.input{width:100%;border:1px solid #cbd5e1;border-radius:.7rem;padding:.65rem .75rem;background:white}.field span{display:block;margin-bottom:.35rem;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#64748b}.primary,.secondary{display:inline-block;border-radius:.7rem;padding:.65rem 1rem;font-weight:800;transition:.15s}.primary{background:#0f172a;color:white}.primary:disabled{cursor:not-allowed;opacity:.45}.secondary{border:1px solid #cbd5e1;background:white;color:#0f172a}.badge{display:inline-block;border-radius:999px;background:#f1f5f9;padding:.28rem .65rem;font-size:.75rem;font-weight:800;text-transform:capitalize}.badge.good{background:#dcfce7;color:#166534}.badge.warn{background:#fef3c7;color:#92400e}.progress{height:.45rem;overflow:hidden;border-radius:999px;background:#e2e8f0}.progress span{display:block;height:100%;border-radius:999px;background:#2563eb}.summary{min-width:180px;border-radius:.8rem;background:#f8fafc;padding:.8rem 1rem}.summary span,.summary small{display:block;color:#64748b}.summary strong{display:block;font-size:1.2rem}.link{font-weight:800;color:#2563eb;text-decoration:underline;text-underline-offset:2px}
</style>
