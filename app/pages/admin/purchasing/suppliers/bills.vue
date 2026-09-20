<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />

    <div class="mt-2 flex flex-wrap items-end justify-between gap-3">
      <div>
        <NuxtLink to="/admin/purchasing/purchase-orders" class="text-sm font-bold text-blue-600">← Purchase Orders</NuxtLink>
        <h1 class="mt-2 text-3xl font-black">Supplier Bills</h1>
        <p class="text-slate-500">Track supplier invoices from purchase order through payment.</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/admin/accounting/payables" class="secondary">Accounts Payable</NuxtLink>
        <button class="secondary" @click="load">Refresh</button>
      </div>
    </div>

    <div v-if="msg" class="my-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold">{{ msg }}</div>

    <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div class="stat"><span>Open Bills</span><strong>{{ openBills.length }}</strong></div>
      <div class="stat"><span>Total Outstanding</span><strong>{{ money(totalOutstanding) }}</strong></div>
      <div class="stat"><span>Overdue</span><strong>{{ overdueBills.length }}</strong><small>{{ money(overdueOutstanding) }}</small></div>
      <div class="stat"><span>Part Paid</span><strong>{{ partPaidBills.length }}</strong></div>
      <div class="stat"><span>Paid</span><strong>{{ paidBills.length }}</strong></div>
    </section>

    <section class="panel mt-5 p-4 md:p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <button v-for="f in filters" :key="f.key" class="filter" :class="{active:filter===f.key}" @click="filter=f.key">{{ f.label }} <span>{{ f.count }}</span></button>
        </div>
        <input v-model="search" class="search" placeholder="Search bill, supplier, invoice or PO…" />
      </div>

      <div class="mt-4 space-y-3">
        <article v-for="b in filteredBills" :key="b.id" class="bill-card" :class="{'overdue-card':isOverdue(b)}">
          <div class="grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-center">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <strong class="text-lg">{{ b.bill_number }}</strong>
                <span class="status" :class="statusClass(b)">{{ statusLabel(b) }}</span>
                <span v-if="isOverdue(b)" class="overdue">OVERDUE</span>
              </div>
              <div class="mt-1 font-bold text-slate-700">{{ b.accounting_suppliers?.name || 'Unknown supplier' }}</div>
              <div class="mt-1 text-xs text-slate-500">Supplier invoice: {{ b.supplier_invoice_number || '—' }}</div>
            </div>
            <div>
              <div class="label">Purchase Order</div>
              <div v-if="b.purchase_order" class="font-bold">{{ b.purchase_order.po_number }}</div>
              <div v-else class="text-slate-400">Not linked</div>
              <div v-if="b.purchase_order" class="mt-1 text-xs text-slate-500">{{ poStatus(b.purchase_order.status) }}</div>
            </div>
            <div>
              <div class="label">Due Date</div>
              <div class="font-bold" :class="{'text-red-700':isOverdue(b)}">{{ date(b.due_date) }}</div>
              <div class="mt-1 text-xs text-slate-500">Bill date {{ date(b.bill_date) }}</div>
            </div>
            <div>
              <div class="label">Balance</div>
              <div class="text-lg font-black">{{ money(owing(b)) }}</div>
              <div class="mt-1 text-xs text-slate-500">{{ money(b.paid_amount) }} paid of {{ money(b.total) }}</div>
            </div>
            <div class="flex flex-wrap gap-2 lg:justify-end">
              <button v-if="owing(b)>0" class="primary" @click="pay(b)">Record Payment</button>
              <button class="secondary" @click="toggle(b.id)">{{ expanded===b.id ? 'Hide Details' : 'View Details' }}</button>
            </div>
          </div>

          <div v-if="expanded===b.id" class="details">
            <div class="grid gap-5 xl:grid-cols-3">
              <div>
                <h3 class="detail-title">Bill Summary</h3>
                <dl class="summary-list">
                  <div><dt>Subtotal</dt><dd>{{ money(b.subtotal) }}</dd></div>
                  <div><dt>GST</dt><dd>{{ money(b.gst_amount) }}</dd></div>
                  <div><dt>Total</dt><dd>{{ money(b.total) }}</dd></div>
                  <div><dt>Paid</dt><dd>{{ money(b.paid_amount) }}</dd></div>
                  <div class="font-black"><dt>Outstanding</dt><dd>{{ money(owing(b)) }}</dd></div>
                </dl>
              </div>

              <div>
                <h3 class="detail-title">Purchase Order</h3>
                <template v-if="b.purchase_order">
                  <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <div class="font-black">{{ b.purchase_order.po_number }}</div>
                    <div class="mt-2 grid grid-cols-2 gap-2 text-slate-600">
                      <span>Ordered</span><strong class="text-right text-slate-800">{{ date(b.purchase_order.order_date) }}</strong>
                      <span>Expected</span><strong class="text-right text-slate-800">{{ date(b.purchase_order.expected_date) }}</strong>
                      <span>PO Total</span><strong class="text-right text-slate-800">{{ money(b.purchase_order.total) }}</strong>
                    </div>
                    <NuxtLink :to="`/admin/purchasing/purchase-orders?po=${b.purchase_order.id}`" class="mt-3 inline-block font-bold text-blue-600">Open Purchase Orders →</NuxtLink>
                  </div>
                </template>
                <div v-else class="text-sm text-slate-500">This bill is not linked to a purchase order.</div>
              </div>

              <div>
                <h3 class="detail-title">Payment History</h3>
                <div v-if="b.payments?.length" class="space-y-2">
                  <div v-for="p in b.payments" :key="p.id" class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <div class="flex justify-between gap-3"><strong>{{ money(p.amount) }}</strong><span>{{ dateTime(p.created_at) }}</span></div>
                    <div class="mt-1 text-xs text-slate-500">Reference: {{ p.reference || '—' }}</div>
                  </div>
                </div>
                <div v-else class="text-sm text-slate-500">No payments recorded yet.</div>
              </div>
            </div>

            <div class="mt-5">
              <h3 class="detail-title">Bill Lines</h3>
              <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table class="w-full min-w-[720px] text-sm">
                  <thead><tr><th>Description</th><th>SKU</th><th class="text-right">Qty</th><th class="text-right">Unit ex GST</th><th class="text-right">GST</th><th class="text-right">Total</th></tr></thead>
                  <tbody><tr v-for="line in b.accounting_supplier_bill_lines || []" :key="line.id"><td>{{ line.description }}</td><td>{{ line.sku || '—' }}</td><td class="text-right">{{ line.quantity }}</td><td class="text-right">{{ money(line.unit_cost_ex_gst) }}</td><td class="text-right">{{ money(line.gst_amount) }}</td><td class="text-right font-bold">{{ money(line.line_total) }}</td></tr></tbody>
                </table>
              </div>
            </div>
          </div>
        </article>
        <div v-if="!filteredBills.length" class="p-10 text-center text-slate-500">No supplier bills match this view.</div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:['admin'] })
const { adminFetch } = useAdminFetch()
const dialog = useAppDialog()
const bills = ref<any[]>([])
const msg = ref('')
const filter = ref('open')
const search = ref('')
const expanded = ref<number|null>(null)

const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const owing=(b:any)=>Math.max(0,Math.round((Number(b.total||0)-Number(b.paid_amount||0))*100)/100)
const date=(v:any)=>v ? new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${String(v).slice(0,10)}T00:00:00`)) : '—'
const dateTime=(v:any)=>v ? new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v)) : '—'
const today=()=>new Date().toISOString().slice(0,10)
const isPaid=(b:any)=>owing(b)<=0 || String(b.status).toLowerCase()==='paid'
const isOverdue=(b:any)=>!isPaid(b) && !!b.due_date && String(b.due_date).slice(0,10)<today()
const isPartPaid=(b:any)=>!isPaid(b) && Number(b.paid_amount||0)>0
const statusLabel=(b:any)=>isPaid(b)?'Paid':isPartPaid(b)?'Part Paid':'Unpaid'
const statusClass=(b:any)=>isPaid(b)?'paid':isPartPaid(b)?'part':'unpaid'
const poStatus=(v:any)=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,(x:string)=>x.toUpperCase()) || '—'
const openBills=computed(()=>bills.value.filter(b=>!isPaid(b)))
const paidBills=computed(()=>bills.value.filter(isPaid))
const overdueBills=computed(()=>bills.value.filter(isOverdue))
const partPaidBills=computed(()=>bills.value.filter(isPartPaid))
const totalOutstanding=computed(()=>openBills.value.reduce((s,b)=>s+owing(b),0))
const overdueOutstanding=computed(()=>overdueBills.value.reduce((s,b)=>s+owing(b),0))
const filters=computed(()=>[
  {key:'open',label:'Open',count:openBills.value.length},
  {key:'overdue',label:'Overdue',count:overdueBills.value.length},
  {key:'part_paid',label:'Part Paid',count:partPaidBills.value.length},
  {key:'paid',label:'Paid',count:paidBills.value.length},
  {key:'all',label:'All',count:bills.value.length}
])
const filteredBills=computed(()=>{
  const q=search.value.trim().toLowerCase()
  return bills.value.filter(b=>{
    const matchesFilter=filter.value==='all'||(filter.value==='open'&&!isPaid(b))||(filter.value==='overdue'&&isOverdue(b))||(filter.value==='part_paid'&&isPartPaid(b))||(filter.value==='paid'&&isPaid(b))
    const hay=[b.bill_number,b.accounting_suppliers?.name,b.supplier_invoice_number,b.purchase_order?.po_number].join(' ').toLowerCase()
    return matchesFilter&&(!q||hay.includes(q))
  })
})

function toggle(id:number){ expanded.value=expanded.value===id?null:id }
async function load(){
  msg.value=''
  try{ bills.value=await adminFetch('/api/admin/accounting/supplier-bills')||[] }
  catch(e:any){ msg.value=e?.data?.statusMessage||e.message }
}
async function pay(b:any){
  const raw=await dialog.prompt(`Payment amount for ${b.bill_number}`,owing(b).toFixed(2))
  if(raw===null)return
  const amount=Number(raw)
  if(!amount||amount<=0||amount>owing(b)){await dialog.alert('Enter a valid payment amount no greater than the amount owing.');return}
  const reference=await dialog.prompt('Payment reference','')
  if(reference===null)return
  try{
    await adminFetch('/api/admin/accounting/supplier-payments',{method:'POST',body:{bill_id:b.id,amount,reference:reference||''}})
    msg.value=`Payment of ${money(amount)} recorded against ${b.bill_number}.`
    expanded.value=Number(b.id)
    await load()
  }catch(e:any){msg.value=e?.data?.statusMessage||e.message}
}
onMounted(load)
</script>

<style scoped>
.panel{border:1px solid #e2e8f0;border-radius:1rem;background:white}.primary,.secondary{display:inline-block;border-radius:.7rem;padding:.65rem 1rem;font-weight:800}.primary{background:#0f172a;color:white}.secondary{border:1px solid #cbd5e1;background:white}.stat{border:1px solid #e2e8f0;border-radius:1rem;background:#fff;padding:1rem}.stat span{display:block;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#64748b}.stat strong{display:block;margin-top:.35rem;font-size:1.35rem}.stat small{display:block;margin-top:.15rem;color:#b91c1c;font-weight:800}.filter{border:1px solid #cbd5e1;border-radius:999px;background:#fff;padding:.45rem .75rem;font-size:.8rem;font-weight:800}.filter span{margin-left:.25rem;color:#64748b}.filter.active{background:#0f172a;color:#fff;border-color:#0f172a}.filter.active span{color:#cbd5e1}.search{min-width:min(100%,320px);border:1px solid #cbd5e1;border-radius:.75rem;padding:.6rem .8rem}.bill-card{overflow:hidden;border:1px solid #e2e8f0;border-radius:1rem;background:#fff}.overdue-card{border-color:#fecaca}.status,.overdue{display:inline-block;border-radius:999px;padding:.25rem .55rem;font-size:.7rem;font-weight:900}.status.paid{background:#dcfce7;color:#166534}.status.part{background:#fef3c7;color:#92400e}.status.unpaid{background:#e2e8f0;color:#334155}.overdue{background:#fee2e2;color:#991b1b}.label{font-size:.68rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}.details{border-top:1px solid #e2e8f0;background:#f8fafc;padding:1rem}.detail-title{margin-bottom:.65rem;font-weight:900}.summary-list>div{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid #e2e8f0;padding:.45rem 0;font-size:.875rem}.summary-list dt{color:#64748b}.summary-list dd{font-weight:800}th{background:#f8fafc;padding:.65rem;text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.04em;color:#64748b}td{border-top:1px solid #e2e8f0;padding:.65rem}
</style>
