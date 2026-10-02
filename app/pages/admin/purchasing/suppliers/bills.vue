<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />

    <div class="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600 hover:underline">
          ← Accounting
        </NuxtLink>
        <p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">
          Accounts Payable
        </p>
        <h1 class="mt-1 text-3xl font-black text-slate-950">Supplier Bills</h1>
        <p class="mt-1 max-w-3xl text-slate-500">
          Review supplier invoices, purchase order links, due dates, balances and payment history.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/admin/accounting/payables" class="primary">
          Accounts Payable
        </NuxtLink>
        <button class="secondary" type="button" :disabled="loading" @click="load">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div
      v-if="msg"
      class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
    >
      {{ msg }}
    </div>

    <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <button class="stat text-left" type="button" @click="filter = 'open'">
        <span>Outstanding</span>
        <strong>{{ money(totalOutstanding) }}</strong>
        <small>{{ openBills.length }} open bill{{ openBills.length === 1 ? '' : 's' }}</small>
      </button>

      <button class="stat text-left" type="button" @click="filter = 'overdue'">
        <span>Overdue</span>
        <strong :class="overdueBills.length ? 'text-red-700' : ''">{{ money(overdueOutstanding) }}</strong>
        <small>{{ overdueBills.length }} bill{{ overdueBills.length === 1 ? '' : 's' }}</small>
      </button>

      <button class="stat text-left" type="button" @click="filter = 'due_soon'">
        <span>Due in 7 Days</span>
        <strong>{{ money(dueSoonOutstanding) }}</strong>
        <small>{{ dueSoonBills.length }} bill{{ dueSoonBills.length === 1 ? '' : 's' }}</small>
      </button>

      <button class="stat text-left" type="button" @click="filter = 'part_paid'">
        <span>Part Paid</span>
        <strong>{{ partPaidBills.length }}</strong>
        <small>{{ money(partPaidOutstanding) }} remaining</small>
      </button>

      <button class="stat text-left" type="button" @click="filter = 'paid'">
        <span>Paid</span>
        <strong>{{ paidBills.length }}</strong>
        <small>{{ money(paidTotal) }} total</small>
      </button>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-4 md:p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 class="text-xl font-black text-slate-950">Bill Register</h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ filteredBills.length }} bill{{ filteredBills.length === 1 ? '' : 's' }} in this view
            </p>
          </div>

          <div class="flex w-full flex-col gap-2 md:flex-row xl:w-auto">
            <label class="field md:min-w-[190px]">
              <span>Status</span>
              <select v-model="filter" class="input">
                <option value="open">Open</option>
                <option value="overdue">Overdue</option>
                <option value="due_soon">Due in 7 Days</option>
                <option value="part_paid">Part Paid</option>
                <option value="paid">Paid</option>
                <option value="all">All Bills</option>
              </select>
            </label>

            <label class="field md:min-w-[190px]">
              <span>Sort</span>
              <select v-model="sort" class="input">
                <option value="due">Due Date</option>
                <option value="newest">Newest Bill</option>
                <option value="supplier">Supplier</option>
                <option value="balance">Highest Balance</option>
              </select>
            </label>

            <label class="field md:min-w-[330px]">
              <span>Search</span>
              <input
                v-model="search"
                class="input"
                type="search"
                placeholder="Bill, supplier, invoice or PO…"
              >
            </label>
          </div>
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center text-sm font-semibold text-slate-500">
        Loading supplier bills…
      </div>

      <div v-else-if="!filteredBills.length" class="p-12 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">✓</div>
        <h3 class="mt-3 font-black text-slate-900">No supplier bills match this view</h3>
        <p class="mt-1 text-sm text-slate-500">Try another status or clear the search field.</p>
      </div>

      <div v-else>
        <!-- Desktop register -->
        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[1180px] text-sm">
            <thead>
              <tr>
                <th>Bill / Supplier</th>
                <th>Supplier Invoice</th>
                <th>Purchase Order</th>
                <th>Bill Date</th>
                <th>Due Date</th>
                <th class="text-right">Total</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Balance</th>
                <th>Status</th>
                <th class="w-[125px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="b in filteredBills" :key="b.id">
                <tr :class="{ 'bg-red-50/40': isOverdue(b) }">
                  <td>
                    <div class="font-black text-slate-950">{{ b.bill_number }}</div>
                    <div class="mt-0.5 font-semibold text-slate-600">
                      {{ b.accounting_suppliers?.name || 'Unknown supplier' }}
                    </div>
                  </td>
                  <td>{{ b.supplier_invoice_number || '—' }}</td>
                  <td>
                    <template v-if="b.purchase_order">
                      <div class="font-bold text-slate-800">{{ b.purchase_order.po_number }}</div>
                      <div class="mt-0.5 text-xs text-slate-400">{{ poStatus(b.purchase_order.status) }}</div>
                    </template>
                    <span v-else class="text-slate-400">Not linked</span>
                  </td>
                  <td>{{ date(b.bill_date) }}</td>
                  <td>
                    <div class="font-bold" :class="{ 'text-red-700': isOverdue(b) }">
                      {{ date(b.due_date) }}
                    </div>
                    <div v-if="dueText(b)" class="mt-0.5 text-xs font-semibold" :class="dueTextClass(b)">
                      {{ dueText(b) }}
                    </div>
                  </td>
                  <td class="text-right font-semibold">{{ money(b.total) }}</td>
                  <td class="text-right text-slate-500">{{ money(b.paid_amount) }}</td>
                  <td class="text-right text-base font-black">{{ money(owing(b)) }}</td>
                  <td>
                    <span class="status" :class="statusClass(b)">{{ statusLabel(b) }}</span>
                  </td>
                  <td class="text-right">
                    <button class="table-link" type="button" @click="toggle(b.id)">
                      View
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Tablet / mobile cards -->
        <div class="divide-y divide-slate-200 lg:hidden">
          <article v-for="b in filteredBills" :key="b.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-black text-slate-950">{{ b.bill_number }}</h3>
                  <span class="status" :class="statusClass(b)">{{ statusLabel(b) }}</span>
                </div>
                <p class="mt-1 font-semibold text-slate-600">{{ b.accounting_suppliers?.name || 'Unknown supplier' }}</p>
                <p class="mt-1 text-xs text-slate-400">Invoice {{ b.supplier_invoice_number || '—' }}</p>
              </div>
              <div class="text-right">
                <div class="text-xs font-bold uppercase tracking-wide text-slate-400">Balance</div>
                <div class="text-lg font-black">{{ money(owing(b)) }}</div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><div class="label">PO</div><div class="font-bold">{{ b.purchase_order?.po_number || '—' }}</div></div>
              <div><div class="label">Bill Date</div><div class="font-bold">{{ date(b.bill_date) }}</div></div>
              <div><div class="label">Due Date</div><div class="font-bold" :class="{ 'text-red-700': isOverdue(b) }">{{ date(b.due_date) }}</div></div>
              <div><div class="label">Total</div><div class="font-bold">{{ money(b.total) }}</div></div>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div class="text-xs font-semibold" :class="dueTextClass(b)">{{ dueText(b) }}</div>
              <button class="secondary !px-3 !py-1.5" type="button" @click="toggle(b.id)">
                View Details
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="selectedBill"
        class="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
        @click.self="closeBill"
      >
        <section
          class="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supplier-bill-modal-title"
        >
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">Supplier Bill</p>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <h2 id="supplier-bill-modal-title" class="text-xl font-black text-slate-950">
                  {{ selectedBill.bill_number }}
                </h2>
                <span class="status" :class="statusClass(selectedBill)">
                  {{ statusLabel(selectedBill) }}
                </span>
              </div>
              <p class="mt-1 truncate text-sm font-semibold text-slate-500">
                {{ selectedBill.accounting_suppliers?.name || 'Unknown supplier' }}
                <span v-if="selectedBill.supplier_invoice_number">
                  · Invoice {{ selectedBill.supplier_invoice_number }}
                </span>
              </p>
            </div>

            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-600 hover:bg-slate-50"
              aria-label="Close supplier bill"
              @click="closeBill"
            >
              ×
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <BillDetails
              :bill="selectedBill"
              :money="money"
              :date="date"
              :date-time="dateTime"
              :owing="owing"
              :variance="variance"
              :po-status="poStatus"
            />
          </div>

          <footer class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
            <div class="text-sm text-slate-500">
              Outstanding:
              <strong class="text-slate-950">{{ money(owing(selectedBill)) }}</strong>
            </div>
            <div class="flex flex-wrap gap-2">
              <NuxtLink
                v-if="owing(selectedBill) > 0"
                to="/admin/accounting/payables"
                class="primary"
              >
                Record Payment
              </NuxtLink>
              <button type="button" class="secondary" @click="closeBill">Close</button>
            </div>
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
const msg = ref('')
const loading = ref(true)
const filter = ref('open')
const sort = ref('due')
const search = ref('')
const selectedBill = ref<any>(null)

const money = (value: any) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value || 0))

const owing = (bill: any) =>
  Math.max(0, Math.round((Number(bill.total || 0) - Number(bill.paid_amount || 0)) * 100) / 100)

const variance = (bill: any) =>
  Math.round((Number(bill.total || 0) - Number(bill.purchase_order?.total || 0)) * 100) / 100

const date = (value: any) =>
  value
    ? new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
        .format(new Date(`${String(value).slice(0, 10)}T00:00:00`))
    : '—'

const dateTime = (value: any) =>
  value
    ? new Intl.DateTimeFormat('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))
    : '—'

const todayDate = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)

function dayDifference(value: any) {
  if (!value) return null
  const due = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Math.round((due.getTime() - todayDate().getTime()) / 86400000)
}

const isPaid = (bill: any) => owing(bill) <= 0 || String(bill.status || '').toLowerCase() === 'paid'
const isPartPaid = (bill: any) => !isPaid(bill) && Number(bill.paid_amount || 0) > 0
const isOverdue = (bill: any) => {
  const days = dayDifference(bill.due_date)
  return !isPaid(bill) && days !== null && days < 0
}
const isDueSoon = (bill: any) => {
  const days = dayDifference(bill.due_date)
  return !isPaid(bill) && days !== null && days >= 0 && days <= 7
}

function statusLabel(bill: any) {
  if (isPaid(bill)) return 'Paid'
  if (isOverdue(bill) && isPartPaid(bill)) return 'Part Paid · Overdue'
  if (isOverdue(bill)) return 'Overdue'
  if (isPartPaid(bill)) return 'Part Paid'
  const raw = String(bill.status || '').toLowerCase()
  if (raw === 'draft') return 'Draft'
  if (raw === 'posted') return 'Posted'
  return 'Unpaid'
}

function statusClass(bill: any) {
  if (isPaid(bill)) return 'paid'
  if (isOverdue(bill)) return 'overdue'
  if (isPartPaid(bill)) return 'part'
  if (String(bill.status || '').toLowerCase() === 'draft') return 'draft'
  return 'open'
}

function dueText(bill: any) {
  if (isPaid(bill) || !bill.due_date) return ''
  const days = dayDifference(bill.due_date)
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  return `Due in ${days} day${days === 1 ? '' : 's'}`
}

function dueTextClass(bill: any) {
  if (isOverdue(bill)) return 'text-red-700'
  if (isDueSoon(bill)) return 'text-amber-700'
  return 'text-slate-400'
}

const poStatus = (value: any) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (x: string) => x.toUpperCase()) || '—'

const openBills = computed(() => bills.value.filter((bill) => !isPaid(bill)))
const paidBills = computed(() => bills.value.filter(isPaid))
const overdueBills = computed(() => bills.value.filter(isOverdue))
const dueSoonBills = computed(() => bills.value.filter(isDueSoon))
const partPaidBills = computed(() => bills.value.filter(isPartPaid))

const totalOutstanding = computed(() => openBills.value.reduce((sum, bill) => sum + owing(bill), 0))
const overdueOutstanding = computed(() => overdueBills.value.reduce((sum, bill) => sum + owing(bill), 0))
const dueSoonOutstanding = computed(() => dueSoonBills.value.reduce((sum, bill) => sum + owing(bill), 0))
const partPaidOutstanding = computed(() => partPaidBills.value.reduce((sum, bill) => sum + owing(bill), 0))
const paidTotal = computed(() => paidBills.value.reduce((sum, bill) => sum + Number(bill.total || 0), 0))

const filteredBills = computed(() => {
  const q = search.value.trim().toLowerCase()

  const rows = bills.value.filter((bill) => {
    const matchesFilter =
      filter.value === 'all' ||
      (filter.value === 'open' && !isPaid(bill)) ||
      (filter.value === 'overdue' && isOverdue(bill)) ||
      (filter.value === 'due_soon' && isDueSoon(bill)) ||
      (filter.value === 'part_paid' && isPartPaid(bill)) ||
      (filter.value === 'paid' && isPaid(bill))

    const haystack = [
      bill.bill_number,
      bill.accounting_suppliers?.name,
      bill.supplier_invoice_number,
      bill.purchase_order?.po_number,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesFilter && (!q || haystack.includes(q))
  })

  return [...rows].sort((a, b) => {
    if (sort.value === 'supplier') {
      return String(a.accounting_suppliers?.name || '').localeCompare(String(b.accounting_suppliers?.name || ''))
    }
    if (sort.value === 'balance') return owing(b) - owing(a)
    if (sort.value === 'newest') return String(b.bill_date || '').localeCompare(String(a.bill_date || ''))

    // Due date: overdue/earliest first, bills without a due date last.
    const aDue = a.due_date ? String(a.due_date).slice(0, 10) : '9999-12-31'
    const bDue = b.due_date ? String(b.due_date).slice(0, 10) : '9999-12-31'
    return aDue.localeCompare(bDue)
  })
})

function toggle(id: number) {
  selectedBill.value = bills.value.find((bill) => Number(bill.id) === Number(id)) || null
}

function closeBill() {
  selectedBill.value = null
}

function handleBillKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && selectedBill.value) closeBill()
}

watch(selectedBill, (bill) => {
  if (!import.meta.client) return
  document.body.style.overflow = bill ? 'hidden' : ''
})

async function load() {
  loading.value = true
  msg.value = ''
  try {
    bills.value = (await adminFetch('/api/admin/accounting/supplier-bills')) || []
  } catch (error: any) {
    msg.value = error?.data?.statusMessage || error?.message || 'Unable to load supplier bills.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleBillKeydown)
  load()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleBillKeydown)
  document.body.style.overflow = ''
})
</script>

<script lang="ts">
import { defineComponent, h } from 'vue'

export const BillDetails = defineComponent({
  name: 'BillDetails',
  props: {
    bill: { type: Object, required: true },
    money: { type: Function, required: true },
    date: { type: Function, required: true },
    dateTime: { type: Function, required: true },
    owing: { type: Function, required: true },
    variance: { type: Function, required: true },
    poStatus: { type: Function, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'bill-details' }, [
      h('div', { class: 'details-grid' }, [
        h('section', [
          h('h3', { class: 'detail-title' }, 'Bill Summary'),
          h('dl', { class: 'summary-list' }, [
            row('Subtotal', props.money(props.bill.subtotal)),
            row('GST', props.money(props.bill.gst_amount)),
            row('Total', props.money(props.bill.total)),
            row('Paid', props.money(props.bill.paid_amount)),
            row('Outstanding', props.money(props.owing(props.bill)), true),
          ]),
          Number(props.bill.purchase_order?.total || 0) > 0 && Math.abs(props.variance(props.bill)) >= 0.01
            ? h('div', { class: 'variance-box' }, [
                h('span', 'PO variance'),
                h('strong', `${props.variance(props.bill) > 0 ? '+' : ''}${props.money(props.variance(props.bill))}`),
              ])
            : null,
        ]),
        h('section', [
          h('h3', { class: 'detail-title' }, 'Purchase Order'),
          props.bill.purchase_order
            ? h('div', { class: 'detail-card' }, [
                h('div', { class: 'text-base font-black text-slate-950' }, props.bill.purchase_order.po_number),
                pair('Status', props.poStatus(props.bill.purchase_order.status)),
                pair('Ordered', props.date(props.bill.purchase_order.order_date)),
                pair('Expected', props.date(props.bill.purchase_order.expected_date)),
                pair('PO Total', props.money(props.bill.purchase_order.total)),
                h(resolveComponent('NuxtLink') as any, {
                  to: `/admin/purchasing/purchase-orders?po=${props.bill.purchase_order.id}`,
                  class: 'mt-3 inline-block text-sm font-black text-blue-600 hover:underline',
                }, () => 'Open Purchase Orders →'),
              ])
            : h('div', { class: 'text-sm text-slate-500' }, 'This bill is not linked to a purchase order.'),
        ]),
        h('section', [
          h('div', { class: 'flex items-center justify-between gap-2' }, [
            h('h3', { class: 'detail-title !mb-0' }, 'Payment History'),
            Number(props.owing(props.bill)) > 0
              ? h(resolveComponent('NuxtLink') as any, {
                  to: '/admin/accounting/payables',
                  class: 'text-sm font-black text-blue-600 hover:underline',
                }, () => 'Record Payment →')
              : null,
          ]),
          props.bill.payments?.length
            ? h('div', { class: 'mt-3 space-y-2' }, props.bill.payments.map((payment: any) =>
                h('div', { class: 'detail-card', key: payment.id }, [
                  h('div', { class: 'flex justify-between gap-3' }, [
                    h('strong', { class: 'text-slate-950' }, props.money(payment.amount)),
                    h('span', { class: 'text-xs text-slate-500' }, props.dateTime(payment.created_at)),
                  ]),
                  h('div', { class: 'mt-1 text-xs text-slate-500' }, `Reference: ${payment.reference || '—'}`),
                  payment.payment_method
                    ? h('div', { class: 'mt-1 text-xs text-slate-500' }, `Method: ${String(payment.payment_method).replaceAll('_', ' ')}`)
                    : null,
                ])
              ))
            : h('div', { class: 'mt-3 text-sm text-slate-500' }, 'No payments recorded yet.'),
        ]),
      ]),
      h('section', { class: 'mt-5' }, [
        h('h3', { class: 'detail-title' }, 'Bill Lines'),
        h('div', { class: 'overflow-x-auto rounded-xl border border-slate-200 bg-white' }, [
          h('table', { class: 'w-full min-w-[720px] text-sm' }, [
            h('thead', [
              h('tr', [
                h('th', 'Description'),
                h('th', 'SKU'),
                h('th', { class: 'text-right' }, 'Qty'),
                h('th', { class: 'text-right' }, 'Unit ex GST'),
                h('th', { class: 'text-right' }, 'GST'),
                h('th', { class: 'text-right' }, 'Total'),
              ]),
            ]),
            h('tbody',
              (props.bill.accounting_supplier_bill_lines || []).map((line: any) =>
                h('tr', { key: line.id }, [
                  h('td', line.description || '—'),
                  h('td', line.sku || '—'),
                  h('td', { class: 'text-right' }, String(line.quantity ?? '—')),
                  h('td', { class: 'text-right' }, props.money(line.unit_cost_ex_gst)),
                  h('td', { class: 'text-right' }, props.money(line.gst_amount)),
                  h('td', { class: 'text-right font-bold' }, props.money(line.line_total)),
                ])
              )
            ),
          ]),
        ]),
      ]),
    ])

    function row(label: string, value: any, strong = false) {
      return h('div', { class: strong ? 'font-black' : '' }, [h('dt', label), h('dd', value)])
    }
    function pair(label: string, value: any) {
      return h('div', { class: 'mt-2 flex justify-between gap-3 text-sm' }, [
        h('span', { class: 'text-slate-500' }, label),
        h('strong', { class: 'text-right text-slate-800' }, value),
      ])
    }
  },
})
</script>

<style scoped>
.panel{@apply rounded-2xl border border-slate-200 bg-white shadow-sm}
.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700}
.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50}
.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100}
.field{@apply grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500}
.stat{@apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow}
.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}
.stat strong{@apply mt-1 block text-xl font-black text-slate-950}
.stat small{@apply mt-1 block text-xs font-semibold text-slate-400}
.label{@apply text-[11px] font-black uppercase tracking-wide text-slate-400}
.status{@apply inline-flex rounded-full px-2.5 py-1 text-[11px] font-black}
.status.paid{@apply bg-emerald-100 text-emerald-700}
.status.part{@apply bg-amber-100 text-amber-800}
.status.overdue{@apply bg-red-100 text-red-700}
.status.draft{@apply bg-violet-100 text-violet-700}
.status.open{@apply bg-slate-100 text-slate-700}
.table-link{@apply font-black text-blue-600 hover:underline}
th{@apply border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500}
td{@apply border-b border-slate-100 px-4 py-3 align-middle text-slate-700}
.bill-details{@apply border-y border-slate-200 bg-slate-50 p-4 md:p-5}
.details-grid{@apply grid gap-5 xl:grid-cols-3}
.detail-title{@apply mb-2 font-black text-slate-950}
.detail-card{@apply rounded-xl border border-slate-200 bg-white p-3 text-sm}
.summary-list>div{@apply flex justify-between gap-4 border-b border-slate-200 py-2 text-sm}
.summary-list dt{@apply text-slate-500}
.summary-list dd{@apply font-bold text-slate-900}
.variance-box{@apply mt-3 flex justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800}
</style>
