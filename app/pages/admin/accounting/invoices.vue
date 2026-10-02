<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminSalesWorkflow />

    <div class="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600 hover:underline">← Accounting</NuxtLink>
        <p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">Sales &amp; Invoices</p>
        <h1 class="mt-1 text-3xl font-black text-slate-950">Invoice Register</h1>
        <p class="mt-1 max-w-3xl text-slate-500">
          Manage customer invoices, review payment status and post selected historical orders into accounting.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/admin/accounting/receivables" class="secondary">Accounts Receivable</NuxtLink>
        <button type="button" class="secondary" :disabled="loading" @click="load">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div
      v-if="msg"
      class="mt-5 rounded-xl border px-4 py-3 text-sm font-semibold"
      :class="msgType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
    >
      {{ msg }}
    </div>

    <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <button type="button" class="stat text-left" @click="filter = 'all'">
        <span>Total Invoices</span><strong>{{ invoices.length }}</strong><small>{{ money(invoiceTotal) }} invoiced</small>
      </button>
      <button type="button" class="stat text-left" @click="filter = 'unpaid'">
        <span>Unpaid</span><strong>{{ unpaidInvoices.length }}</strong><small>{{ money(unpaidTotal) }} outstanding</small>
      </button>
      <button type="button" class="stat text-left" @click="filter = 'part_paid'">
        <span>Part Paid</span><strong>{{ partPaidInvoices.length }}</strong><small>{{ money(partPaidTotal) }} remaining</small>
      </button>
      <button type="button" class="stat text-left" @click="filter = 'overdue'">
        <span>Overdue</span><strong :class="overdueInvoices.length ? '!text-red-700' : ''">{{ overdueInvoices.length }}</strong><small>{{ money(overdueTotal) }} overdue</small>
      </button>
      <button type="button" class="stat text-left" @click="filter = 'paid'">
        <span>Paid</span><strong>{{ paidInvoices.length }}</strong><small>{{ money(paidTotal) }} collected</small>
      </button>
    </section>

    <!-- Historical / Unposted Orders deliberately separated from the invoice register -->
    <section v-if="unposted.length" class="panel mt-5 overflow-hidden">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-4 p-5 text-left"
        @click="showUnposted = !showUnposted"
      >
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-black text-slate-950">Historical / Unposted Orders</h2>
            <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{{ unposted.length }}</span>
          </div>
          <p class="mt-1 text-sm text-slate-500">
            These are not accounting invoices until you explicitly post them.
          </p>
        </div>
        <span class="text-xl font-black text-slate-400">{{ showUnposted ? '−' : '+' }}</span>
      </button>

      <div v-if="showUnposted" class="border-t border-slate-200">
        <div class="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
          Post only historical orders you want permanently included in Kialla Accounting.
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[850px] text-sm">
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th class="text-right">Total</th><th class="text-right">Action</th></tr></thead>
            <tbody>
              <tr v-for="o in unposted" :key="o.id">
                <td class="font-black text-slate-950">#{{ o.id }}</td>
                <td>{{ date(o.created_at) }}</td>
                <td><div class="font-bold">{{ o.customer_name || o.customer_email || 'Unknown Customer' }}</div><div v-if="o.customer_name && o.customer_email" class="text-xs text-slate-400">{{ o.customer_email }}</div></td>
                <td class="text-right font-black">{{ money(o.total) }}</td>
                <td class="text-right"><button type="button" class="primary !px-3 !py-1.5" :disabled="postingOrder === o.id" @click="postOrder(o)">{{ postingOrder === o.id ? 'Posting…' : 'Post to Accounting' }}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-4 md:p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 class="text-xl font-black text-slate-950">Accounting Invoices</h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ filteredInvoices.length }} invoice{{ filteredInvoices.length === 1 ? '' : 's' }} ·
              {{ money(filteredBalance) }} outstanding in this view
            </p>
          </div>

          <div class="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:w-auto">
            <label class="field xl:min-w-[175px]">
              <span>Status</span>
              <select v-model="filter" class="input">
                <option value="all">All Invoices</option>
                <option value="unpaid">Unpaid</option>
                <option value="part_paid">Part Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
            <label class="field xl:min-w-[160px]"><span>From</span><input v-model="dateFrom" type="date" class="input"></label>
            <label class="field xl:min-w-[160px]"><span>To</span><input v-model="dateTo" type="date" class="input"></label>
            <label class="field xl:min-w-[300px]"><span>Search</span><input v-model="search" type="search" class="input" placeholder="Invoice, customer or email…"></label>
          </div>
        </div>
        <div v-if="dateFrom || dateTo || search" class="mt-3">
          <button type="button" class="text-xs font-black text-blue-600 hover:underline" @click="clearFilters">Clear search/date filters</button>
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center text-sm font-semibold text-slate-500">Loading invoice register…</div>
      <div v-else-if="!filteredInvoices.length" class="p-12 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">✓</div>
        <h3 class="mt-3 font-black text-slate-900">No invoices in this view</h3>
        <p class="mt-1 text-sm text-slate-500">Try changing or clearing the current filters.</p>
      </div>

      <div v-else>
        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[1150px] text-sm">
            <thead>
              <tr>
                <th>Invoice</th><th>Date</th><th>Customer</th><th>Status</th>
                <th class="text-right">Total</th><th class="text-right">Paid</th><th class="text-right">Balance</th>
                <th class="w-[110px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in filteredInvoices" :key="i.id" :class="{ 'bg-red-50/40': isOverdue(i) }">
                <td><div class="font-black text-slate-950">{{ i.invoice_number }}</div><div v-if="i.order_id" class="mt-0.5 text-xs font-semibold text-slate-400">Order #{{ i.order_id }}</div></td>
                <td>{{ date(i.invoice_date) }}</td>
                <td><div class="font-bold text-slate-900">{{ customerName(i) }}</div><div v-if="i.customer_email" class="mt-0.5 text-xs text-slate-400">{{ i.customer_email }}</div></td>
                <td><span class="status" :class="statusClass(i)">{{ statusLabel(i) }}</span></td>
                <td class="text-right font-semibold">{{ money(i.total) }}</td>
                <td class="text-right text-emerald-700">{{ money(i.paid_amount) }}</td>
                <td class="text-right text-base font-black">{{ money(balance(i)) }}</td>
                <td class="text-right"><button type="button" class="table-link" @click="openInvoice(i)">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-slate-200 lg:hidden">
          <article v-for="i in filteredInvoices" :key="i.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0"><h3 class="font-black text-slate-950">{{ i.invoice_number }}</h3><p class="mt-1 truncate text-sm font-semibold text-slate-500">{{ customerName(i) }}</p></div>
              <div class="text-right"><div class="label">Balance</div><div class="text-lg font-black">{{ money(balance(i)) }}</div></div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><div class="label">Date</div><div class="font-bold">{{ date(i.invoice_date) }}</div></div>
              <div><div class="label">Total</div><div class="font-bold">{{ money(i.total) }}</div></div>
              <div><div class="label">Status</div><span class="status mt-1" :class="statusClass(i)">{{ statusLabel(i) }}</span></div>
            </div>
            <div class="mt-4 flex justify-end"><button type="button" class="secondary !px-3 !py-1.5" @click="openInvoice(i)">View Invoice</button></div>
          </article>
        </div>
      </div>
    </section>

    <!-- Invoice detail popup -->
    <Teleport to="body">
      <div v-if="selectedInvoice" class="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" @click.self="closeInvoice">
        <section class="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">Accounting Invoice</p>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <h2 id="invoice-detail-title" class="text-xl font-black text-slate-950">{{ selectedInvoice.invoice_number }}</h2>
                <span class="status" :class="statusClass(selectedInvoice)">{{ statusLabel(selectedInvoice) }}</span>
              </div>
              <p class="mt-1 truncate text-sm font-semibold text-slate-500">{{ customerName(selectedInvoice) }}<span v-if="selectedInvoice.customer_email"> · {{ selectedInvoice.customer_email }}</span></p>
            </div>
            <button type="button" class="modal-close" aria-label="Close invoice" @click="closeInvoice">×</button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-4">
              <div class="summary"><span>Invoice Total</span><strong>{{ money(selectedInvoice.total) }}</strong></div>
              <div class="summary"><span>Paid</span><strong class="!text-emerald-700">{{ money(selectedInvoice.paid_amount) }}</strong></div>
              <div class="summary"><span>Balance</span><strong :class="balance(selectedInvoice) > 0 ? '!text-blue-700' : '!text-emerald-700'">{{ money(balance(selectedInvoice)) }}</strong></div>
              <div class="summary"><span>Invoice Date</span><strong>{{ date(selectedInvoice.invoice_date) }}</strong></div>
            </div>

            <div class="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <section class="detail-card">
                <h3 class="detail-title">Invoice Information</h3>
                <dl class="detail-list">
                  <div><dt>Customer</dt><dd>{{ customerName(selectedInvoice) }}</dd></div>
                  <div><dt>Email</dt><dd>{{ selectedInvoice.customer_email || '—' }}</dd></div>
                  <div><dt>Invoice Date</dt><dd>{{ date(selectedInvoice.invoice_date) }}</dd></div>
                  <div v-if="selectedInvoice.due_date"><dt>Due Date</dt><dd>{{ date(selectedInvoice.due_date) }}</dd></div>
                  <div v-if="selectedInvoice.order_id"><dt>Source Order</dt><dd>#{{ selectedInvoice.order_id }}</dd></div>
                  <div><dt>Subtotal</dt><dd>{{ money(selectedInvoice.subtotal) }}</dd></div>
                  <div><dt>GST</dt><dd>{{ money(selectedInvoice.gst_amount) }}</dd></div>
                </dl>
              </section>

              <section class="detail-card">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="detail-title !mb-0">Payment History</h3>
                  <button v-if="balance(selectedInvoice) > 0" type="button" class="table-link" @click="openPayment">Record Payment</button>
                </div>
                <div v-if="historyLoading" class="py-8 text-center text-sm text-slate-500">Loading payments…</div>
                <div v-else-if="payments.length" class="mt-3 space-y-2">
                  <div v-for="pmt in payments" :key="pmt.id" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div class="flex justify-between gap-3"><strong>{{ money(pmt.amount) }}</strong><span class="text-xs text-slate-500">{{ date(pmt.payment_date || pmt.created_at) }}</span></div>
                    <div class="mt-1 text-xs text-slate-500">{{ pmt.payment_method || 'Payment' }} · {{ pmt.reference || 'No reference' }}<span v-if="pmt.notes"> · {{ pmt.notes }}</span></div>
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-slate-500">No payments recorded.</p>
              </section>
            </div>

            <section class="mt-5">
              <h3 class="detail-title">Invoice Lines</h3>
              <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table class="w-full min-w-[760px] text-sm">
                  <thead><tr><th>Description</th><th>SKU</th><th class="text-right">Qty</th><th class="text-right">Unit Price</th><th class="text-right">GST</th><th class="text-right">Total</th></tr></thead>
                  <tbody>
                    <tr v-for="line in selectedInvoice.accounting_invoice_lines || []" :key="line.id">
                      <td>{{ line.description || '—' }}</td><td>{{ line.sku || '—' }}</td><td class="text-right">{{ line.quantity }}</td>
                      <td class="text-right">{{ money(line.unit_price) }}</td><td class="text-right">{{ money(line.gst_amount) }}</td><td class="text-right font-black">{{ money(line.line_total) }}</td>
                    </tr>
                    <tr v-if="!(selectedInvoice.accounting_invoice_lines || []).length"><td colspan="6" class="p-8 text-center text-slate-500">No invoice line detail is available.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <footer class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
            <div class="text-sm text-slate-500">Outstanding: <strong class="text-slate-950">{{ money(balance(selectedInvoice)) }}</strong></div>
            <div class="flex gap-2">
              <button v-if="balance(selectedInvoice) > 0" type="button" class="primary" @click="openPayment">Record Payment</button>
              <button type="button" class="secondary" @click="closeInvoice">Close</button>
            </div>
          </footer>
        </section>
      </div>
    </Teleport>

    <!-- Payment popup -->
    <Teleport to="body">
      <div v-if="paymentOpen && selectedInvoice" class="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" @click.self="closePayment">
        <section class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">Accounts Receivable</p>
              <h2 class="mt-1 text-xl font-black text-slate-950">Record Customer Payment</h2>
              <p class="mt-1 text-sm font-semibold text-slate-500">{{ selectedInvoice.invoice_number }} · {{ customerName(selectedInvoice) }}</p>
            </div>
            <button type="button" class="modal-close" @click="closePayment">×</button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="summary"><span>Invoice Total</span><strong>{{ money(selectedInvoice.total) }}</strong></div>
              <div class="summary"><span>Already Paid</span><strong>{{ money(selectedInvoice.paid_amount) }}</strong></div>
              <div class="summary"><span>Outstanding</span><strong class="!text-blue-700">{{ money(balance(selectedInvoice)) }}</strong></div>
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="field"><span>Payment Date</span><input v-model="form.payment_date" type="date" class="input"></label>
              <label class="field">
                <span>Amount</span><input v-model.number="form.amount" type="number" min="0.01" :max="balance(selectedInvoice)" step="0.01" class="input">
                <button type="button" class="mt-1 text-left text-xs font-black text-blue-600 hover:underline" @click="form.amount = balance(selectedInvoice)">Pay full balance</button>
              </label>
              <label class="field"><span>Payment Method</span><select v-model="form.payment_method" class="input"><option>Bank Transfer</option><option>EFTPOS</option><option>Cash</option><option>Stripe</option><option>Other</option></select></label>
              <label class="field"><span>Reference</span><input v-model="form.reference" class="input" placeholder="Receipt / bank reference"></label>
              <label class="field sm:col-span-2"><span>Notes</span><textarea v-model="form.notes" rows="3" class="input resize-none" placeholder="Optional internal note"></textarea></label>
            </div>
            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex justify-between gap-4"><span class="text-sm font-bold text-slate-600">Balance after payment</span><strong class="text-lg">{{ money(balanceAfterPayment) }}</strong></div>
              <p class="mt-1 text-xs text-slate-500">{{ balanceAfterPayment <= 0 ? 'This invoice will be fully paid.' : 'This invoice will remain part paid.' }}</p>
            </div>
            <div v-if="paymentError" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{{ paymentError }}</div>
          </div>

          <footer class="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
            <button type="button" class="secondary" :disabled="saving" @click="closePayment">Cancel</button>
            <button type="button" class="primary" :disabled="saving || !validPayment" @click="savePayment">{{ saving ? 'Posting Payment…' : `Record ${money(form.amount)} Payment` }}</button>
          </footer>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
const dialog = useAppDialog()
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const { adminFetch } = useAdminFetch()

const invoices = ref<any[]>([])
const unposted = ref<any[]>([])
const loading = ref(true)
const msg = ref('')
const msgType = ref<'success' | 'error'>('success')
const filter = ref('all')
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const showUnposted = ref(false)
const postingOrder = ref<any>(null)

const selectedInvoice = ref<any>(null)
const payments = ref<any[]>([])
const historyLoading = ref(false)
const paymentOpen = ref(false)
const paymentError = ref('')
const saving = ref(false)
const form = reactive({
  amount: 0,
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: 'Bank Transfer',
  reference: '',
  notes: '',
})

const money = (v: any) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(v || 0))
const date = (v: any) => {
  if (!v) return '—'
  const raw = String(v)
  const d = raw.includes('T') ? new Date(raw) : new Date(`${raw.slice(0, 10)}T00:00:00`)
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}
const balance = (i: any) => Math.max(0, Math.round((Number(i.total || 0) - Number(i.paid_amount || 0)) * 100) / 100)
const customerName = (i: any) => i.customer_name || i.customer_email || 'Unknown Customer'

function isOverdue(i: any) {
  if (balance(i) <= 0) return false
  if (String(i.status || '').toLowerCase() === 'overdue') return true
  if (!i.due_date) return false
  const due = new Date(`${String(i.due_date).slice(0, 10)}T00:00:00`)
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)
  return due < today
}

function statusLabel(i: any) {
  if (balance(i) <= 0 || String(i.status || '').toLowerCase() === 'paid') return 'Paid'
  if (isOverdue(i)) return Number(i.paid_amount || 0) > 0 ? 'Part Paid · Overdue' : 'Overdue'
  if (Number(i.paid_amount || 0) > 0 || String(i.status || '').toLowerCase() === 'part_paid') return 'Part Paid'
  return 'Unpaid'
}

function statusClass(i: any) {
  if (balance(i) <= 0 || String(i.status || '').toLowerCase() === 'paid') return 'paid'
  if (isOverdue(i)) return 'overdue'
  if (Number(i.paid_amount || 0) > 0 || String(i.status || '').toLowerCase() === 'part_paid') return 'part'
  return 'open'
}

const paidInvoices = computed(() => invoices.value.filter((i) => balance(i) <= 0 || String(i.status || '').toLowerCase() === 'paid'))
const partPaidInvoices = computed(() => invoices.value.filter((i) => balance(i) > 0 && Number(i.paid_amount || 0) > 0))
const overdueInvoices = computed(() => invoices.value.filter(isOverdue))
const unpaidInvoices = computed(() => invoices.value.filter((i) => balance(i) > 0 && Number(i.paid_amount || 0) <= 0))
const invoiceTotal = computed(() => invoices.value.reduce((n, i) => n + Number(i.total || 0), 0))
const unpaidTotal = computed(() => unpaidInvoices.value.reduce((n, i) => n + balance(i), 0))
const partPaidTotal = computed(() => partPaidInvoices.value.reduce((n, i) => n + balance(i), 0))
const overdueTotal = computed(() => overdueInvoices.value.reduce((n, i) => n + balance(i), 0))
const paidTotal = computed(() => paidInvoices.value.reduce((n, i) => n + Number(i.paid_amount || i.total || 0), 0))

const filteredInvoices = computed(() => {
  const q = search.value.trim().toLowerCase()
  return invoices.value
    .filter((i) => {
      if (filter.value === 'unpaid' && !(balance(i) > 0 && Number(i.paid_amount || 0) <= 0)) return false
      if (filter.value === 'part_paid' && !(balance(i) > 0 && Number(i.paid_amount || 0) > 0)) return false
      if (filter.value === 'paid' && !(balance(i) <= 0 || String(i.status || '').toLowerCase() === 'paid')) return false
      if (filter.value === 'overdue' && !isOverdue(i)) return false

      const invoiceDate = String(i.invoice_date || '').slice(0, 10)
      if (dateFrom.value && invoiceDate < dateFrom.value) return false
      if (dateTo.value && invoiceDate > dateTo.value) return false

      const haystack = [i.invoice_number, i.customer_name, i.customer_email, i.order_id].filter(Boolean).join(' ').toLowerCase()
      return !q || haystack.includes(q)
    })
    .sort((a, b) => String(b.invoice_date || '').localeCompare(String(a.invoice_date || '')))
})

const filteredBalance = computed(() => filteredInvoices.value.reduce((n, i) => n + balance(i), 0))

function clearFilters() {
  search.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

async function openInvoice(i: any) {
  selectedInvoice.value = i
  payments.value = []
  historyLoading.value = true
  try {
    payments.value = await adminFetch(`/api/admin/accounting/customer-payments?invoice_id=${i.id}`)
  } catch {
    payments.value = []
  } finally {
    historyLoading.value = false
  }
}

function closeInvoice() {
  if (paymentOpen.value) return
  selectedInvoice.value = null
  payments.value = []
}

const balanceAfterPayment = computed(() =>
  selectedInvoice.value
    ? Math.max(0, Math.round((balance(selectedInvoice.value) - Number(form.amount || 0)) * 100) / 100)
    : 0,
)

const validPayment = computed(() => {
  if (!selectedInvoice.value) return false
  const amount = Number(form.amount || 0)
  return amount > 0 && amount <= balance(selectedInvoice.value) && Boolean(form.payment_date)
})

function openPayment() {
  if (!selectedInvoice.value || balance(selectedInvoice.value) <= 0) return
  form.amount = balance(selectedInvoice.value)
  form.payment_date = new Date().toISOString().slice(0, 10)
  form.payment_method = 'Bank Transfer'
  form.reference = ''
  form.notes = ''
  paymentError.value = ''
  paymentOpen.value = true
}

function closePayment() {
  if (saving.value) return
  paymentOpen.value = false
  paymentError.value = ''
}

async function savePayment() {
  if (!selectedInvoice.value || !validPayment.value) return
  const invoiceId = Number(selectedInvoice.value.id)
  const amount = Number(form.amount)
  saving.value = true
  paymentError.value = ''
  try {
    await adminFetch('/api/admin/accounting/customer-payments', {
      method: 'POST',
      body: { invoice_id: invoiceId, ...form },
    })
    paymentOpen.value = false
    await load(false)
    selectedInvoice.value = invoices.value.find((i) => Number(i.id) === invoiceId) || null
    if (selectedInvoice.value) {
      payments.value = await adminFetch(`/api/admin/accounting/customer-payments?invoice_id=${invoiceId}`)
    }
    msgType.value = 'success'
    msg.value = `Payment of ${money(amount)} recorded successfully.`
  } catch (e: any) {
    paymentError.value = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Unable to record payment.'
  } finally {
    saving.value = false
  }
}

async function postOrder(o: any) {
  if (!await dialog.confirm(`Post Order #${o.id} to accounting? This creates a permanent invoice and journal.`)) return
  postingOrder.value = o.id
  try {
    const x: any = await adminFetch('/api/admin/accounting/post-order', { method: 'POST', body: { order_id: o.id } })
    msgType.value = 'success'
    msg.value = `${x.invoice_number || 'Invoice'} posted to accounting.`
    await load(false)
  } catch (e: any) {
    msgType.value = 'error'
    msg.value = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Unable to post order.'
  } finally {
    postingOrder.value = null
  }
}

async function load(showSpinner = true) {
  if (showSpinner) loading.value = true
  if (showSpinner) msg.value = ''
  try {
    const [invoiceRows, unpostedRows] = await Promise.all([
      adminFetch('/api/admin/accounting/invoices'),
      adminFetch('/api/admin/accounting/unposted-orders'),
    ])
    invoices.value = invoiceRows || []
    unposted.value = unpostedRows || []
  } catch (e: any) {
    msgType.value = 'error'
    msg.value = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Unable to load Sales & Invoices.'
  } finally {
    loading.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (paymentOpen.value) return closePayment()
  if (selectedInvoice.value) closeInvoice()
}

watch([selectedInvoice, paymentOpen], ([invoice, paying]) => {
  if (!import.meta.client) return
  document.body.style.overflow = invoice || paying ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  load()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.panel{@apply rounded-2xl border border-slate-200 bg-white shadow-sm}
.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50}
.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50}
.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100}
.field{@apply grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500}
.label{@apply text-[11px] font-black uppercase tracking-wide text-slate-400}
.stat{@apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow}
.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}
.stat strong{@apply mt-1 block text-xl font-black text-slate-950}
.stat small{@apply mt-1 block text-xs font-semibold text-slate-400}
.status{@apply inline-flex rounded-full px-2.5 py-1 text-[11px] font-black}
.status.paid{@apply bg-emerald-100 text-emerald-700}
.status.part{@apply bg-amber-100 text-amber-800}
.status.overdue{@apply bg-red-100 text-red-700}
.status.open{@apply bg-slate-100 text-slate-700}
.table-link{@apply font-black text-blue-600 hover:underline}
.modal-close{@apply flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-600 hover:bg-slate-50}
.summary{@apply rounded-xl border border-slate-200 bg-white p-3}
.summary span{@apply block text-[11px] font-black uppercase tracking-wide text-slate-400}
.summary strong{@apply mt-1 block text-lg font-black text-slate-950}
.detail-card{@apply rounded-xl border border-slate-200 bg-white p-4}
.detail-title{@apply mb-3 font-black text-slate-950}
.detail-list>div{@apply flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0}
.detail-list dt{@apply text-slate-500}
.detail-list dd{@apply text-right font-bold text-slate-900}
th{@apply border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500}
td{@apply border-b border-slate-100 px-4 py-3 align-middle text-slate-700}
</style>
