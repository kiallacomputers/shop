<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminSalesWorkflow />

    <div class="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600 hover:underline">← Accounting</NuxtLink>
        <p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">Accounts Receivable</p>
        <h1 class="mt-1 text-3xl font-black text-slate-950">Receivables Dashboard</h1>
        <p class="mt-1 max-w-3xl text-slate-500">
          See what customers owe Kialla Computers, debtor ageing, customer exposure and upcoming collections.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/admin/accounting/invoices" class="primary">Sales &amp; Invoices</NuxtLink>
        <button type="button" class="secondary" :disabled="loading" @click="load">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="msg" class="mt-5 rounded-xl border px-4 py-3 text-sm font-semibold"
      :class="msgType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">
      {{ msg }}
    </div>

    <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <button class="stat text-left" type="button" @click="setView('all')">
        <span>Total Receivables</span><strong>{{ money(totalOutstanding) }}</strong>
        <small>{{ openInvoices.length }} open invoice{{ openInvoices.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="setView('overdue')">
        <span>Overdue</span><strong :class="overdueInvoices.length ? '!text-red-700' : ''">{{ money(overdueTotal) }}</strong>
        <small>{{ overdueInvoices.length }} overdue invoice{{ overdueInvoices.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="setView('due7')">
        <span>Due This Week</span><strong>{{ money(due7Total) }}</strong>
        <small>{{ due7Invoices.length }} invoice{{ due7Invoices.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="setView('due_month')">
        <span>Due This Month</span><strong>{{ money(dueMonthTotal) }}</strong>
        <small>{{ dueMonthInvoices.length }} invoice{{ dueMonthInvoices.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="customerOnly = ''">
        <span>Customers Owing</span><strong>{{ customerGroups.length }}</strong><small>with open balances</small>
      </button>
    </section>

    <section class="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div class="panel p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div><h2 class="text-xl font-black text-slate-950">Receivables Ageing</h2><p class="mt-1 text-sm text-slate-500">Outstanding balances grouped by invoice age.</p></div>
          <button v-if="ageFilter" type="button" class="text-sm font-black text-blue-600 hover:underline" @click="ageFilter = ''">Clear ageing filter</button>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-5">
          <button v-for="a in ageingCards" :key="a.key" type="button" class="age-card" :class="{ active: ageFilter === a.key }"
            @click="ageFilter = ageFilter === a.key ? '' : a.key">
            <span>{{ a.label }}</span><strong>{{ money(a.value) }}</strong><small>{{ a.count }} invoice{{ a.count === 1 ? '' : 's' }}</small>
          </button>
        </div>
      </div>

      <div class="panel p-5">
        <div class="flex items-start justify-between gap-3">
          <div><h2 class="text-xl font-black text-slate-950">Customer Exposure</h2><p class="mt-1 text-sm text-slate-500">Current outstanding balance by customer.</p></div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{{ customerGroups.length }} customers</span>
        </div>
        <div class="mt-4 max-h-[310px] space-y-2 overflow-y-auto pr-1">
          <button v-for="g in customerGroups" :key="g.id" type="button" class="customer-row" :class="{ active: customerOnly === g.id }"
            @click="customerOnly = customerOnly === g.id ? '' : g.id">
            <div class="min-w-0 text-left">
              <div class="truncate font-black text-slate-900">{{ g.name }}</div>
              <div class="mt-0.5 text-xs font-semibold text-slate-400">{{ g.invoices.length }} invoice{{ g.invoices.length === 1 ? '' : 's' }}<template v-if="g.overdueCount"> · {{ g.overdueCount }} overdue</template></div>
            </div>
            <strong class="shrink-0 text-slate-950">{{ money(g.total) }}</strong>
          </button>
          <div v-if="!customerGroups.length" class="py-8 text-center text-sm text-slate-500">No outstanding customer balances.</div>
        </div>
      </div>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-4 md:p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 class="text-xl font-black text-slate-950">Outstanding Invoices</h2>
            <p class="mt-1 text-sm text-slate-500">{{ visibleInvoices.length }} invoice{{ visibleInvoices.length === 1 ? '' : 's' }} · {{ money(visibleOutstanding) }} outstanding in this view</p>
          </div>
          <div class="flex w-full flex-col gap-2 md:flex-row xl:w-auto">
            <label class="field md:min-w-[185px]"><span>View</span>
              <select v-model="filter" class="input">
                <option value="all">All Open Invoices</option><option value="overdue">Overdue</option><option value="due7">Due This Week</option>
                <option value="due_month">Due This Month</option><option value="part_paid">Part Paid</option>
              </select>
            </label>
            <label class="field md:min-w-[330px]"><span>Search</span><input v-model="search" type="search" class="input" placeholder="Customer, email or invoice…"></label>
          </div>
        </div>
        <div v-if="customerOnly || ageFilter" class="mt-3 flex flex-wrap gap-2">
          <button v-if="customerOnly" type="button" class="filter-chip" @click="customerOnly = ''">Customer: {{ customerName(customerOnly) }} ×</button>
          <button v-if="ageFilter" type="button" class="filter-chip" @click="ageFilter = ''">Ageing: {{ ageingCards.find((x) => x.key === ageFilter)?.label }} ×</button>
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center text-sm font-semibold text-slate-500">Loading accounts receivable…</div>
      <div v-else-if="!visibleInvoices.length" class="p-12 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">✓</div>
        <h3 class="mt-3 font-black text-slate-900">Nothing outstanding in this view</h3><p class="mt-1 text-sm text-slate-500">Try clearing the current filters.</p>
      </div>

      <div v-else>
        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[1100px] text-sm">
            <thead><tr><th>Customer / Invoice</th><th>Invoice Date</th><th>Due Date</th><th>Age</th><th class="text-right">Invoice Total</th><th class="text-right">Paid</th><th class="text-right">Outstanding</th><th>Status</th><th class="w-[110px] text-right">Action</th></tr></thead>
            <tbody>
              <tr v-for="i in visibleInvoices" :key="i.id" :class="{ 'bg-red-50/40': isOverdue(i) }">
                <td><div class="font-black text-slate-950">{{ customerDisplay(i) }}</div><div class="mt-0.5 text-xs font-bold text-slate-500">{{ i.invoice_number }}</div></td>
                <td>{{ date(i.invoice_date) }}</td>
                <td><div class="font-bold" :class="{ 'text-red-700': isOverdue(i) }">{{ date(dueDate(i)) }}</div><div class="mt-0.5 text-xs font-semibold" :class="dueClass(i)">{{ dueText(i) }}</div></td>
                <td><span class="age-pill">{{ ageLabel(i) }}</span></td>
                <td class="text-right font-semibold">{{ money(i.total) }}</td><td class="text-right text-slate-500">{{ money(i.paid_amount) }}</td>
                <td class="text-right text-base font-black">{{ money(balance(i)) }}</td><td><span class="status" :class="statusClass(i)">{{ displayStatus(i) }}</span></td>
                <td class="text-right"><button type="button" class="table-link" @click="openInvoice(i)">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-slate-200 lg:hidden">
          <article v-for="i in visibleInvoices" :key="i.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0"><h3 class="truncate font-black text-slate-950">{{ customerDisplay(i) }}</h3><p class="mt-1 text-xs font-bold text-slate-500">{{ i.invoice_number }}</p></div>
              <div class="text-right"><div class="label">Outstanding</div><div class="text-lg font-black">{{ money(balance(i)) }}</div></div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><div class="label">Due</div><div class="font-bold" :class="{ 'text-red-700': isOverdue(i) }">{{ date(dueDate(i)) }}</div></div>
              <div><div class="label">Age</div><div class="font-bold">{{ ageLabel(i) }}</div></div>
              <div><div class="label">Status</div><span class="status mt-1" :class="statusClass(i)">{{ displayStatus(i) }}</span></div>
            </div>
            <div class="mt-4 flex justify-end"><button type="button" class="secondary !px-3 !py-1.5" @click="openInvoice(i)">View Invoice</button></div>
          </article>
        </div>
      </div>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-5"><h2 class="text-xl font-black text-slate-950">Recent Customer Payments</h2><p class="mt-1 text-sm text-slate-500">Most recently recorded Accounts Receivable payments.</p></div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px] text-sm">
          <thead><tr><th>Date</th><th>Customer</th><th>Invoice</th><th>Method</th><th>Reference</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            <tr v-for="pmt in recentPayments" :key="pmt.id">
              <td>{{ date(pmt.payment_date || pmt.created_at) }}</td><td>{{ customerForPayment(pmt) }}</td><td>{{ invoiceForPayment(pmt)?.invoice_number || '—' }}</td>
              <td>{{ pmt.payment_method || '—' }}</td><td>{{ pmt.reference || '—' }}</td><td class="text-right font-black">{{ money(pmt.amount) }}</td>
            </tr>
            <tr v-if="!recentPayments.length"><td colspan="6" class="p-10 text-center text-slate-500">No customer payments recorded yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="selectedInvoice" class="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" @click.self="closeInvoice">
        <section class="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">Customer Invoice</p>
              <div class="mt-1 flex flex-wrap items-center gap-2"><h2 class="text-xl font-black text-slate-950">{{ selectedInvoice.invoice_number }}</h2><span class="status" :class="statusClass(selectedInvoice)">{{ displayStatus(selectedInvoice) }}</span></div>
              <p class="mt-1 truncate text-sm font-semibold text-slate-500">{{ customerDisplay(selectedInvoice) }}<span v-if="selectedInvoice.customer_email"> · {{ selectedInvoice.customer_email }}</span></p>
            </div>
            <button type="button" class="modal-close" @click="closeInvoice">×</button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-4">
              <div class="summary"><span>Total</span><strong>{{ money(selectedInvoice.total) }}</strong></div>
              <div class="summary"><span>Paid</span><strong>{{ money(selectedInvoice.paid_amount) }}</strong></div>
              <div class="summary"><span>Outstanding</span><strong class="!text-blue-700">{{ money(balance(selectedInvoice)) }}</strong></div>
              <div class="summary"><span>Invoice Date</span><strong>{{ date(selectedInvoice.invoice_date) }}</strong></div>
            </div>

            <div class="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <section class="detail-card">
                <h3 class="detail-title">Invoice Information</h3>
                <dl class="detail-list">
                  <div><dt>Customer</dt><dd>{{ customerDisplay(selectedInvoice) }}</dd></div><div><dt>Email</dt><dd>{{ selectedInvoice.customer_email || '—' }}</dd></div>
                  <div><dt>Invoice Date</dt><dd>{{ date(selectedInvoice.invoice_date) }}</dd></div><div><dt>Due Date</dt><dd>{{ date(dueDate(selectedInvoice)) }}</dd></div>
                  <div><dt>Subtotal</dt><dd>{{ money(selectedInvoice.subtotal) }}</dd></div><div><dt>GST</dt><dd>{{ money(selectedInvoice.gst_amount) }}</dd></div>
                </dl>
              </section>

              <section class="detail-card">
                <div class="flex items-center justify-between gap-3"><h3 class="detail-title !mb-0">Payment History</h3><button v-if="balance(selectedInvoice) > 0" type="button" class="table-link" @click="openPayment">Record Payment</button></div>
                <div v-if="invoicePayments.length" class="mt-3 space-y-2">
                  <div v-for="pmt in invoicePayments" :key="pmt.id" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div class="flex justify-between gap-3"><strong>{{ money(pmt.amount) }}</strong><span class="text-xs text-slate-500">{{ date(pmt.payment_date || pmt.created_at) }}</span></div>
                    <div class="mt-1 text-xs text-slate-500">{{ pmt.payment_method || 'Payment' }} · {{ pmt.reference || 'No reference' }}</div>
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-slate-500">No payments recorded yet.</p>
              </section>
            </div>

            <section class="mt-5">
              <h3 class="detail-title">Invoice Lines</h3>
              <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table class="w-full min-w-[720px] text-sm">
                  <thead><tr><th>Description</th><th>SKU</th><th class="text-right">Qty</th><th class="text-right">Unit Price</th><th class="text-right">GST</th><th class="text-right">Total</th></tr></thead>
                  <tbody>
                    <tr v-for="line in selectedInvoice.accounting_invoice_lines || []" :key="line.id">
                      <td>{{ line.description || '—' }}</td><td>{{ line.sku || '—' }}</td><td class="text-right">{{ line.quantity }}</td>
                      <td class="text-right">{{ money(line.unit_price) }}</td><td class="text-right">{{ money(line.gst_amount) }}</td><td class="text-right font-bold">{{ money(line.line_total) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <footer class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
            <div class="text-sm text-slate-500">Outstanding: <strong class="text-slate-950">{{ money(balance(selectedInvoice)) }}</strong></div>
            <div class="flex gap-2"><button v-if="balance(selectedInvoice) > 0" type="button" class="primary" @click="openPayment">Record Payment</button><button type="button" class="secondary" @click="closeInvoice">Close</button></div>
          </footer>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="paymentOpen && selectedInvoice" class="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" @click.self="closePayment">
        <section class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div><p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">Accounts Receivable</p><h2 class="mt-1 text-xl font-black text-slate-950">Record Customer Payment</h2><p class="mt-1 text-sm font-semibold text-slate-500">{{ customerDisplay(selectedInvoice) }} · {{ selectedInvoice.invoice_number }}</p></div>
            <button type="button" class="modal-close" @click="closePayment">×</button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="summary"><span>Invoice Total</span><strong>{{ money(selectedInvoice.total) }}</strong></div><div class="summary"><span>Already Paid</span><strong>{{ money(selectedInvoice.paid_amount) }}</strong></div><div class="summary"><span>Outstanding</span><strong class="!text-blue-700">{{ money(balance(selectedInvoice)) }}</strong></div>
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="field"><span>Payment Date</span><input v-model="payment.payment_date" type="date" class="input"></label>
              <label class="field"><span>Amount</span><input v-model.number="payment.amount" type="number" min="0.01" :max="balance(selectedInvoice)" step="0.01" class="input"><button type="button" class="mt-1 text-left text-xs font-black text-blue-600 hover:underline" @click="payment.amount = balance(selectedInvoice)">Pay full balance</button></label>
              <label class="field"><span>Payment Method</span><select v-model="payment.payment_method" class="input"><option>Bank Transfer</option><option>EFTPOS</option><option>Cash</option><option>Stripe</option><option>Other</option></select></label>
              <label class="field"><span>Reference</span><input v-model="payment.reference" class="input" placeholder="Receipt / bank reference"></label>
              <label class="field sm:col-span-2"><span>Notes</span><textarea v-model="payment.notes" rows="3" class="input resize-none" placeholder="Optional internal note"></textarea></label>
            </div>
            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"><div class="flex justify-between gap-4"><span class="text-sm font-bold text-slate-600">Balance after payment</span><strong class="text-lg">{{ money(balanceAfterPayment) }}</strong></div></div>
            <div v-if="paymentError" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{{ paymentError }}</div>
          </div>
          <footer class="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
            <button type="button" class="secondary" :disabled="paymentSaving" @click="closePayment">Cancel</button>
            <button type="button" class="primary" :disabled="paymentSaving || !validPayment" @click="savePayment">{{ paymentSaving ? 'Posting Payment…' : `Record ${money(payment.amount)} Payment` }}</button>
          </footer>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const { adminFetch, isSuperAdmin } = useAdminFetch()

const invoices = ref<any[]>([])
const allPayments = ref<any[]>([])
const loading = ref(true)
const msg = ref('')
const msgType = ref<'success'|'error'>('success')
const search = ref('')
const filter = ref('all')
const ageFilter = ref('')
const customerOnly = ref('')
const selectedInvoice = ref<any>(null)
const paymentOpen = ref(false)
const paymentSaving = ref(false)
const paymentError = ref('')
const payment = reactive({ amount: 0, payment_date: new Date().toISOString().slice(0,10), payment_method: 'Bank Transfer', reference: '', notes: '' })

const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const date=(v:any)=>v?new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${String(v).slice(0,10)}T00:00:00`)):'—'
const balance=(i:any)=>Math.max(0,Math.round((Number(i.total||0)-Number(i.paid_amount||0))*100)/100)
const customerDisplay=(i:any)=>i.customer_name||i.customer_email||'Unknown Customer'
const dueDate=(i:any)=>i.due_date||i.invoice_date

const today=()=>new Date(`${new Date().toISOString().slice(0,10)}T00:00:00`)
const ageDays=(i:any)=>{if(!i.invoice_date)return 0;return Math.max(0,Math.floor((today().getTime()-new Date(`${String(i.invoice_date).slice(0,10)}T00:00:00`).getTime())/86400000))}
const daysUntilDue=(i:any)=>{if(!dueDate(i))return null;return Math.round((new Date(`${String(dueDate(i)).slice(0,10)}T00:00:00`).getTime()-today().getTime())/86400000)}
const isOverdue=(i:any)=>balance(i)>0 && daysUntilDue(i)!==null && Number(daysUntilDue(i))<0
const isDueWithin=(i:any,d:number)=>{const x=daysUntilDue(i);return balance(i)>0&&x!==null&&x>=0&&x<=d}
const isDueThisMonth=(i:any)=>{if(!dueDate(i)||balance(i)<=0)return false;const d=new Date(`${String(dueDate(i)).slice(0,10)}T00:00:00`),n=today();return d>=n&&d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()}
const bucket=(i:any)=>{const a=ageDays(i);if(a<=0)return'current';if(a<=30)return'1-30';if(a<=60)return'31-60';if(a<=90)return'61-90';return'90+'}
const ageLabel=(i:any)=>bucket(i)==='current'?'Current':`${bucket(i)} days`
const displayStatus=(i:any)=>balance(i)<=0?'Paid':isOverdue(i)?(Number(i.paid_amount||0)>0?'Part Paid · Overdue':'Overdue'):(Number(i.paid_amount||0)>0?'Part Paid':'Current')
const statusClass=(i:any)=>balance(i)<=0?'paid':isOverdue(i)?'overdue':Number(i.paid_amount||0)>0?'part':'open'
const dueText=(i:any)=>{const d=daysUntilDue(i);if(d===null)return'No due date';if(d<0)return`${Math.abs(d)} day${Math.abs(d)===1?'':'s'} overdue`;if(d===0)return'Due today';return`Due in ${d} day${d===1?'':'s'}`}
const dueClass=(i:any)=>isOverdue(i)?'text-red-700':(daysUntilDue(i)!==null&&Number(daysUntilDue(i))<=7?'text-amber-700':'text-slate-400')

const openInvoices=computed(()=>invoices.value.filter(i=>balance(i)>0))
const overdueInvoices=computed(()=>openInvoices.value.filter(isOverdue))
const due7Invoices=computed(()=>openInvoices.value.filter(i=>isDueWithin(i,7)))
const dueMonthInvoices=computed(()=>openInvoices.value.filter(isDueThisMonth))
const totalOutstanding=computed(()=>openInvoices.value.reduce((s,i)=>s+balance(i),0))
const overdueTotal=computed(()=>overdueInvoices.value.reduce((s,i)=>s+balance(i),0))
const due7Total=computed(()=>due7Invoices.value.reduce((s,i)=>s+balance(i),0))
const dueMonthTotal=computed(()=>dueMonthInvoices.value.reduce((s,i)=>s+balance(i),0))

const ageingCards=computed(()=>[['current','Current'],['1-30','1–30 Days'],['31-60','31–60 Days'],['61-90','61–90 Days'],['90+','90+ Days']].map(([key,label])=>{const rows=openInvoices.value.filter(i=>bucket(i)===key);return{key,label,value:rows.reduce((s,i)=>s+balance(i),0),count:rows.length}}))

const customerKey=(i:any)=>String(i.customer_id||i.customer_email||i.customer_name||'unknown')
const customerGroups=computed(()=>{const m=new Map<string,any>();for(const i of openInvoices.value){const id=customerKey(i);if(!m.has(id))m.set(id,{id,name:customerDisplay(i),invoices:[],total:0,overdueCount:0});const g=m.get(id);g.invoices.push(i);g.total+=balance(i);if(isOverdue(i))g.overdueCount++}return[...m.values()].sort((a,b)=>b.total-a.total)})
const customerName=(id:string)=>customerGroups.value.find(g=>g.id===id)?.name||'Customer'

const visibleInvoices=computed(()=>{const q=search.value.trim().toLowerCase();return openInvoices.value.filter(i=>{
  if(customerOnly.value&&customerKey(i)!==customerOnly.value)return false
  if(ageFilter.value&&bucket(i)!==ageFilter.value)return false
  if(filter.value==='overdue'&&!isOverdue(i))return false
  if(filter.value==='due7'&&!isDueWithin(i,7))return false
  if(filter.value==='due_month'&&!isDueThisMonth(i))return false
  if(filter.value==='part_paid'&&Number(i.paid_amount||0)<=0)return false
  const h=[i.customer_name,i.customer_email,i.invoice_number].filter(Boolean).join(' ').toLowerCase();return!q||h.includes(q)
}).sort((a,b)=>String(dueDate(a)||'9999-12-31').localeCompare(String(dueDate(b)||'9999-12-31')))})
const visibleOutstanding=computed(()=>visibleInvoices.value.reduce((s,i)=>s+balance(i),0))

const invoicePayments=computed(()=>selectedInvoice.value?allPayments.value.filter(p=>Number(p.invoice_id)===Number(selectedInvoice.value.id)):[])
const recentPayments=computed(()=>[...allPayments.value].sort((a,b)=>String(b.payment_date||b.created_at||'').localeCompare(String(a.payment_date||a.created_at||''))).slice(0,20))
const invoiceForPayment=(p:any)=>invoices.value.find(i=>Number(i.id)===Number(p.invoice_id))
const customerForPayment=(p:any)=>{const i=invoiceForPayment(p);return i?customerDisplay(i):'—'}

function setView(v:string){filter.value=v;ageFilter.value='';customerOnly.value=''}
function openInvoice(i:any){selectedInvoice.value=i}
function closeInvoice(){if(!paymentOpen.value)selectedInvoice.value=null}
const balanceAfterPayment=computed(()=>selectedInvoice.value?Math.max(0,Math.round((balance(selectedInvoice.value)-Number(payment.amount||0))*100)/100):0)
const validPayment=computed(()=>selectedInvoice.value&&Number(payment.amount)>0&&Number(payment.amount)<=balance(selectedInvoice.value)&&Boolean(payment.payment_date))
function openPayment(){if(!selectedInvoice.value||balance(selectedInvoice.value)<=0)return;payment.amount=balance(selectedInvoice.value);payment.payment_date=new Date().toISOString().slice(0,10);payment.payment_method='Bank Transfer';payment.reference='';payment.notes='';paymentError.value='';paymentOpen.value=true}
function closePayment(){if(!paymentSaving.value){paymentOpen.value=false;paymentError.value=''}}

async function savePayment(){if(!selectedInvoice.value||!validPayment.value)return;const id=Number(selectedInvoice.value.id),amount=Number(payment.amount);paymentSaving.value=true;paymentError.value='';try{
  await adminFetch('/api/admin/accounting/customer-payments',{method:'POST',body:{invoice_id:id,...payment}})
  paymentOpen.value=false;await load(false);selectedInvoice.value=invoices.value.find(i=>Number(i.id)===id)||null;msgType.value='success';msg.value=`Payment of ${money(amount)} recorded successfully.`
}catch(e:any){paymentError.value=e?.data?.statusMessage||e?.statusMessage||e?.message||'Unable to record customer payment.'}finally{paymentSaving.value=false}}

async function load(showSpinner=true){if(showSpinner)loading.value=true;if(showSpinner)msg.value='';try{
  if(!isSuperAdmin.value)return navigateTo('/admin')
  const [inv,pay]=await Promise.all([adminFetch('/api/admin/accounting/invoices'),adminFetch('/api/admin/accounting/customer-payments')])
  invoices.value=inv||[];allPayments.value=pay||[]
}catch(e:any){msgType.value='error';msg.value=e?.data?.statusMessage||e?.statusMessage||e?.message||'Unable to load Accounts Receivable.'}finally{loading.value=false}}

function handleKeydown(e:KeyboardEvent){if(e.key!=='Escape')return;if(paymentOpen.value)return closePayment();if(selectedInvoice.value)closeInvoice()}
watch([selectedInvoice,paymentOpen],([invoice,paying])=>{if(import.meta.client)document.body.style.overflow=invoice||paying?'hidden':''})
onMounted(()=>{window.addEventListener('keydown',handleKeydown);load()})
onBeforeUnmount(()=>{window.removeEventListener('keydown',handleKeydown);document.body.style.overflow=''})
</script>

<style scoped>
.panel{@apply rounded-2xl border border-slate-200 bg-white shadow-sm}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50}.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50}.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.field{@apply grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500}.label{@apply text-[11px] font-black uppercase tracking-wide text-slate-400}.stat{@apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow}.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}.stat strong{@apply mt-1 block text-xl font-black text-slate-950}.stat small{@apply mt-1 block text-xs font-semibold text-slate-400}.age-card{@apply rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/30}.age-card.active{@apply border-blue-400 bg-blue-50}.age-card span{@apply block text-xs font-black text-slate-500}.age-card strong{@apply mt-1 block text-base font-black text-slate-950}.age-card small{@apply mt-1 block text-xs font-semibold text-slate-400}.customer-row{@apply flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-blue-300 hover:bg-blue-50/30}.customer-row.active{@apply border-blue-400 bg-blue-50}.filter-chip{@apply rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700}.status{@apply inline-flex rounded-full px-2.5 py-1 text-[11px] font-black}.status.paid{@apply bg-emerald-100 text-emerald-700}.status.part{@apply bg-amber-100 text-amber-800}.status.overdue{@apply bg-red-100 text-red-700}.status.open{@apply bg-slate-100 text-slate-700}.age-pill{@apply inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600}.table-link{@apply font-black text-blue-600 hover:underline}.modal-close{@apply flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-600 hover:bg-slate-50}.summary{@apply rounded-xl border border-slate-200 bg-white p-3}.summary span{@apply block text-[11px] font-black uppercase tracking-wide text-slate-400}.summary strong{@apply mt-1 block text-lg font-black text-slate-950}.detail-card{@apply rounded-xl border border-slate-200 bg-white p-4}.detail-title{@apply mb-3 font-black text-slate-950}.detail-list>div{@apply flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0}.detail-list dt{@apply text-slate-500}.detail-list dd{@apply text-right font-bold text-slate-900}th{@apply border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500}td{@apply border-b border-slate-100 px-4 py-3 align-middle text-slate-700}
</style>
