<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 md:px-7 md:py-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600 hover:underline">← Accounting</NuxtLink>
        <p class="mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-600">Banking</p>
        <h1 class="mt-1 text-3xl font-black text-slate-950">Bank Reconciliation</h1>
        <p class="mt-1 max-w-3xl text-slate-500">Import bank transactions, match them to accounting payments and reconcile completed statements.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="secondary" @click="showBank=true">+ Bank Account</button>
        <button v-if="bankId" type="button" class="primary" @click="fileInput?.click()">Import Bank CSV</button>
        <input ref="fileInput" class="hidden" type="file" accept=".csv,text/csv" @change="importCsv">
        <button type="button" class="secondary" :disabled="loading" @click="loadTransactions">{{loading?'Refreshing…':'Refresh'}}</button>
      </div>
    </div>

    <div v-if="err" class="mt-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><span>{{err}}</span><button class="font-black" @click="err=''">×</button></div>
    <div v-if="notice" class="mt-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><span>{{notice}}</span><button class="font-black" @click="notice=''">×</button></div>

    <section class="panel mt-5 p-4 md:p-5">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label class="field w-full lg:max-w-xl"><span>Bank Account</span><select v-model.number="bankId" class="input" @change="loadTransactions"><option :value="0">Select a bank account…</option><option v-for="b in banks" :key="b.id" :value="b.id">{{b.name}}<template v-if="b.bsb"> · {{b.bsb}}</template><template v-if="b.account_number"> · {{b.account_number}}</template></option></select></label>
        <div v-if="selectedBank" class="text-sm text-slate-500">Ledger account: <strong class="text-slate-800">{{selectedBank.accounting_accounts?.code}} · {{selectedBank.accounting_accounts?.name}}</strong></div>
      </div>
    </section>

    <template v-if="bankId">
      <section class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button class="stat text-left" type="button" @click="statusFilter='all'"><span>Imported Balance</span><strong>{{money(importedBalance)}}</strong><small>Opening balance + imported activity</small></button>
        <button class="stat text-left" type="button" @click="statusFilter='unmatched'"><span>Unmatched</span><strong :class="unmatched.length?'!text-amber-700':''">{{money(unmatchedAbsolute)}}</strong><small>{{unmatched.length}} transaction{{unmatched.length===1?'':'s'}} requiring attention</small></button>
        <button class="stat text-left" type="button" @click="statusFilter='matched'"><span>Matched</span><strong>{{matched.length}}</strong><small>{{money(matchedAbsolute)}} linked to accounting</small></button>
        <button class="stat text-left" type="button" @click="statusFilter='reconciled'"><span>Reconciled</span><strong>{{reconciled.length}}</strong><small>{{money(reconciledAbsolute)}} completed</small></button>
        <div class="stat"><span>Reconciliation Status</span><strong :class="unmatched.length?'!text-amber-700':'!text-emerald-700'">{{unmatched.length?'Action Required':'Ready'}}</strong><small>{{unmatched.length?`${unmatched.length} unmatched transaction${unmatched.length===1?'':'s'}`:'All imported transactions matched'}}</small></div>
      </section>

      <section class="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div class="panel overflow-hidden">
          <div class="border-b border-slate-200 p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><h2 class="text-xl font-black text-slate-950">Bank Statement</h2><p class="mt-1 text-sm text-slate-500">Imported deposits are positive and withdrawals are negative.</p></div>
              <div class="grid gap-2 sm:grid-cols-2">
                <label class="field"><span>Status</span><select v-model="statusFilter" class="input"><option value="all">All Transactions</option><option value="unmatched">Unmatched</option><option value="matched">Matched</option><option value="reconciled">Reconciled</option></select></label>
                <label class="field sm:min-w-[260px]"><span>Search</span><input v-model="search" class="input" type="search" placeholder="Description or reference…"></label>
              </div>
            </div>
          </div>

          <div v-if="loading" class="p-12 text-center text-sm font-semibold text-slate-500">Loading bank transactions…</div>
          <div v-else-if="!filtered.length" class="p-12 text-center"><div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">✓</div><h3 class="mt-3 font-black text-slate-900">No transactions in this view</h3><p class="mt-1 text-sm text-slate-500">{{tx.length?'Try changing the filters.':'Import a bank CSV to begin reconciliation.'}}</p></div>
          <div v-else class="max-h-[650px] overflow-auto">
            <table class="w-full min-w-[850px] text-sm">
              <thead class="sticky top-0 z-10"><tr><th>Date</th><th>Description</th><th>Reference</th><th class="text-right">Amount</th><th>Status</th><th class="text-right">Action</th></tr></thead>
              <tbody><tr v-for="t in filtered" :key="t.id"><td class="whitespace-nowrap">{{date(t.transaction_date)}}</td><td><div class="max-w-[330px] truncate font-semibold text-slate-900" :title="t.description">{{t.description||'—'}}</div></td><td>{{t.reference||'—'}}</td><td class="text-right font-black" :class="Number(t.amount)>0?'text-emerald-700':'text-red-700'">{{money(t.amount)}}</td><td><span class="status" :class="'s-'+t.status">{{statusName(t.status)}}</span></td><td class="text-right"><button type="button" class="table-link" @click="openTransaction(t)">{{t.status==='unmatched'?'Match':'View'}}</button></td></tr></tbody>
            </table>
          </div>
        </div>

        <div class="space-y-5">
          <section class="panel p-5">
            <h2 class="text-xl font-black text-slate-950">Reconcile Statement</h2>
            <p class="mt-1 text-sm text-slate-500">Transactions up to the statement date must be matched and the calculated balance must equal the statement closing balance.</p>
            <div class="mt-4 grid gap-3">
              <label class="field"><span>Statement Date</span><input v-model="statement.date" type="date" class="input"></label>
              <label class="field"><span>Statement Closing Balance</span><input v-model.number="statement.balance" type="number" step="0.01" class="input"></label>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex justify-between gap-3 text-sm"><span class="font-bold text-slate-500">Calculated imported balance</span><strong>{{money(calculatedToStatementDate)}}</strong></div>
                <div class="mt-2 flex justify-between gap-3 text-sm"><span class="font-bold text-slate-500">Difference</span><strong :class="Math.abs(statementDifference)<=.01?'text-emerald-700':'text-red-700'">{{money(statementDifference)}}</strong></div>
                <div class="mt-2 flex justify-between gap-3 text-sm"><span class="font-bold text-slate-500">Unmatched to date</span><strong :class="unmatchedToStatementDate?'text-amber-700':'text-emerald-700'">{{unmatchedToStatementDate}}</strong></div>
              </div>
              <button type="button" class="primary w-full" :disabled="reconciling" @click="reconcile">{{reconciling?'Reconciling…':'Reconcile Statement'}}</button>
            </div>
          </section>

          <section class="panel overflow-hidden">
            <div class="border-b border-slate-200 p-5"><h2 class="text-lg font-black text-slate-950">Reconciliation History</h2><p class="mt-1 text-sm text-slate-500">Previously completed statements.</p></div>
            <div v-if="history.length" class="max-h-[310px] divide-y divide-slate-100 overflow-y-auto"><button v-for="h in history" :key="h.id" type="button" class="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50" @click="historySelected=h"><div><div class="font-black text-slate-900">{{date(h.statement_date)}}</div><div class="mt-0.5 text-xs text-slate-400">Calculated {{money(h.calculated_balance)}}</div></div><div class="text-right"><strong>{{money(h.statement_balance)}}</strong><div class="mt-0.5 text-xs font-bold" :class="Math.abs(Number(h.difference||0))<=.01?'text-emerald-700':'text-red-700'">Difference {{money(h.difference)}}</div></div></button></div>
            <div v-else class="p-8 text-center text-sm text-slate-500">No completed reconciliations yet.</div>
          </section>
        </div>
      </section>
    </template>

    <section v-else class="panel mt-5 p-12 text-center"><div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">🏦</div><h2 class="mt-4 text-xl font-black text-slate-950">Choose a bank account</h2><p class="mt-1 text-sm text-slate-500">Select an existing account above, or add your business bank account to begin.</p></section>

    <!-- Bank account popup -->
    <Teleport to="body"><div v-if="showBank" class="modal" @click.self="showBank=false"><section class="modal-card max-w-xl"><header class="modal-head"><div><p class="eyebrow">Banking</p><h2 class="modal-title">Add Bank Account</h2></div><button class="modal-close" @click="showBank=false">×</button></header><div class="modal-body"><label class="field"><span>Name</span><input v-model="bank.name" class="input" placeholder="Business Transaction Account"></label><div class="mt-4 grid grid-cols-2 gap-3"><label class="field"><span>BSB</span><input v-model="bank.bsb" class="input"></label><label class="field"><span>Account Number</span><input v-model="bank.account_number" class="input"></label></div><label class="field mt-4"><span>Ledger Bank Account</span><select v-model.number="bank.accounting_account_id" class="input"><option :value="0">Select account…</option><option v-for="a in ledgerBanks" :key="a.id" :value="a.id">{{a.code}} · {{a.name}}</option></select></label><label class="field mt-4"><span>Opening Balance</span><input v-model.number="bank.opening_balance" type="number" step="0.01" class="input"></label><div v-if="bankError" class="error-box mt-4">{{bankError}}</div></div><footer class="modal-foot"><button class="secondary" @click="showBank=false">Cancel</button><button class="primary" :disabled="bankSaving" @click="saveBank">{{bankSaving?'Saving…':'Save Bank Account'}}</button></footer></section></div></Teleport>

    <!-- Transaction / matching popup -->
    <Teleport to="body"><div v-if="matchTx" class="modal" @click.self="closeMatch"><section class="modal-card max-w-4xl">
      <header class="modal-head"><div><p class="eyebrow">Bank Transaction</p><div class="mt-1 flex flex-wrap items-center gap-2"><h2 class="modal-title">{{matchTx.description||'Bank Transaction'}}</h2><span class="status" :class="'s-'+matchTx.status">{{statusName(matchTx.status)}}</span></div></div><button class="modal-close" @click="closeMatch">×</button></header>
      <div class="modal-body">
        <div class="grid gap-3 sm:grid-cols-4"><div class="summary"><span>Date</span><strong>{{date(matchTx.transaction_date)}}</strong></div><div class="summary"><span>Amount</span><strong :class="Number(matchTx.amount)>0?'!text-emerald-700':'!text-red-700'">{{money(matchTx.amount)}}</strong></div><div class="summary"><span>Reference</span><strong class="truncate">{{matchTx.reference||'—'}}</strong></div><div class="summary"><span>Direction</span><strong>{{Number(matchTx.amount)>0?'Deposit':'Withdrawal'}}</strong></div></div>
        <template v-if="matchTx.status==='unmatched'">
          <div class="mt-5 grid gap-5 lg:grid-cols-2">
            <section class="detail-card"><div class="flex items-start justify-between gap-3"><div><h3 class="font-black text-slate-950">Suggested Matches</h3><p class="mt-1 text-sm text-slate-500">Exact amount within seven days of the bank transaction.</p></div><span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{{candidates.length}}</span></div>
              <div v-if="candidateLoading" class="py-8 text-center text-sm text-slate-500">Looking for accounting matches…</div>
              <div v-else-if="candidates.length" class="mt-3 space-y-2"><button v-for="c in candidates" :key="c.type+'-'+c.id" type="button" class="candidate" :disabled="matching" @click="matchCandidate(c)"><div class="min-w-0 text-left"><div class="font-black text-slate-900">{{c.label}}</div><div class="mt-1 text-xs text-slate-400">{{candidateDate(c)}}<template v-if="c.reference"> · {{c.reference}}</template></div></div><strong class="shrink-0">{{money(c.amount)}}</strong></button></div>
              <div v-else class="mt-3 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">No exact accounting payment match found within seven days.</div>
            </section>
            <section class="detail-card"><h3 class="font-black text-slate-950">Create Accounting Entry</h3><p class="mt-1 text-sm text-slate-500">Use this only when the bank movement is not already recorded, such as a bank fee or interest.</p><label class="field mt-4"><span>Allocate To Ledger Account</span><select v-model.number="manualAccount" class="input"><option :value="0">Select account…</option><option v-for="a in manualAccounts" :key="a.id" :value="a.id">{{a.code}} · {{a.name}}</option></select></label><div class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">This creates a new balanced journal for this bank transaction. Do not use it if the payment already exists in Accounts Receivable or Accounts Payable.</div><button type="button" class="primary mt-4 w-full" :disabled="!manualAccount||matching" @click="manualMatch">{{matching?'Working…':'Create Journal & Match'}}</button></section>
          </div>
        </template>
        <template v-else><section class="detail-card mt-5"><h3 class="font-black text-slate-950">Accounting Match</h3><dl class="detail-list"><div><dt>Status</dt><dd>{{statusName(matchTx.status)}}</dd></div><div><dt>Match Type</dt><dd>{{matchTypeName(matchTx.match_type)}}</dd></div><div><dt>Match ID</dt><dd>{{matchTx.match_id||'—'}}</dd></div><div><dt>Journal ID</dt><dd>{{matchTx.journal_id||'—'}}</dd></div></dl></section></template>
        <div v-if="matchError" class="error-box mt-4">{{matchError}}</div>
      </div><footer class="modal-foot"><button class="secondary" @click="closeMatch">Close</button></footer>
    </section></div></Teleport>

    <Teleport to="body"><div v-if="historySelected" class="modal" @click.self="historySelected=null"><section class="modal-card max-w-lg"><header class="modal-head"><div><p class="eyebrow">Reconciliation</p><h2 class="modal-title">{{date(historySelected.statement_date)}}</h2></div><button class="modal-close" @click="historySelected=null">×</button></header><div class="modal-body"><dl class="detail-list"><div><dt>Statement Balance</dt><dd>{{money(historySelected.statement_balance)}}</dd></div><div><dt>Calculated Balance</dt><dd>{{money(historySelected.calculated_balance)}}</dd></div><div><dt>Difference</dt><dd :class="Math.abs(Number(historySelected.difference||0))<=.01?'text-emerald-700':'text-red-700'">{{money(historySelected.difference)}}</dd></div></dl></div><footer class="modal-foot"><button class="secondary" @click="historySelected=null">Close</button></footer></section></div></Teleport>
  </main>
</template>

<script setup lang="ts">
definePageMeta({layout:'admin',middleware:['admin']})
const {adminFetch,isSuperAdmin}=useAdminFetch()
const banks=ref<any[]>([]),accounts=ref<any[]>([]),tx=ref<any[]>([]),history=ref<any[]>([])
const bankId=ref(0),statusFilter=ref('all'),search=ref(''),err=ref(''),notice=ref(''),loading=ref(false)
const showBank=ref(false),bankSaving=ref(false),bankError=ref(''),matchTx=ref<any>(null),candidates=ref<any[]>([]),candidateLoading=ref(false),matching=ref(false),matchError=ref(''),manualAccount=ref(0),historySelected=ref<any>(null),fileInput=ref<HTMLInputElement|null>(null),reconciling=ref(false)
const bank=reactive({name:'',bsb:'',account_number:'',accounting_account_id:0,opening_balance:0})
const statement=reactive({date:new Date().toISOString().slice(0,10),balance:0})
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const date=(v:any)=>v?new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${String(v).slice(0,10)}T00:00:00`)):'—'
const selectedBank=computed(()=>banks.value.find(x=>Number(x.id)===Number(bankId.value)))
const ledgerBanks=computed(()=>accounts.value.filter(a=>a.account_type==='asset'))
const manualAccounts=computed(()=>accounts.value.filter(a=>a.active&&a.id!==selectedBank.value?.accounting_account_id))
const unmatched=computed(()=>tx.value.filter(x=>x.status==='unmatched'))
const matched=computed(()=>tx.value.filter(x=>x.status==='matched'))
const reconciled=computed(()=>tx.value.filter(x=>x.status==='reconciled'))
const absSum=(rows:any[])=>rows.reduce((n,x)=>n+Math.abs(Number(x.amount||0)),0)
const unmatchedAbsolute=computed(()=>absSum(unmatched.value)),matchedAbsolute=computed(()=>absSum(matched.value)),reconciledAbsolute=computed(()=>absSum(reconciled.value))
const importedBalance=computed(()=>Number(selectedBank.value?.opening_balance||0)+tx.value.reduce((n,x)=>n+Number(x.amount||0),0))
const calculatedToStatementDate=computed(()=>Number(selectedBank.value?.opening_balance||0)+tx.value.filter(x=>String(x.transaction_date||'').slice(0,10)<=statement.date).reduce((n,x)=>n+Number(x.amount||0),0))
const statementDifference=computed(()=>Math.round((Number(statement.balance||0)-calculatedToStatementDate.value)*100)/100)
const unmatchedToStatementDate=computed(()=>unmatched.value.filter(x=>String(x.transaction_date||'').slice(0,10)<=statement.date).length)
const filtered=computed(()=>{const q=search.value.trim().toLowerCase();return tx.value.filter(t=>(statusFilter.value==='all'||t.status===statusFilter.value)&&(!q||`${t.description||''} ${t.reference||''}`.toLowerCase().includes(q)))})
const statusName=(v:any)=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())
const matchTypeName=(v:any)=>v?String(v).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()):'—'
const candidateDate=(c:any)=>date(c.payment_date||c.created_at)

async function init(){if(!isSuperAdmin.value)return navigateTo('/admin');loading.value=true;try{[banks.value,accounts.value]=await Promise.all([adminFetch('/api/admin/accounting/bank/accounts'),adminFetch('/api/admin/accounting/accounts')]);if(banks.value.length){bankId.value=banks.value[0].id;await loadTransactions(false)}}catch(e:any){err.value=e?.data?.statusMessage||e?.statusMessage||e.message}finally{loading.value=false}}
async function loadTransactions(show=true){if(!bankId.value){tx.value=[];history.value=[];return}if(show)loading.value=true;err.value='';try{[tx.value,history.value]=await Promise.all([adminFetch(`/api/admin/accounting/bank/transactions?bank_account_id=${bankId.value}`),adminFetch(`/api/admin/accounting/bank/reconciliations?bank_account_id=${bankId.value}`)])}catch(e:any){err.value=e?.data?.statusMessage||e?.statusMessage||e.message}finally{loading.value=false}}
async function saveBank(){bankSaving.value=true;bankError.value='';try{await adminFetch('/api/admin/accounting/bank/accounts',{method:'POST',body:bank});showBank.value=false;banks.value=await adminFetch('/api/admin/accounting/bank/accounts');bankId.value=banks.value.at(-1)?.id||bankId.value;Object.assign(bank,{name:'',bsb:'',account_number:'',accounting_account_id:0,opening_balance:0});await loadTransactions();notice.value='Bank account added successfully.'}catch(e:any){bankError.value=e?.data?.statusMessage||e?.statusMessage||e.message}finally{bankSaving.value=false}}
function parseCsv(text:string){const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);if(lines.length<2)return[];const split=(line:string)=>{const out:string[]=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(c===','&&!q){out.push(cur.trim());cur=''}else cur+=c}out.push(cur.trim());return out};const h=split(lines[0]).map(x=>x.toLowerCase().replace(/[^a-z]/g,''));const idx=(...names:string[])=>h.findIndex(x=>names.includes(x));const di=idx('date','transactiondate'),xi=idx('description','details','narrative'),ri=idx('reference','ref'),ai=idx('amount'),debi=idx('debit','withdrawal'),cri=idx('credit','deposit');return lines.slice(1).map(line=>{const c=split(line);let amount=Number(String(ai>=0?c[ai]:'').replace(/[$,]/g,''));if(ai<0)amount=Number(String(c[cri]||'').replace(/[$,]/g,''))-Number(String(c[debi]||'').replace(/[$,]/g,''));let d=c[di]||'';if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)){const [dd,mm,yy]=d.split('/');d=`${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`}return{transaction_date:d,description:c[xi]||'',reference:ri>=0?c[ri]:'',amount}}).filter(x=>x.transaction_date&&Number.isFinite(x.amount)&&x.amount!==0)}
async function importCsv(e:any){const f=e.target.files?.[0];if(!f)return;err.value='';try{const rows=parseCsv(await f.text());const r:any=await adminFetch('/api/admin/accounting/bank/import',{method:'POST',body:{bank_account_id:bankId.value,rows}});notice.value=`Imported ${r.imported} transaction(s); ${r.skipped} duplicate/invalid row(s) skipped.`;await loadTransactions()}catch(x:any){err.value=x?.data?.statusMessage||x?.statusMessage||x.message}finally{e.target.value=''}}
async function openTransaction(t:any){matchTx.value=t;manualAccount.value=0;candidates.value=[];matchError.value='';if(t.status!=='unmatched')return;candidateLoading.value=true;try{candidates.value=await adminFetch(`/api/admin/accounting/bank/candidates?amount=${t.amount}&date=${t.transaction_date}`)}catch(e:any){matchError.value=e?.data?.statusMessage||e?.statusMessage||e.message}finally{candidateLoading.value=false}}
function closeMatch(){if(matching.value)return;matchTx.value=null;candidates.value=[];manualAccount.value=0;matchError.value=''}
async function matchCandidate(c:any){matching.value=true;matchError.value='';try{await adminFetch('/api/admin/accounting/bank/match',{method:'POST',body:{transaction_id:matchTx.value.id,match_type:c.type,match_id:c.id}});notice.value='Bank transaction matched successfully.';closeMatch();await loadTransactions()}catch(e:any){matchError.value=e?.data?.statusMessage||e?.statusMessage||e.message}finally{matching.value=false}}
async function manualMatch(){matching.value=true;matchError.value='';try{await adminFetch('/api/admin/accounting/bank/manual',{method:'POST',body:{transaction_id:matchTx.value.id,account_id:manualAccount.value}});notice.value='Accounting journal created and bank transaction matched.';closeMatch();await loadTransactions()}catch(e:any){matchError.value=e?.data?.statusMessage||e?.statusMessage||e.message}finally{matching.value=false}}
async function reconcile(){reconciling.value=true;err.value='';try{await adminFetch('/api/admin/accounting/bank/reconcile',{method:'POST',body:{bank_account_id:bankId.value,statement_date:statement.date,statement_balance:statement.balance}});notice.value='Bank statement reconciled successfully.';await loadTransactions()}catch(e:any){err.value=e?.data?.statusMessage||e?.statusMessage||e.message}finally{reconciling.value=false}}
function keydown(e:KeyboardEvent){if(e.key!=='Escape')return;if(matchTx.value)return closeMatch();if(showBank.value)showBank.value=false;if(historySelected.value)historySelected.value=null}
watch([showBank,matchTx,historySelected],([a,b,c])=>{if(import.meta.client)document.body.style.overflow=a||b||c?'hidden':''})
onMounted(()=>{window.addEventListener('keydown',keydown);init()})
onBeforeUnmount(()=>{window.removeEventListener('keydown',keydown);document.body.style.overflow=''})
</script>

<style scoped>
.panel{@apply rounded-2xl border border-slate-200 bg-white shadow-sm}.primary{@apply inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50}.secondary{@apply inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50}.input{@apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.field{@apply grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500}.stat{@apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300}.stat span{@apply block text-xs font-black uppercase tracking-wide text-slate-500}.stat strong{@apply mt-1 block text-xl font-black text-slate-950}.stat small{@apply mt-1 block text-xs font-semibold text-slate-400}.status{@apply inline-flex rounded-full px-2.5 py-1 text-[11px] font-black}.s-unmatched{@apply bg-amber-100 text-amber-800}.s-matched{@apply bg-blue-100 text-blue-800}.s-reconciled{@apply bg-emerald-100 text-emerald-800}.table-link{@apply font-black text-blue-600 hover:underline}.modal{@apply fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6}.modal-card{@apply flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl}.modal-head{@apply flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6}.modal-body{@apply min-h-0 flex-1 overflow-y-auto p-5 sm:p-6}.modal-foot{@apply flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:px-6}.modal-title{@apply text-xl font-black text-slate-950}.modal-close{@apply flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-600 hover:bg-slate-50}.eyebrow{@apply text-xs font-black uppercase tracking-[.14em] text-blue-600}.summary{@apply rounded-xl border border-slate-200 bg-white p-3}.summary span{@apply block text-[11px] font-black uppercase tracking-wide text-slate-400}.summary strong{@apply mt-1 block text-base font-black text-slate-950}.detail-card{@apply rounded-xl border border-slate-200 bg-white p-4}.detail-list>div{@apply flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0}.detail-list dt{@apply text-slate-500}.detail-list dd{@apply text-right font-black text-slate-900}.candidate{@apply flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/30 disabled:opacity-50}.error-box{@apply rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700}th{@apply border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500}td{@apply border-b border-slate-100 px-4 py-3 align-middle text-slate-700}
</style>
