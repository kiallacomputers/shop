<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600 hover:underline">
          ← Accounting
        </NuxtLink>
        <p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">Accounts Payable</p>
        <h1 class="mt-1 text-3xl font-black text-slate-950">Payables Dashboard</h1>
        <p class="mt-1 max-w-3xl text-slate-500">
          See what Kialla Computers owes, when bills are due, supplier exposure and payables ageing.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/admin/purchasing/suppliers/bills" class="primary">Supplier Bills</NuxtLink>
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
      <button class="stat text-left" type="button" @click="setView('all')">
        <span>Total Accounts Payable</span>
        <strong>{{ money(totalOutstanding) }}</strong>
        <small>{{ openBills.length }} open bill{{ openBills.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="setView('overdue')">
        <span>Overdue</span>
        <strong :class="overdueBills.length ? '!text-red-700' : ''">{{ money(overdueTotal) }}</strong>
        <small>{{ overdueBills.length }} overdue bill{{ overdueBills.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="setView('due7')">
        <span>Due This Week</span>
        <strong>{{ money(due7Total) }}</strong>
        <small>{{ due7Bills.length }} bill{{ due7Bills.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="setView('due_month')">
        <span>Due This Month</span>
        <strong>{{ money(dueMonthTotal) }}</strong>
        <small>{{ dueMonthBills.length }} bill{{ dueMonthBills.length === 1 ? '' : 's' }}</small>
      </button>
      <button class="stat text-left" type="button" @click="supplierOnly = ''">
        <span>Suppliers Owing</span>
        <strong>{{ supplierGroups.length }}</strong>
        <small>with open balances</small>
      </button>
    </section>

    <section class="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div class="panel p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-black text-slate-950">Payables Ageing</h2>
            <p class="mt-1 text-sm text-slate-500">Outstanding balances grouped by how long they have been overdue.</p>
          </div>
          <button v-if="ageFilter" type="button" class="text-sm font-black text-blue-600 hover:underline" @click="ageFilter = ''">
            Clear ageing filter
          </button>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-5">
          <button
            v-for="a in ageingCards"
            :key="a.key"
            type="button"
            class="age-card"
            :class="{ active: ageFilter === a.key }"
            @click="ageFilter = ageFilter === a.key ? '' : a.key"
          >
            <span>{{ a.label }}</span>
            <strong>{{ money(a.value) }}</strong>
            <small>{{ a.count }} bill{{ a.count === 1 ? '' : 's' }}</small>
          </button>
        </div>
      </div>

      <div class="panel p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-black text-slate-950">Supplier Exposure</h2>
            <p class="mt-1 text-sm text-slate-500">Current outstanding balance by supplier.</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {{ supplierGroups.length }} suppliers
          </span>
        </div>

        <div class="mt-4 max-h-[310px] space-y-2 overflow-y-auto pr-1">
          <button
            v-for="g in supplierGroups"
            :key="g.id"
            type="button"
            class="supplier-row"
            :class="{ active: supplierOnly === g.id }"
            @click="supplierOnly = supplierOnly === g.id ? '' : g.id"
          >
            <div class="min-w-0 text-left">
              <div class="truncate font-black text-slate-900">{{ g.name }}</div>
              <div class="mt-0.5 text-xs font-semibold text-slate-400">
                {{ g.bills.length }} bill{{ g.bills.length === 1 ? '' : 's' }}
                <template v-if="g.overdueCount"> · {{ g.overdueCount }} overdue</template>
              </div>
            </div>
            <strong class="shrink-0 text-slate-950">{{ money(g.total) }}</strong>
          </button>
          <div v-if="!supplierGroups.length" class="py-8 text-center text-sm text-slate-500">
            No outstanding supplier balances.
          </div>
        </div>
      </div>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-4 md:p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 class="text-xl font-black text-slate-950">Upcoming Payments</h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ visibleBills.length }} open bill{{ visibleBills.length === 1 ? '' : 's' }} · {{ money(visibleOutstanding) }} outstanding in this view
            </p>
          </div>

          <div class="flex w-full flex-col gap-2 md:flex-row xl:w-auto">
            <label class="field md:min-w-[185px]">
              <span>View</span>
              <select v-model="filter" class="input">
                <option value="all">All Open Bills</option>
                <option value="overdue">Overdue</option>
                <option value="due7">Due This Week</option>
                <option value="due_month">Due This Month</option>
                <option value="part_paid">Part Paid</option>
              </select>
            </label>
            <label class="field md:min-w-[330px]">
              <span>Search</span>
              <input v-model="search" type="search" class="input" placeholder="Supplier, bill or supplier invoice…">
            </label>
          </div>
        </div>

        <div v-if="supplierOnly || ageFilter" class="mt-3 flex flex-wrap gap-2">
          <button v-if="supplierOnly" type="button" class="filter-chip" @click="supplierOnly = ''">
            Supplier: {{ supplierName(supplierOnly) }} ×
          </button>
          <button v-if="ageFilter" type="button" class="filter-chip" @click="ageFilter = ''">
            Ageing: {{ ageingCards.find((x) => x.key === ageFilter)?.label }} ×
          </button>
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center text-sm font-semibold text-slate-500">Loading accounts payable…</div>

      <div v-else-if="!visibleBills.length" class="p-12 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">✓</div>
        <h3 class="mt-3 font-black text-slate-900">Nothing to pay in this view</h3>
        <p class="mt-1 text-sm text-slate-500">Try clearing the current filters.</p>
      </div>

      <div v-else>
        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[1100px] text-sm">
            <thead>
              <tr>
                <th>Supplier / Bill</th>
                <th>Supplier Invoice</th>
                <th>Due Date</th>
                <th>Age</th>
                <th class="text-right">Bill Total</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Outstanding</th>
                <th>Status</th>
                <th class="w-[110px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in visibleBills" :key="b.id" :class="{ 'bg-red-50/40': isOverdue(b) }">
                <td>
                  <div class="font-black text-slate-950">{{ b.accounting_suppliers?.name || 'Unknown Supplier' }}</div>
                  <div class="mt-0.5 text-xs font-bold text-slate-500">{{ b.bill_number }}</div>
                </td>
                <td>{{ b.supplier_invoice_number || '—' }}</td>
                <td>
                  <div class="font-bold" :class="{ 'text-red-700': isOverdue(b) }">{{ date(b.due_date) }}</div>
                  <div class="mt-0.5 text-xs font-semibold" :class="dueClass(b)">{{ dueText(b) }}</div>
                </td>
                <td><span class="age-pill">{{ ageLabel(b) }}</span></td>
                <td class="text-right font-semibold">{{ money(b.total) }}</td>
                <td class="text-right text-slate-500">{{ money(b.paid_amount) }}</td>
                <td class="text-right text-base font-black">{{ money(owing(b)) }}</td>
                <td><span class="status" :class="statusClass(b)">{{ displayStatus(b) }}</span></td>
                <td class="text-right"><button type="button" class="table-link" @click="openBill(b)">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-slate-200 lg:hidden">
          <article v-for="b in visibleBills" :key="b.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-black text-slate-950">{{ b.accounting_suppliers?.name || 'Unknown Supplier' }}</h3>
                <p class="mt-1 text-xs font-bold text-slate-500">{{ b.bill_number }} · {{ b.supplier_invoice_number || 'No supplier invoice' }}</p>
              </div>
              <div class="text-right">
                <div class="label">Outstanding</div>
                <div class="text-lg font-black">{{ money(owing(b)) }}</div>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><div class="label">Due</div><div class="font-bold" :class="{ 'text-red-700': isOverdue(b) }">{{ date(b.due_date) }}</div></div>
              <div><div class="label">Age</div><div class="font-bold">{{ ageLabel(b) }}</div></div>
              <div><div class="label">Status</div><span class="status mt-1" :class="statusClass(b)">{{ displayStatus(b) }}</span></div>
            </div>
            <div class="mt-4 flex justify-end">
              <button type="button" class="secondary !px-3 !py-1.5" @click="openBill(b)">View Bill</button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-5">
        <h2 class="text-xl font-black text-slate-950">Recent Supplier Payments</h2>
        <p class="mt-1 text-sm text-slate-500">Most recently recorded Accounts Payable payments.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px] text-sm">
          <thead><tr><th>Date</th><th>Supplier</th><th>Bill</th><th>Method</th><th>Reference</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            <tr v-for="paymentRow in payments.slice(0, 20)" :key="paymentRow.id">
              <td>{{ date(paymentRow.payment_date || paymentRow.created_at) }}</td>
              <td>{{ paymentRow.accounting_supplier_bills?.accounting_suppliers?.name || '—' }}</td>
              <td>{{ paymentRow.accounting_supplier_bills?.bill_number || '—' }}</td>
              <td>{{ methodLabel(paymentRow.payment_method) }}</td>
              <td>{{ paymentRow.reference || '—' }}</td>
              <td class="text-right font-black">{{ money(paymentRow.amount) }}</td>
            </tr>
            <tr v-if="!payments.length"><td colspan="6" class="p-10 text-center text-slate-500">No supplier payments recorded yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Supplier Bill detail popup -->
    <Teleport to="body">
      <div v-if="selectedBill" class="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" @click.self="closeBill">
        <section class="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">Supplier Bill</p>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <h2 class="text-xl font-black text-slate-950">{{ selectedBill.bill_number }}</h2>
                <span class="status" :class="statusClass(selectedBill)">{{ displayStatus(selectedBill) }}</span>
              </div>
              <p class="mt-1 truncate text-sm font-semibold text-slate-500">
                {{ selectedBill.accounting_suppliers?.name || 'Unknown Supplier' }}
                <span v-if="selectedBill.supplier_invoice_number"> · Invoice {{ selectedBill.supplier_invoice_number }}</span>
              </p>
            </div>
            <button type="button" class="modal-close" aria-label="Close supplier bill" @click="closeBill">×</button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-4">
              <div class="summary"><span>Total</span><strong>{{ money(selectedBill.total) }}</strong></div>
              <div class="summary"><span>Paid</span><strong>{{ money(selectedBill.paid_amount) }}</strong></div>
              <div class="summary"><span>Outstanding</span><strong class="!text-blue-700">{{ money(owing(selectedBill)) }}</strong></div>
              <div class="summary"><span>Due</span><strong :class="{ '!text-red-700': isOverdue(selectedBill) }">{{ date(selectedBill.due_date) }}</strong></div>
            </div>

            <div class="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <section class="detail-card">
                <h3 class="detail-title">Bill Information</h3>
                <dl class="detail-list">
                  <div><dt>Supplier Invoice</dt><dd>{{ selectedBill.supplier_invoice_number || '—' }}</dd></div>
                  <div><dt>Bill Date</dt><dd>{{ date(selectedBill.bill_date) }}</dd></div>
                  <div><dt>Due Date</dt><dd>{{ date(selectedBill.due_date) }}</dd></div>
                  <div><dt>Subtotal</dt><dd>{{ money(selectedBill.subtotal) }}</dd></div>
                  <div><dt>GST</dt><dd>{{ money(selectedBill.gst_amount) }}</dd></div>
                  <div v-if="selectedBill.purchase_order"><dt>Purchase Order</dt><dd>{{ selectedBill.purchase_order.po_number }}</dd></div>
                </dl>
              </section>

              <section class="detail-card">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="detail-title !mb-0">Payment History</h3>
                  <button v-if="owing(selectedBill) > 0" type="button" class="table-link" @click="openPayment">Record Payment</button>
                </div>
                <div v-if="selectedBill.payments?.length" class="mt-3 space-y-2">
                  <div v-for="pmt in selectedBill.payments" :key="pmt.id" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div class="flex justify-between gap-3"><strong>{{ money(pmt.amount) }}</strong><span class="text-xs text-slate-500">{{ date(pmt.payment_date || pmt.created_at) }}</span></div>
                    <div class="mt-1 text-xs text-slate-500">{{ methodLabel(pmt.payment_method) }} · {{ pmt.reference || 'No reference' }}</div>
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-slate-500">No payments recorded yet.</p>
              </section>
            </div>

            <section class="mt-5">
              <h3 class="detail-title">Bill Lines</h3>
              <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table class="w-full min-w-[720px] text-sm">
                  <thead><tr><th>Description</th><th>SKU</th><th class="text-right">Qty</th><th class="text-right">Unit ex GST</th><th class="text-right">GST</th><th class="text-right">Total</th></tr></thead>
                  <tbody>
                    <tr v-for="line in selectedBill.accounting_supplier_bill_lines || []" :key="line.id">
                      <td>{{ line.description || '—' }}</td><td>{{ line.sku || '—' }}</td><td class="text-right">{{ line.quantity }}</td>
                      <td class="text-right">{{ money(line.unit_cost_ex_gst) }}</td><td class="text-right">{{ money(line.gst_amount) }}</td><td class="text-right font-bold">{{ money(line.line_total) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <footer class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
            <div class="text-sm text-slate-500">Outstanding: <strong class="text-slate-950">{{ money(owing(selectedBill)) }}</strong></div>
            <div class="flex gap-2">
              <button v-if="owing(selectedBill) > 0" type="button" class="primary" @click="openPayment">Record Payment</button>
              <button type="button" class="secondary" @click="closeBill">Close</button>
            </div>
          </footer>
        </section>
      </div>
    </Teleport>

    <!-- Payment popup -->
    <Teleport to="body">
      <div v-if="paymentOpen && selectedBill" class="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" @click.self="closePayment">
        <section class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">Accounts Payable</p>
              <h2 class="mt-1 text-xl font-black text-slate-950">Record Supplier Payment</h2>
              <p class="mt-1 text-sm font-semibold text-slate-500">{{ selectedBill.accounting_suppliers?.name }} · {{ selectedBill.bill_number }}</p>
            </div>
            <button type="button" class="modal-close" @click="closePayment">×</button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="summary"><span>Bill Total</span><strong>{{ money(selectedBill.total) }}</strong></div>
              <div class="summary"><span>Already Paid</span><strong>{{ money(selectedBill.paid_amount) }}</strong></div>
              <div class="summary"><span>Outstanding</span><strong class="!text-blue-700">{{ money(owing(selectedBill)) }}</strong></div>
            </div>

            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="field"><span>Payment Date</span><input v-model="payment.payment_date" type="date" class="input"></label>
              <label class="field">
                <span>Amount</span>
                <input v-model.number="payment.amount" type="number" min="0.01" :max="owing(selectedBill)" step="0.01" class="input">
                <button type="button" class="mt-1 text-left text-xs font-black text-blue-600 hover:underline" @click="payment.amount = owing(selectedBill)">Pay full balance</button>
              </label>
              <label class="field"><span>Payment Method</span><select v-model="payment.payment_method" class="input"><option v-for="m in paymentOptions.payment_methods || []" :key="m.value" :value="m.value">{{ m.label }}</option></select></label>
              <label class="field"><span>Bank Account</span><select v-model="payment.bank_account_id" class="input"><option :value="null">Default Bank Account</option><option v-for="a in paymentOptions.bank_accounts || []" :key="a.id" :value="a.id">{{ a.name }}</option></select></label>
              <label class="field sm:col-span-2"><span>Reference</span><input v-model="payment.reference" class="input" placeholder="EFT, receipt or transaction reference"></label>
              <label class="field sm:col-span-2"><span>Notes</span><textarea v-model="payment.notes" rows="3" class="input resize-none" placeholder="Optional internal note"></textarea></label>
            </div>

            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex justify-between gap-4"><span class="text-sm font-bold text-slate-600">Balance after payment</span><strong class="text-lg">{{ money(balanceAfterPayment) }}</strong></div>
            </div>
            <div v-if="paymentError" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{{ paymentError }}</div>
          </div>

          <footer class="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
            <button type="button" class="secondary" :disabled="paymentSaving" @click="closePayment">Cancel</button>
            <button type="button" class="primary" :disabled="paymentSaving || !validPayment" @click="savePayment">
              {{ paymentSaving ? 'Posting Payment…' : `Record ${money(payment.amount)} Payment` }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { adminFetch } = useAdminFetch()

const bills = ref<any[]>([])
const payments = ref<any[]>([])
const paymentOptions = ref<any>({ bank_accounts: [], payment_methods: [] })
const loading = ref(true)
const msg = ref('')
const msgType = ref<'success' | 'error'>('success')
const search = ref('')
const filter = ref('all')
const ageFilter = ref('')
const supplierOnly = ref('')
const selectedBill = ref<any>(null)

const paymentOpen = ref(false)
const paymentSaving = ref(false)
const paymentError = ref('')
const payment = reactive<any>({
  payment_date: new Date().toISOString().slice(0, 10),
  amount: 0,
  payment_method: 'bank_transfer',
  bank_account_id: null,
  reference: '',
  notes: '',
})

const money = (value: any) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value || 0))

const owing = (bill: any) =>
  Math.max(0, Math.round((Number(bill.total || 0) - Number(bill.paid_amount || 0)) * 100) / 100)

const date = (value: any) => {
  if (!value) return '—'
  const raw = String(value)
  const d = raw.includes('T') ? new Date(raw) : new Date(`${raw.slice(0, 10)}T00:00:00`)
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

const today = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)

function daysOverdue(bill: any) {
  if (!bill.due_date) return 0
  return Math.floor((today().getTime() - new Date(`${String(bill.due_date).slice(0, 10)}T00:00:00`).getTime()) / 86400000)
}

function daysUntilDue(bill: any) {
  if (!bill.due_date) return null
  return -daysOverdue(bill)
}

function isOverdue(bill: any) {
  return owing(bill) > 0 && daysOverdue(bill) > 0
}

function bucket(bill: any) {
  const d = daysOverdue(bill)
  if (d <= 0) return 'current'
  if (d <= 30) return '1-30'
  if (d <= 60) return '31-60'
  if (d <= 90) return '61-90'
  return '90+'
}

function displayStatus(bill: any) {
  if (owing(bill) <= 0) return 'Paid'
  if (isOverdue(bill)) return Number(bill.paid_amount || 0) > 0 ? 'Part Paid · Overdue' : 'Overdue'
  return Number(bill.paid_amount || 0) > 0 ? 'Part Paid' : 'Current'
}

function statusClass(bill: any) {
  if (owing(bill) <= 0) return 'paid'
  if (isOverdue(bill)) return 'overdue'
  if (Number(bill.paid_amount || 0) > 0) return 'part'
  return 'open'
}

function dueText(bill: any) {
  if (!bill.due_date) return 'No due date'
  const d = daysUntilDue(bill)
  if (d === null) return ''
  if (d < 0) return `${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} overdue`
  if (d === 0) return 'Due today'
  return `Due in ${d} day${d === 1 ? '' : 's'}`
}

function dueClass(bill: any) {
  if (isOverdue(bill)) return 'text-red-700'
  const d = daysUntilDue(bill)
  if (d !== null && d >= 0 && d <= 7) return 'text-amber-700'
  return 'text-slate-400'
}

function ageLabel(bill: any) {
  const key = bucket(bill)
  if (key === 'current') return 'Current'
  return `${key} days`
}

function isDueWithin(bill: any, days: number) {
  const d = daysUntilDue(bill)
  return owing(bill) > 0 && d !== null && d >= 0 && d <= days
}

function isDueThisMonth(bill: any) {
  if (!bill.due_date || owing(bill) <= 0) return false
  const due = new Date(`${String(bill.due_date).slice(0, 10)}T00:00:00`)
  const now = today()
  return due >= now && due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth()
}

const openBills = computed(() => bills.value.filter((b) => owing(b) > 0))
const overdueBills = computed(() => openBills.value.filter(isOverdue))
const due7Bills = computed(() => openBills.value.filter((b) => isDueWithin(b, 7)))
const dueMonthBills = computed(() => openBills.value.filter(isDueThisMonth))

const totalOutstanding = computed(() => openBills.value.reduce((sum, b) => sum + owing(b), 0))
const overdueTotal = computed(() => overdueBills.value.reduce((sum, b) => sum + owing(b), 0))
const due7Total = computed(() => due7Bills.value.reduce((sum, b) => sum + owing(b), 0))
const dueMonthTotal = computed(() => dueMonthBills.value.reduce((sum, b) => sum + owing(b), 0))

const ageingCards = computed(() =>
  [
    ['current', 'Current'],
    ['1-30', '1–30 Days'],
    ['31-60', '31–60 Days'],
    ['61-90', '61–90 Days'],
    ['90+', '90+ Days'],
  ].map(([key, label]) => {
    const rows = openBills.value.filter((b) => bucket(b) === key)
    return { key, label, value: rows.reduce((sum, b) => sum + owing(b), 0), count: rows.length }
  }),
)

const supplierGroups = computed(() => {
  const groups = new Map<string, any>()
  for (const b of openBills.value) {
    const id = String(b.supplier_id || b.accounting_suppliers?.name || 'unknown')
    if (!groups.has(id)) groups.set(id, { id, name: b.accounting_suppliers?.name || 'Unknown Supplier', bills: [], total: 0, overdueCount: 0 })
    const g = groups.get(id)
    g.bills.push(b)
    g.total += owing(b)
    if (isOverdue(b)) g.overdueCount += 1
  }
  return [...groups.values()].sort((a, b) => b.total - a.total)
})

const visibleBills = computed(() => {
  const q = search.value.trim().toLowerCase()
  return openBills.value
    .filter((b) => {
      if (supplierOnly.value && String(b.supplier_id || b.accounting_suppliers?.name || 'unknown') !== supplierOnly.value) return false
      if (ageFilter.value && bucket(b) !== ageFilter.value) return false
      if (filter.value === 'overdue' && !isOverdue(b)) return false
      if (filter.value === 'due7' && !isDueWithin(b, 7)) return false
      if (filter.value === 'due_month' && !isDueThisMonth(b)) return false
      if (filter.value === 'part_paid' && Number(b.paid_amount || 0) <= 0) return false
      const haystack = [b.accounting_suppliers?.name, b.bill_number, b.supplier_invoice_number].filter(Boolean).join(' ').toLowerCase()
      return !q || haystack.includes(q)
    })
    .sort((a, b) => {
      const ad = a.due_date ? String(a.due_date).slice(0, 10) : '9999-12-31'
      const bd = b.due_date ? String(b.due_date).slice(0, 10) : '9999-12-31'
      return ad.localeCompare(bd)
    })
})

const visibleOutstanding = computed(() => visibleBills.value.reduce((sum, b) => sum + owing(b), 0))

const methodLabel = (value: any) =>
  paymentOptions.value.payment_methods?.find((m: any) => m.value === value)?.label ||
  String(value || 'Bank Transfer / EFT').replaceAll('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

function supplierName(id: string) {
  return supplierGroups.value.find((g) => g.id === id)?.name || 'Supplier'
}

function setView(value: string) {
  filter.value = value
  ageFilter.value = ''
  supplierOnly.value = ''
}

function openBill(bill: any) {
  selectedBill.value = bill
}

function closeBill() {
  if (paymentOpen.value) return
  selectedBill.value = null
}

const balanceAfterPayment = computed(() =>
  selectedBill.value ? Math.max(0, Math.round((owing(selectedBill.value) - Number(payment.amount || 0)) * 100) / 100) : 0,
)

const validPayment = computed(() => {
  if (!selectedBill.value) return false
  const amount = Number(payment.amount || 0)
  return amount > 0 && amount <= owing(selectedBill.value) && Boolean(payment.payment_date)
})

function openPayment() {
  if (!selectedBill.value || owing(selectedBill.value) <= 0) return
  payment.payment_date = new Date().toISOString().slice(0, 10)
  payment.amount = owing(selectedBill.value)
  payment.payment_method = 'bank_transfer'
  payment.bank_account_id = null
  payment.reference = ''
  payment.notes = ''
  paymentError.value = ''
  paymentOpen.value = true
}

function closePayment() {
  if (paymentSaving.value) return
  paymentOpen.value = false
  paymentError.value = ''
}

async function savePayment() {
  if (!selectedBill.value || !validPayment.value) return
  const billId = Number(selectedBill.value.id)
  const amount = Number(payment.amount)
  paymentSaving.value = true
  paymentError.value = ''
  try {
    await adminFetch('/api/admin/accounting/supplier-payments', {
      method: 'POST',
      body: {
        bill_id: billId,
        amount,
        reference: payment.reference,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        bank_account_id: payment.bank_account_id || null,
        notes: payment.notes,
      },
    })
    paymentOpen.value = false
    await load(false)
    selectedBill.value = bills.value.find((b) => Number(b.id) === billId) || null
    msgType.value = 'success'
    msg.value = `Payment of ${money(amount)} recorded successfully.`
  } catch (error: any) {
    paymentError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Unable to record supplier payment.'
  } finally {
    paymentSaving.value = false
  }
}

async function load(showSpinner = true) {
  if (showSpinner) loading.value = true
  if (showSpinner) msg.value = ''
  try {
    const [billRows, paymentRows, options] = await Promise.all([
      adminFetch('/api/admin/accounting/supplier-bills'),
      adminFetch('/api/admin/accounting/supplier-payments'),
      adminFetch('/api/admin/accounting/supplier-payments/options'),
    ])
    bills.value = billRows || []
    payments.value = paymentRows || []
    paymentOptions.value = options || { bank_accounts: [], payment_methods: [] }
  } catch (error: any) {
    msgType.value = 'error'
    msg.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Unable to load Accounts Payable.'
  } finally {
    loading.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (paymentOpen.value) return closePayment()
  if (selectedBill.value) closeBill()
}

watch([selectedBill, paymentOpen], ([bill, paying]) => {
  if (!import.meta.client) return
  document.body.style.overflow = bill || paying ? 'hidden' : ''
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
.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100}
.field{@apply grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500}
.label{@apply text-[11px] font-black uppercase tracking-wide text-slate-400}
.stat{@apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow}
.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}
.stat strong{@apply mt-1 block text-xl font-black text-slate-950}
.stat small{@apply mt-1 block text-xs font-semibold text-slate-400}
.age-card{@apply rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/30}
.age-card.active{@apply border-blue-400 bg-blue-50}
.age-card span{@apply block text-xs font-black text-slate-500}
.age-card strong{@apply mt-1 block text-base font-black text-slate-950}
.age-card small{@apply mt-1 block text-xs font-semibold text-slate-400}
.supplier-row{@apply flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-blue-300 hover:bg-blue-50/30}
.supplier-row.active{@apply border-blue-400 bg-blue-50}
.filter-chip{@apply rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700}
.status{@apply inline-flex rounded-full px-2.5 py-1 text-[11px] font-black}
.status.paid{@apply bg-emerald-100 text-emerald-700}
.status.part{@apply bg-amber-100 text-amber-800}
.status.overdue{@apply bg-red-100 text-red-700}
.status.open{@apply bg-slate-100 text-slate-700}
.age-pill{@apply inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600}
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
