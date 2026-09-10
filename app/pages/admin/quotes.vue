<template>
  <main class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <NuxtLink to="/admin" class="text-sm font-bold text-blue-600 hover:text-blue-700">← Admin Dashboard</NuxtLink>
        <p class="mt-4 text-sm font-semibold uppercase tracking-wider text-blue-600">Administration</p>
        <h1 class="mt-1 text-3xl font-black text-slate-900">Quote Management</h1>
        <p class="mt-2 text-slate-500">Review, price, expire, resend and download all customer quotes.</p>
      </div>
      <button class="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700" :disabled="loading" @click="loadQuotes">Refresh</button>
    </div>

    <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{{ errorMessage }}</div>
    <div v-if="successMessage" class="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{{ successMessage }}</div>

    <section class="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_220px_auto]">
      <input v-model="search" class="input" placeholder="Search quote number, customer or email" @keyup.enter="loadQuotes" />
      <select v-model="statusFilter" class="input" @change="loadQuotes">
        <option value="all">All statuses</option>
        <option value="requested">Requested</option><option value="reviewing">Reviewing</option><option value="quoted">Quoted</option>
        <option value="accepted">Accepted</option><option value="declined">Declined</option><option value="closed">Closed</option>
      </select>
      <button class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700" @click="loadQuotes">Search</button>
    </section>

    <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading quotes…</div>
    <div v-else-if="!quotes.length" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No quotes found.</div>

    <div v-else class="space-y-5">
      <article v-for="quote in quotes" :key="quote.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-lg font-black text-slate-900">{{ quote.quote_number || `Quote #${quote.id}` }}</h2>
              <span class="rounded-full px-2.5 py-1 text-xs font-bold capitalize" :class="statusClass(quote)">{{ displayStatus(quote) }}</span>
            </div>
            <p class="mt-1 font-semibold text-slate-700">{{ quote.customer_name || quote.customer_email || 'Customer' }}</p>
            <p class="text-sm text-slate-500">{{ quote.customer_email }}</p>
            <p class="mt-1 text-xs text-slate-400">Requested {{ formatDateTime(quote.created_at) }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <NuxtLink :to="`/admin/accounts/${quote.user_id}`" class="btn-secondary">Customer Profile</NuxtLink>
            <a :href="`/api/admin/quotes/${quote.id}.pdf`" class="btn-secondary">Download PDF</a>
            <button v-if="quote.status === 'quoted'" class="btn-secondary" :disabled="busyId === quote.id" @click="resendQuote(quote)">Resend Quote</button>
          </div>
        </div>

        <div v-if="quote.customer_message" class="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><strong>Customer request:</strong> {{ quote.customer_message }}</div>

        <div class="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th class="p-3">Product</th><th class="p-3 text-center">Qty</th><th class="p-3 text-right">Requested</th><th class="p-3 text-right">Quoted Unit</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in quote.customer_quote_request_items || []" :key="item.id">
                <td class="p-3"><strong>{{ item.product_name }}</strong><span v-if="item.variant_name" class="block text-xs text-slate-500">{{ item.variant_name }}</span></td>
                <td class="p-3 text-center">{{ item.quantity }}</td>
                <td class="p-3 text-right">{{ currency(item.requested_price) }}</td>
                <td class="p-3"><input v-model="item.quoted_price" type="number" min="0" step="0.01" class="input ml-auto max-w-36 text-right" :placeholder="Number(item.requested_price || 0).toFixed(2)" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label><span class="field-label">Status</span><select v-model="quote.status" class="input"><option value="requested">Requested</option><option value="reviewing">Reviewing</option><option value="quoted">Quoted</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="closed">Closed</option></select></label>
          <label><span class="field-label">Quoted Total</span><input v-model="quote.quoted_total" type="number" min="0" step="0.01" class="input" /></label>
          <label><span class="field-label">Valid Until</span><input v-model="quote.expires_local" type="date" class="input" /></label>
          <div><span class="field-label">Last Sent</span><p class="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{{ quote.sent_at ? formatDateTime(quote.sent_at) : 'Not sent' }}</p></div>
        </div>
        <label class="mt-4 block"><span class="field-label">Private Admin Notes</span><textarea v-model="quote.admin_notes" rows="3" class="input"></textarea></label>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-slate-500"><span v-if="quote.quoted_at">Quoted {{ formatDateTime(quote.quoted_at) }} · </span>{{ quote.customer_quote_request_items?.length || 0 }} item(s)</p>
          <button class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60" :disabled="busyId === quote.id" @click="saveQuote(quote)">{{ busyId === quote.id ? 'Saving…' : 'Save Quote' }}</button>
        </div>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["admin", "superadmin"] });
const { adminFetch } = useAdminFetch();
const quotes = ref<any[]>([]); const loading = ref(true); const busyId = ref<number|null>(null);
const search = ref(""); const statusFilter = ref("all"); const errorMessage = ref(""); const successMessage = ref("");
const currency = (v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
const formatDateTime=(v:any)=>v?new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"";
const isExpired=(q:any)=>q.status === 'quoted' && q.expires_at && new Date(q.expires_at).getTime() < Date.now();
const displayStatus=(q:any)=>isExpired(q)?'Expired':q.status;
const statusClass=(q:any)=> isExpired(q)?'bg-amber-100 text-amber-800':q.status==='accepted'?'bg-emerald-100 text-emerald-700':q.status==='quoted'?'bg-blue-100 text-blue-700':q.status==='declined'||q.status==='closed'?'bg-slate-200 text-slate-700':'bg-violet-100 text-violet-700';
const toDateInput=(v:any)=>{ if(!v) return ''; const d=new Date(v); return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10); };
const toIsoEndOfDay=(v:string)=>v?new Date(`${v}T23:59:59+10:00`).toISOString():null;
async function loadQuotes(){ loading.value=true; errorMessage.value=''; try{ const q=new URLSearchParams(); if(search.value.trim())q.set('search',search.value.trim()); if(statusFilter.value!=='all')q.set('status',statusFilter.value); const data=await adminFetch<any[]>(`/api/admin/quotes?${q}`); quotes.value=(data||[]).map(x=>({...x,expires_local:toDateInput(x.expires_at)})); }catch(e:any){errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to load quotes.'}finally{loading.value=false;} }
async function saveQuote(q:any){ busyId.value=q.id; errorMessage.value=''; successMessage.value=''; try{ const saved=await adminFetch<any>(`/api/admin/accounts/${q.user_id}/quotes/${q.id}`,{method:'PUT',body:{status:q.status,quoted_total:q.quoted_total,admin_notes:q.admin_notes,expires_at:toIsoEndOfDay(q.expires_local),items:q.customer_quote_request_items||[]}}); Object.assign(q,saved,{expires_local:toDateInput(saved.expires_at)}); successMessage.value=`${q.quote_number || `Quote #${q.id}`} updated.`; }catch(e:any){errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to save quote.'}finally{busyId.value=null;} }
async function resendQuote(q:any){ busyId.value=q.id; errorMessage.value=''; successMessage.value=''; try{ const r=await adminFetch<any>(`/api/admin/accounts/${q.user_id}/quotes/${q.id}/resend`,{method:'POST'}); q.sent_at=r.sent_at; successMessage.value=`${q.quote_number || `Quote #${q.id}`} emailed again.`; }catch(e:any){errorMessage.value=e?.data?.statusMessage||e?.message||'Unable to resend quote.'}finally{busyId.value=null;} }
onMounted(loadQuotes);
</script>

<style scoped>
.input { @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100; }
.field-label { @apply mb-1.5 block text-sm font-bold text-slate-700; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50; }
</style>
