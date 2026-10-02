<template>
  <main class="admin-core-page mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <AdminPurchasingWorkflow />

    <div class="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink to="/admin/purchasing" class="text-sm font-bold text-blue-600 hover:underline">
          ← Purchasing
        </NuxtLink>
        <p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">
          Purchasing
        </p>
        <h1 class="mt-1 text-3xl font-black text-slate-950">Suppliers</h1>
        <p class="mt-1 max-w-3xl text-slate-500">
          Manage the businesses you purchase from. Product-to-supplier assignments are maintained from the Product editor.
        </p>
      </div>

      <button class="primary" type="button" @click="openNew">
        + Add Supplier
      </button>
    </div>

    <div
      v-if="msg"
      class="mt-5 rounded-xl border px-4 py-3 text-sm font-semibold"
      :class="msgType === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
    >
      {{ msg }}
    </div>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-4 md:p-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-xl font-black text-slate-950">Supplier Directory</h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ filteredSuppliers.length }} supplier{{ filteredSuppliers.length === 1 ? '' : 's' }}
              <template v-if="search.trim()"> matching your search</template>
            </p>
          </div>

          <div class="w-full md:max-w-md">
            <label class="sr-only" for="supplier-search">Search suppliers</label>
            <div class="relative">
              <svg
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id="supplier-search"
                v-model="search"
                class="input pl-9"
                type="search"
                placeholder="Search name, contact, email, phone or ABN…"
              >
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="p-10 text-center text-sm font-semibold text-slate-500">
        Loading suppliers…
      </div>

      <div v-else-if="!filteredSuppliers.length" class="p-10 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h6M9 13h6M9 17h6" />
          </svg>
        </div>
        <h3 class="mt-3 font-black text-slate-900">
          {{ search.trim() ? 'No suppliers found' : 'No suppliers yet' }}
        </h3>
        <p class="mt-1 text-sm text-slate-500">
          {{ search.trim() ? 'Try a different search.' : 'Add your first supplier to begin purchasing.' }}
        </p>
        <button v-if="!search.trim()" class="primary mt-4" type="button" @click="openNew">
          + Add Supplier
        </button>
      </div>

      <div v-else>
        <!-- Desktop -->
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[900px] text-sm">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>ABN</th>
                <th class="w-[180px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="supplier in filteredSuppliers" :key="supplier.id">
                <td>
                  <NuxtLink
                    :to="`/admin/purchasing/suppliers/${supplier.id}`"
                    class="font-black text-slate-950 hover:text-blue-700 hover:underline"
                  >
                    {{ supplier.name }}
                  </NuxtLink>
                  <div v-if="supplier.address" class="mt-1 max-w-[320px] truncate text-xs text-slate-400">
                    {{ oneLine(supplier.address) }}
                  </div>
                </td>
                <td>{{ supplier.contact_name || '—' }}</td>
                <td>
                  <a
                    v-if="supplier.email"
                    :href="`mailto:${supplier.email}`"
                    class="font-semibold text-blue-600 hover:underline"
                  >
                    {{ supplier.email }}
                  </a>
                  <span v-else>—</span>
                </td>
                <td>{{ supplier.phone || '—' }}</td>
                <td>{{ supplier.abn || '—' }}</td>
                <td class="text-right">
                  <NuxtLink
                    :to="`/admin/purchasing/suppliers/${supplier.id}`"
                    class="table-link"
                  >
                    View
                  </NuxtLink>
                  <button class="table-link" type="button" @click="openEdit(supplier)">
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile -->
        <div class="divide-y divide-slate-200 md:hidden">
          <article v-for="supplier in filteredSuppliers" :key="supplier.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <NuxtLink
                  :to="`/admin/purchasing/suppliers/${supplier.id}`"
                  class="block truncate text-base font-black text-slate-950 hover:text-blue-700"
                >
                  {{ supplier.name }}
                </NuxtLink>
                <p class="mt-1 text-sm font-semibold text-slate-600">
                  {{ supplier.contact_name || 'No contact name' }}
                </p>
              </div>
              <button class="secondary !px-3 !py-1.5" type="button" @click="openEdit(supplier)">
                Edit
              </button>
            </div>

            <div class="mt-3 space-y-1 text-sm text-slate-500">
              <a v-if="supplier.email" :href="`mailto:${supplier.email}`" class="block truncate text-blue-600">
                {{ supplier.email }}
              </a>
              <div v-if="supplier.phone">{{ supplier.phone }}</div>
              <div v-if="supplier.abn">ABN {{ supplier.abn }}</div>
            </div>

            <NuxtLink
              :to="`/admin/purchasing/suppliers/${supplier.id}`"
              class="mt-4 inline-flex text-sm font-black text-blue-600"
            >
              View supplier →
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <p class="mt-4 text-xs font-semibold text-slate-400">
      Supplier products are intentionally not managed here. Open a product under Inventory → Products to set its primary and additional suppliers.
    </p>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <section class="modal-card" role="dialog" aria-modal="true" :aria-labelledby="editingId ? 'edit-supplier-title' : 'add-supplier-title'">
        <div class="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 :id="editingId ? 'edit-supplier-title' : 'add-supplier-title'" class="text-xl font-black text-slate-950">
              {{ editingId ? 'Edit Supplier' : 'Add Supplier' }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ editingId ? 'Update the supplier’s contact and business details.' : 'Create a supplier for purchasing and Accounts Payable.' }}
            </p>
          </div>
          <button class="close-btn" type="button" aria-label="Close" @click="closeModal">×</button>
        </div>

        <form class="grid gap-4 p-5 sm:grid-cols-2" @submit.prevent="save">
          <label class="field sm:col-span-2">
            <span>Supplier name *</span>
            <input v-model="form.name" class="input" autocomplete="organization" autofocus>
          </label>

          <label class="field">
            <span>Contact name</span>
            <input v-model="form.contact_name" class="input" autocomplete="name">
          </label>

          <label class="field">
            <span>ABN</span>
            <input v-model="form.abn" class="input" inputmode="numeric">
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model="form.email" type="email" class="input" autocomplete="email">
          </label>

          <label class="field">
            <span>Phone</span>
            <input v-model="form.phone" class="input" autocomplete="tel">
          </label>

          <label class="field sm:col-span-2">
            <span>Address</span>
            <textarea v-model="form.address" rows="3" class="input resize-y"></textarea>
          </label>

          <label class="field sm:col-span-2">
            <span>Notes</span>
            <textarea v-model="form.notes" rows="4" class="input resize-y"></textarea>
          </label>

          <div
            v-if="modalError"
            class="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {{ modalError }}
          </div>

          <div class="sm:col-span-2 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button class="secondary" type="button" :disabled="saving" @click="closeModal">
              Cancel
            </button>
            <button class="primary" type="submit" :disabled="saving">
              {{ saving ? 'Saving…' : editingId ? 'Save Supplier' : 'Add Supplier' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { adminFetch } = useAdminFetch()

const suppliers = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const msg = ref('')
const msgType = ref<'success' | 'error'>('success')
const showModal = ref(false)
const editingId = ref<number | null>(null)
const modalError = ref('')

const emptyForm = () => ({
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  abn: '',
  address: '',
  notes: '',
})

const form = reactive<any>(emptyForm())

const filteredSuppliers = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return suppliers.value

  return suppliers.value.filter((supplier: any) =>
    [
      supplier.name,
      supplier.contact_name,
      supplier.email,
      supplier.phone,
      supplier.abn,
      supplier.address,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)),
  )
})

function oneLine(value: any) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function resetForm() {
  Object.assign(form, emptyForm())
  modalError.value = ''
}

function openNew() {
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEdit(supplier: any) {
  editingId.value = Number(supplier.id)
  Object.assign(form, {
    name: supplier.name || '',
    contact_name: supplier.contact_name || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    abn: supplier.abn || '',
    address: supplier.address || '',
    notes: supplier.notes || '',
  })
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  if (saving.value) return
  showModal.value = false
  editingId.value = null
  resetForm()
}

async function load() {
  loading.value = true
  try {
    suppliers.value = (await adminFetch('/api/admin/accounting/suppliers')) || []
  } catch (error: any) {
    msgType.value = 'error'
    msg.value = error?.data?.statusMessage || error?.message || 'Unable to load suppliers.'
  } finally {
    loading.value = false
  }
}

async function save() {
  modalError.value = ''

  if (!String(form.name || '').trim()) {
    modalError.value = 'Supplier name is required.'
    return
  }

  saving.value = true
  try {
    const body = {
      name: String(form.name || '').trim(),
      contact_name: String(form.contact_name || '').trim() || null,
      email: String(form.email || '').trim() || null,
      phone: String(form.phone || '').trim() || null,
      abn: String(form.abn || '').trim() || null,
      address: String(form.address || '').trim() || null,
      notes: String(form.notes || '').trim() || null,
    }

    if (editingId.value) {
      await adminFetch(`/api/admin/accounting/suppliers/${editingId.value}`, {
        method: 'PUT',
        body,
      })
      msg.value = 'Supplier updated.'
    } else {
      await adminFetch('/api/admin/accounting/suppliers', {
        method: 'POST',
        body,
      })
      msg.value = 'Supplier added.'
    }

    msgType.value = 'success'
    showModal.value = false
    editingId.value = null
    resetForm()
    await load()
  } catch (error: any) {
    modalError.value =
      error?.data?.statusMessage ||
      error?.message ||
      `Unable to ${editingId.value ? 'update' : 'add'} supplier.`
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.panel {
  @apply rounded-2xl border border-slate-200 bg-white shadow-sm;
}

.primary {
  @apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50;
}

.secondary {
  @apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50;
}

.input {
  @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100;
}

.field {
  @apply grid gap-1.5 text-sm font-bold text-slate-700;
}

th {
  @apply border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500;
}

td {
  @apply border-b border-slate-100 px-4 py-3 align-middle text-slate-700;
}

tbody tr:last-child td {
  @apply border-b-0;
}

tbody tr:hover {
  @apply bg-slate-50/70;
}

.table-link {
  @apply ml-4 font-black text-blue-600 hover:underline;
}

.modal-backdrop {
  @apply fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4;
}

.modal-card {
  @apply max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl;
}

.close-btn {
  @apply flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-xl font-bold text-slate-600 transition hover:bg-slate-50;
}
</style>
