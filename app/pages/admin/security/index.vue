<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <AdminPageHeader eyebrow="Administration" title="Security Centre" description="Security protections and administrator activity for Kialla Computers." />

    <div v-if="errorMessage" class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{{ errorMessage }}</div>

    <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">Loading security information...</div>

    <template v-else>
      <section class="mb-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-black uppercase tracking-wider text-slate-500">Events · 24 hours</p><p class="mt-2 text-3xl font-black text-slate-900">{{ data.summary.events_24h }}</p></div>
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p class="text-xs font-black uppercase tracking-wider text-amber-700">Warnings · 7 days</p><p class="mt-2 text-3xl font-black text-amber-900">{{ data.summary.warnings_7d }}</p></div>
        <div class="rounded-2xl border border-red-200 bg-red-50 p-5"><p class="text-xs font-black uppercase tracking-wider text-red-700">Failed / denied · 7 days</p><p class="mt-2 text-3xl font-black text-red-900">{{ data.summary.failures_7d }}</p></div>
      </section>

      <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4"><h2 class="text-xl font-black text-slate-900">Active protections</h2><p class="mt-1 text-sm text-slate-500">Server-side controls currently built into the shop.</p></div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="item in data.protections" :key="item.key" class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-black text-white">✓</span>
            <span class="font-bold text-emerald-900">{{ item.label }}</span>
          </div>
        </div>
      </section>

      <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4"><h2 class="text-xl font-black text-slate-900">Production configuration</h2><p class="mt-1 text-sm text-slate-500">Checks whether required integrations are configured. Secret values are never returned to the browser.</p></div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="item in data.configuration?.checks || []" :key="item.key" class="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" :class="item.configured ? 'border-emerald-200 bg-emerald-50' : item.required ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'">
            <div><p class="font-bold text-slate-900">{{ item.label }}</p><p class="text-xs text-slate-500">{{ item.required ? 'Required' : 'Optional' }}</p></div>
            <span class="rounded-full px-2.5 py-1 text-xs font-black" :class="item.configured ? 'bg-emerald-600 text-white' : item.required ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'">{{ item.configured ? 'Configured' : 'Missing' }}</span>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 class="text-xl font-black text-slate-900">Security audit log</h2><p class="text-sm text-slate-500">Administrator changes are logged without request bodies, passwords, tokens or payment details.</p></div>
          <button class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700" @click="load">Refresh</button>
        </div>
        <div class="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <select v-model="severity" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" @change="loadAudit"><option value="">All severities</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
          <select v-model="outcome" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" @change="loadAudit"><option value="">All outcomes</option><option value="success">Success</option><option value="denied">Denied</option><option value="failure">Failure</option></select>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-[900px] w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">Actor</th><th class="px-4 py-3">Action</th><th class="px-4 py-3">Resource</th><th class="px-4 py-3">Severity</th><th class="px-4 py-3">Outcome</th></tr></thead>
            <tbody>
              <tr v-for="row in audit.rows" :key="row.id" class="border-t border-slate-100"><td class="whitespace-nowrap px-4 py-3 text-slate-600">{{ formatDate(row.created_at) }}</td><td class="px-4 py-3 font-semibold text-slate-800">{{ actorLabel(row) }}</td><td class="px-4 py-3 font-mono text-xs text-slate-700">{{ row.action }}</td><td class="max-w-[330px] truncate px-4 py-3 text-slate-600">{{ row.resource }}</td><td class="px-4 py-3"><span :class="badge(row.severity)">{{ row.severity }}</span></td><td class="px-4 py-3 capitalize text-slate-700">{{ row.outcome }}</td></tr>
              <tr v-if="!audit.rows.length"><td colspan="6" class="px-4 py-10 text-center text-slate-500">No security events recorded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })
const { adminFetch } = useAdminFetch()
const loading = ref(true)
const errorMessage = ref('')
const severity = ref('')
const outcome = ref('')
const data = ref<any>({ summary: { events_24h: 0, warnings_7d: 0, failures_7d: 0 }, protections: [], configuration: { checks: [] }, recent: [] })
const audit = ref<any>({ rows: [], count: 0 })

const loadAudit = async () => {
  const params = new URLSearchParams({ pageSize: '50' })
  if (severity.value) params.set('severity', severity.value)
  if (outcome.value) params.set('outcome', outcome.value)
  audit.value = await adminFetch(`/api/admin/security/audit?${params.toString()}`)
}
const load = async () => {
  loading.value = true; errorMessage.value = ''
  try { data.value = await adminFetch('/api/admin/security'); await loadAudit() }
  catch (error: any) { errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to load Security Centre.' }
  finally { loading.value = false }
}
const formatDate = (value: string) => new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const actorLabel = (row: any) => {
  if (row?.actor_email) return row.actor_email
  if (String(row?.action || '').startsWith('auth.')) return 'Customer / User'
  return 'Administrator'
}
const badge = (value: string) => value === 'critical' ? 'rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700' : value === 'warning' ? 'rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700' : 'rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700'
onMounted(load)
</script>
