<template>
  <main class="admin-content">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><p class="text-xs font-black uppercase tracking-wider text-blue-600">SuperAdmin · Accounting</p><h1 class="text-3xl font-black">🛡️ Accounting Health & Audit</h1><p class="text-slate-500">Integrity checks and an audit trail across the accounting system.</p></div>
      <button class="btn" :disabled="loading" @click="load">{{ loading ? 'Checking…' : 'Run Health Check' }}</button>
    </div>

    <div v-if="err" class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{{ err }}</div>
    <div v-if="auditNotInstalled" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Run <b>sql/20260918_accounting_health_audit.sql</b> to enable the permanent audit history. Health checks work independently.</div>

    <section class="grid gap-4 md:grid-cols-4">
      <div class="panel p-5"><small>Overall Health</small><div class="mt-2 text-2xl font-black" :class="healthClass">{{ healthLabel }}</div></div>
      <div class="panel p-5"><small>Checks Run</small><div class="text-3xl font-black">{{ health?.checks_run || 0 }}</div></div>
      <div class="panel p-5"><small>Action Required</small><div class="text-3xl font-black text-red-600">{{ health?.errors || 0 }}</div></div>
      <div class="panel p-5"><small>Warnings</small><div class="text-3xl font-black text-amber-600">{{ health?.warnings || 0 }}</div></div>
    </section>

    <section class="panel mt-5 p-5">
      <div class="flex items-center justify-between"><div><h2 class="text-xl font-black">Integrity Checks</h2><p class="text-sm text-slate-500">Problems are never silently repaired.</p></div><span class="text-xs text-slate-400">{{ checkedAt }}</span></div>
      <div v-if="!health?.issues?.length" class="mt-5 rounded-xl bg-emerald-50 p-5 font-bold text-emerald-700">✓ No accounting integrity problems were found by the current checks.</div>
      <div v-else class="mt-4 space-y-3">
        <div v-for="x in health.issues" :key="x.key" class="flex flex-wrap items-center gap-4 rounded-xl border p-4" :class="x.severity==='error'?'border-red-200 bg-red-50':'border-amber-200 bg-amber-50'">
          <div class="text-2xl">{{ x.severity==='error'?'⛔':'⚠️' }}</div><div class="min-w-0 flex-1"><div class="font-black">{{ x.title }}</div><div class="text-sm text-slate-600">{{ x.detail }}</div></div>
          <div class="text-right"><div class="text-2xl font-black">{{ x.count }}</div><div v-if="x.amount" class="text-xs text-slate-500">{{ money(x.amount) }}</div></div>
          <NuxtLink v-if="x.route" class="btn-secondary" :to="x.route">Review</NuxtLink>
        </div>
      </div>
    </section>

    <section class="panel mt-5 p-5">
      <div><h2 class="text-xl font-black">Accounting Audit Log</h2><p class="text-sm text-slate-500">Database-level history for important accounting records.</p></div>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-sm"><thead><tr class="border-b text-left"><th class="p-2">Date</th><th>Area</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
          <tbody><tr v-for="r in logs" :key="r.id" class="border-b align-top"><td class="p-2 whitespace-nowrap">{{ dateTime(r.created_at) }}</td><td>{{ pretty(r.table_name) }}</td><td><span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">{{ r.action }}</span></td><td class="font-mono text-xs">{{ r.record_id || '—' }}</td><td class="max-w-xl text-xs text-slate-500">{{ summary(r) }}</td></tr><tr v-if="!logs.length"><td colspan="5" class="p-6 text-center text-slate-400">No audit events recorded yet.</td></tr></tbody>
        </table>
      </div>
    </section>
  </main>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']});
const {adminFetch,isSuperAdmin}=useAdminFetch(); const health=ref<any>(null),logs=ref<any[]>([]),loading=ref(false),err=ref(''),auditNotInstalled=ref(false);
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0));
const healthLabel=computed(()=>health.value?.status==='healthy'?'Healthy':health.value?.status==='warning'?'Warning':'Action Required');
const healthClass=computed(()=>health.value?.status==='healthy'?'text-emerald-600':health.value?.status==='warning'?'text-amber-600':'text-red-600');
const checkedAt=computed(()=>health.value?.checked_at?`Checked ${new Date(health.value.checked_at).toLocaleString('en-AU')}`:'');
const dateTime=(v:any)=>v?new Date(v).toLocaleString('en-AU'):'—'; const pretty=(v:any)=>String(v||'').replace(/^accounting_/,'').replaceAll('_',' ');
function summary(r:any){ if(r.note)return r.note; const d=r.new_data||r.old_data||{}; return [d.reference,d.description,d.status,d.name].filter(Boolean).join(' · ')||'Record changed'; }
async function load(){loading.value=true;err.value='';try{if(!isSuperAdmin.value)return navigateTo('/admin');const [h,l]=await Promise.all([adminFetch('/api/admin/accounting/audit/health'),adminFetch('/api/admin/accounting/audit/log')]);health.value=h;logs.value=l.items||[];auditNotInstalled.value=!!l.not_installed;}catch(e:any){err.value=e?.data?.statusMessage||e.message||'Unable to run accounting health check.';}finally{loading.value=false;}}
onMounted(load);
</script>
<style scoped>.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.btn{@apply rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-50}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black hover:bg-slate-50}</style>
