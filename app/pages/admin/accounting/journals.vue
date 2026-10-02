<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600 hover:underline">← Accounting</NuxtLink>
        <p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">General Ledger</p>
        <h1 class="mt-1 text-3xl font-black text-slate-950">General Ledger &amp; Journals</h1>
        <p class="mt-1 max-w-3xl text-slate-500">Review posted double-entry transactions and create controlled manual journals.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/admin/accounting/accounts" class="secondary">Chart of Accounts</NuxtLink>
        <button type="button" class="primary" @click="manualOpen = true">+ Manual Journal</button>
        <button type="button" class="secondary" :disabled="loading" @click="load">{{ loading ? 'Refreshing…' : 'Refresh' }}</button>
      </div>
    </div>

    <div v-if="msg" class="mt-5 rounded-xl border px-4 py-3 text-sm font-semibold" :class="msgType==='error'?'border-red-200 bg-red-50 text-red-700':'border-emerald-200 bg-emerald-50 text-emerald-700'">{{ msg }}</div>

    <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="stat"><span>Posted Journals</span><strong>{{ journals.length }}</strong><small>Loaded transactions</small></div>
      <div class="stat"><span>Total Debits</span><strong>{{ money(totalDebits) }}</strong><small>Across loaded journals</small></div>
      <div class="stat"><span>Total Credits</span><strong>{{ money(totalCredits) }}</strong><small>Across loaded journals</small></div>
      <div class="stat"><span>Ledger Control</span><strong :class="ledgerBalanced?'!text-emerald-700':'!text-red-700'">{{ ledgerBalanced ? 'Balanced' : 'Check Required' }}</strong><small>Difference {{ money(ledgerDifference) }}</small></div>
    </section>

    <section class="panel mt-5 overflow-hidden">
      <div class="border-b border-slate-200 p-4 md:p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div><h2 class="text-xl font-black text-slate-950">Journal Register</h2><p class="mt-1 text-sm text-slate-500">{{ filtered.length }} journal{{filtered.length===1?'':'s'}} · {{ money(filteredDebits) }} debits in this view</p></div>
          <div class="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:w-auto">
            <label class="field xl:min-w-[190px]"><span>Source</span><select v-model="sourceFilter" class="input"><option value="">All Sources</option><option v-for="s in sources" :key="s" :value="s">{{s}}</option></select></label>
            <label class="field xl:min-w-[160px]"><span>From</span><input v-model="dateFrom" type="date" class="input"></label>
            <label class="field xl:min-w-[160px]"><span>To</span><input v-model="dateTo" type="date" class="input"></label>
            <label class="field xl:min-w-[320px]"><span>Search</span><input v-model="search" type="search" class="input" placeholder="Journal, reference, description, account…"></label>
          </div>
        </div>
        <div v-if="sourceFilter||dateFrom||dateTo||search" class="mt-3"><button type="button" class="text-xs font-black text-blue-600 hover:underline" @click="clearFilters">Clear filters</button></div>
      </div>

      <div v-if="loading" class="p-12 text-center text-sm font-semibold text-slate-500">Loading General Ledger…</div>
      <div v-else-if="!filtered.length" class="p-12 text-center"><div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">✓</div><h3 class="mt-3 font-black text-slate-900">No journals in this view</h3><p class="mt-1 text-sm text-slate-500">Try changing or clearing the current filters.</p></div>

      <div v-else>
        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[1150px] text-sm">
            <thead><tr><th>Journal</th><th>Date</th><th>Source</th><th>Reference</th><th>Description</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th>Status</th><th class="text-right">Action</th></tr></thead>
            <tbody>
              <tr v-for="j in filtered" :key="j.id">
                <td class="font-black text-slate-950">{{ journalNumber(j) }}</td><td>{{ date(j.journal_date) }}</td><td><span class="source-pill">{{ journalSource(j) }}</span></td>
                <td>{{ j.reference || '—' }}</td><td><div class="max-w-[320px] truncate font-semibold text-slate-800" :title="j.description">{{j.description}}</div></td>
                <td class="text-right font-bold">{{money(journalDebit(j))}}</td><td class="text-right font-bold">{{money(journalCredit(j))}}</td>
                <td><span class="status" :class="journalIsBalanced(j)?'balanced':'unbalanced'">{{journalIsBalanced(j)?'Balanced':'Out of Balance'}}</span></td>
                <td class="text-right"><button type="button" class="table-link" @click="selected=j">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="divide-y divide-slate-200 lg:hidden">
          <article v-for="j in filtered" :key="j.id" class="p-4">
            <div class="flex items-start justify-between gap-3"><div><h3 class="font-black text-slate-950">{{journalNumber(j)}}</h3><p class="mt-1 text-sm font-semibold text-slate-600">{{j.description}}</p></div><span class="source-pill">{{journalSource(j)}}</span></div>
            <div class="mt-4 grid grid-cols-3 gap-3 text-sm"><div><div class="label">Date</div><b>{{date(j.journal_date)}}</b></div><div><div class="label">Debit</div><b>{{money(journalDebit(j))}}</b></div><div><div class="label">Status</div><span class="status mt-1" :class="journalIsBalanced(j)?'balanced':'unbalanced'">{{journalIsBalanced(j)?'Balanced':'Check'}}</span></div></div>
            <div class="mt-4 flex justify-end"><button type="button" class="secondary !px-3 !py-1.5" @click="selected=j">View Journal</button></div>
          </article>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" @click.self="selected=null">
        <section class="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <div><p class="text-xs font-black uppercase tracking-[.14em] text-blue-600">{{journalSource(selected)}}</p><div class="mt-1 flex flex-wrap items-center gap-2"><h2 class="text-xl font-black text-slate-950">{{journalNumber(selected)}}</h2><span class="status" :class="journalIsBalanced(selected)?'balanced':'unbalanced'">{{journalIsBalanced(selected)?'Balanced':'Out of Balance'}}</span></div><p class="mt-1 text-sm font-semibold text-slate-500">{{selected.description}}</p></div>
            <button type="button" class="modal-close" @click="selected=null">×</button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-4">
              <div class="summary"><span>Date</span><strong>{{date(selected.journal_date)}}</strong></div>
              <div class="summary"><span>Reference</span><strong class="truncate" :title="selected.reference">{{selected.reference||'—'}}</strong></div>
              <div class="summary"><span>Total Debits</span><strong>{{money(journalDebit(selected))}}</strong></div>
              <div class="summary"><span>Total Credits</span><strong>{{money(journalCredit(selected))}}</strong></div>
            </div>
            <section class="mt-5">
              <div class="flex flex-wrap items-end justify-between gap-3"><div><h3 class="font-black text-slate-950">Double-Entry Transaction</h3><p class="mt-1 text-sm text-slate-500">Every debit and credit posted by this journal.</p></div><div class="text-sm font-bold" :class="journalIsBalanced(selected)?'text-emerald-700':'text-red-700'">Difference: {{money(Math.abs(journalDebit(selected)-journalCredit(selected)))}}</div></div>
              <div class="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table class="w-full min-w-[850px] text-sm">
                  <thead><tr><th>Account</th><th>Line Description</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead>
                  <tbody>
                    <tr v-for="l in selected.accounting_journal_lines||[]" :key="l.id">
                      <td><div class="font-black text-slate-950">{{l.accounting_accounts?.code||'—'}} — {{l.accounting_accounts?.name||'Unknown Account'}}</div></td><td>{{l.description||selected.description||'—'}}</td>
                      <td class="text-right font-black">{{Number(l.debit||0)?money(l.debit):'—'}}</td><td class="text-right font-black">{{Number(l.credit||0)?money(l.credit):'—'}}</td>
                    </tr>
                  </tbody>
                  <tfoot><tr class="bg-slate-50"><td colspan="2" class="font-black">Journal Total</td><td class="text-right font-black">{{money(journalDebit(selected))}}</td><td class="text-right font-black">{{money(journalCredit(selected))}}</td></tr></tfoot>
                </table>
              </div>
            </section>
          </div>
          <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6"><div class="text-sm text-slate-500">Status: <strong :class="journalIsBalanced(selected)?'text-emerald-700':'text-red-700'">{{journalIsBalanced(selected)?'Journal balances to $0.00':'Journal requires review'}}</strong></div><button type="button" class="secondary" @click="selected=null">Close</button></footer>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="manualOpen" class="fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" @click.self="closeManual">
        <section class="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6"><div><p class="text-xs font-black uppercase tracking-[.14em] text-violet-600">Manual Journal</p><h2 class="mt-1 text-xl font-black text-slate-950">Create Journal Entry</h2><p class="mt-1 text-sm text-slate-500">Manual entries must balance before they can be posted.</p></div><button type="button" class="modal-close" @click="closeManual">×</button></header>
          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-4 md:grid-cols-3"><label class="field"><span>Date</span><input v-model="f.journal_date" type="date" class="input"></label><label class="field"><span>Reference</span><input v-model="f.reference" class="input" placeholder="Optional reference"></label><label class="field"><span>Description</span><input v-model="f.description" class="input" placeholder="Reason for journal"></label></div>
            <div class="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white"><table class="w-full min-w-[900px] text-sm"><thead><tr><th>Account</th><th>Description</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th></th></tr></thead><tbody><tr v-for="(l,n) in f.lines" :key="n"><td><select v-model.number="l.account_id" class="input"><option :value="0">Choose account…</option><option v-for="a in accounts" :key="a.id" :value="a.id">{{a.code}} — {{a.name}}</option></select></td><td><input v-model="l.description" class="input" placeholder="Optional line detail"></td><td><input v-model.number="l.debit" type="number" min="0" step=".01" class="input text-right" @input="zeroOther(l,'debit')"></td><td><input v-model.number="l.credit" type="number" min="0" step=".01" class="input text-right" @input="zeroOther(l,'credit')"></td><td class="text-right"><button type="button" class="text-sm font-black text-red-600 hover:underline" :disabled="f.lines.length<=2" @click="f.lines.splice(n,1)">Remove</button></td></tr></tbody></table></div>
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3"><button type="button" class="secondary" @click="f.lines.push(line())">+ Add Line</button><div class="flex flex-wrap gap-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"><span>Debits {{money(debits)}}</span><span>Credits {{money(credits)}}</span><span :class="balanced?'text-emerald-700':'text-red-700'">{{balanced?'Balanced':'Difference '+money(Math.abs(debits-credits))}}</span></div></div>
            <div v-if="manualError" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{{manualError}}</div>
          </div>
          <footer class="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:px-6"><button type="button" class="secondary" :disabled="posting" @click="closeManual">Cancel</button><button type="button" class="primary" :disabled="posting||!canPost" @click="post">{{posting?'Posting…':'Post Journal'}}</button></footer>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
definePageMeta({layout:"admin",middleware:["admin"]})
const {adminFetch,isSuperAdmin}=useAdminFetch()
const accounts=ref<any[]>([]),journals=ref<any[]>([]),loading=ref(true),msg=ref(""),msgType=ref<"success"|"error">("success")
const search=ref(""),sourceFilter=ref(""),dateFrom=ref(""),dateTo=ref(""),selected=ref<any>(null),manualOpen=ref(false),manualError=ref(""),posting=ref(false)
const line=()=>({account_id:0,description:"",debit:0,credit:0})
const f=reactive<any>({journal_date:new Date().toISOString().slice(0,10),reference:"",description:"",lines:[line(),line()]})
const money=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0))
const date=(v:any)=>v?new Intl.DateTimeFormat("en-AU",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${String(v).slice(0,10)}T00:00:00`)):"—"
const journalNumber=(j:any)=>`J${String(j.journal_number??j.id??0).padStart(5,"0")}`
const journalDebit=(j:any)=>(j.accounting_journal_lines||[]).reduce((s:number,l:any)=>s+Number(l.debit||0),0)
const journalCredit=(j:any)=>(j.accounting_journal_lines||[]).reduce((s:number,l:any)=>s+Number(l.credit||0),0)
const journalIsBalanced=(j:any)=>Math.round(journalDebit(j)*100)===Math.round(journalCredit(j)*100)
function journalSource(j:any){
  const t=`${j.reference||""} ${j.description||""}`.toLowerCase()
  if(/stock|inventory adjustment|inventory count/.test(t))return"Stock Adjustment"
  if(/supplier payment|bill payment/.test(t))return"Supplier Payment"
  if(/supplier bill|purchase bill|bill /.test(t))return"Supplier Bill"
  if(/customer payment|receipt/.test(t))return"Customer Payment"
  if(/invoice|sale|order/.test(t))return"Customer Invoice"
  if(/purchase receipt|goods receipt|stock receipt/.test(t))return"Purchase Receipt"
  return"Manual / Other"
}
const sources=computed(()=>[...new Set(journals.value.map(journalSource))].sort())
const totalDebits=computed(()=>journals.value.reduce((s,j)=>s+journalDebit(j),0))
const totalCredits=computed(()=>journals.value.reduce((s,j)=>s+journalCredit(j),0))
const ledgerDifference=computed(()=>Math.abs(totalDebits.value-totalCredits.value))
const ledgerBalanced=computed(()=>Math.round(totalDebits.value*100)===Math.round(totalCredits.value*100))
const filtered=computed(()=>{const q=search.value.trim().toLowerCase();return journals.value.filter(j=>{if(sourceFilter.value&&journalSource(j)!==sourceFilter.value)return false;const d=String(j.journal_date||"").slice(0,10);if(dateFrom.value&&d<dateFrom.value)return false;if(dateTo.value&&d>dateTo.value)return false;const lines=(j.accounting_journal_lines||[]).map((l:any)=>`${l.description||""} ${l.accounting_accounts?.code||""} ${l.accounting_accounts?.name||""}`).join(" ");const h=`${journalNumber(j)} ${j.reference||""} ${j.description||""} ${lines}`.toLowerCase();return!q||h.includes(q)}).sort((a,b)=>String(b.journal_date||"").localeCompare(String(a.journal_date||""))||Number(b.id||0)-Number(a.id||0))})
const filteredDebits=computed(()=>filtered.value.reduce((s,j)=>s+journalDebit(j),0))
const debits=computed(()=>f.lines.reduce((s:number,l:any)=>s+Number(l.debit||0),0)),credits=computed(()=>f.lines.reduce((s:number,l:any)=>s+Number(l.credit||0),0))
const balanced=computed(()=>debits.value>0&&Math.round(debits.value*100)===Math.round(credits.value*100))
const canPost=computed(()=>balanced.value&&String(f.description||"").trim()&&f.lines.filter((l:any)=>l.account_id&&(Number(l.debit)>0||Number(l.credit)>0)).length>=2)
function clearFilters(){search.value="";sourceFilter.value="";dateFrom.value="";dateTo.value=""}
function resetForm(){Object.assign(f,{journal_date:new Date().toISOString().slice(0,10),reference:"",description:"",lines:[line(),line()]});manualError.value=""}
function closeManual(){if(posting.value)return;manualOpen.value=false;resetForm()}
function zeroOther(l:any,side:"debit"|"credit"){if(Number(l[side]||0)>0)l[side==="debit"?"credit":"debit"]=0}
async function load(show=true){if(show)loading.value=true;try{if(!isSuperAdmin.value)return navigateTo("/admin");[accounts.value,journals.value]=await Promise.all([adminFetch("/api/admin/accounting/accounts"),adminFetch("/api/admin/accounting/journals")])}catch(e:any){msgType.value="error";msg.value=e?.data?.statusMessage||e?.statusMessage||e?.message||"Unable to load General Ledger."}finally{loading.value=false}}
async function post(){if(!canPost.value)return;posting.value=true;manualError.value="";try{await adminFetch("/api/admin/accounting/journals",{method:"POST",body:f});manualOpen.value=false;resetForm();await load(false);msgType.value="success";msg.value="Manual journal posted successfully."}catch(e:any){manualError.value=e?.data?.statusMessage||e?.statusMessage||e?.message||"Unable to post journal."}finally{posting.value=false}}
function keydown(e:KeyboardEvent){if(e.key!=="Escape")return;if(manualOpen.value)return closeManual();if(selected.value)selected.value=null}
watch([selected,manualOpen],([a,b])=>{if(import.meta.client)document.body.style.overflow=a||b?"hidden":""})
onMounted(()=>{window.addEventListener("keydown",keydown);load()})
onBeforeUnmount(()=>{window.removeEventListener("keydown",keydown);document.body.style.overflow=""})
</script>

<style scoped>
.panel{@apply rounded-2xl border border-slate-200 bg-white shadow-sm}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50}.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50}.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.field{@apply grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500}.label{@apply text-[11px] font-black uppercase tracking-wide text-slate-400}.stat{@apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm}.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}.stat strong{@apply mt-1 block text-xl font-black text-slate-950}.stat small{@apply mt-1 block text-xs font-semibold text-slate-400}.source-pill{@apply inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700}.status{@apply inline-flex rounded-full px-2.5 py-1 text-[11px] font-black}.status.balanced{@apply bg-emerald-100 text-emerald-700}.status.unbalanced{@apply bg-red-100 text-red-700}.table-link{@apply font-black text-blue-600 hover:underline}.modal-close{@apply flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-600 hover:bg-slate-50}.summary{@apply rounded-xl border border-slate-200 bg-white p-3}.summary span{@apply block text-[11px] font-black uppercase tracking-wide text-slate-400}.summary strong{@apply mt-1 block text-base font-black text-slate-950}th{@apply border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500}td{@apply border-b border-slate-100 px-4 py-3 align-middle text-slate-700}tfoot td{@apply border-b-0}
</style>
