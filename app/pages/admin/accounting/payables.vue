<template>
<main class="admin-content">
  <NuxtLink to="/admin/accounting" class="text-sm font-bold text-blue-600">← Accounting</NuxtLink>
  <div class="mt-2 flex flex-wrap items-end justify-between gap-3">
    <div><p class="text-xs font-black uppercase tracking-wider text-blue-600">SuperAdmin</p><h1 class="text-3xl font-black">Accounts Payable</h1><p class="text-slate-500">See what needs paying, when it is due, and pay several bills from one supplier in a single transaction.</p></div>
    <NuxtLink to="/admin/purchasing/suppliers/bills" class="secondary">Supplier Bills</NuxtLink>
  </div>
  <div v-if="msg" class="mt-4 rounded-lg bg-slate-100 p-3">{{msg}}</div>

  <div class="mt-5 grid gap-4 md:grid-cols-5">
    <div class="panel p-5"><small>Total Outstanding</small><div class="text-2xl font-black">{{money(totalOutstanding)}}</div></div>
    <div class="panel p-5"><small>Overdue</small><div class="text-2xl font-black text-red-600">{{money(overdueTotal)}}</div></div>
    <div class="panel p-5"><small>Due in 7 Days</small><div class="text-2xl font-black">{{money(dueSoonTotal)}}</div></div>
    <div class="panel p-5"><small>Part Paid</small><div class="text-3xl font-black">{{partPaidCount}}</div></div>
    <div class="panel p-5"><small>Suppliers Owing</small><div class="text-3xl font-black">{{supplierGroups.length}}</div></div>
  </div>

  <section class="panel mt-5 p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h2 class="text-xl font-black">Supplier Payment Workspace</h2><p class="text-sm text-slate-500">Bills are grouped by supplier so one EFT/payment can be allocated across multiple invoices.</p></div>
      <div class="flex flex-wrap gap-2"><input v-model="search" class="input !w-56" placeholder="Search supplier or bill"><select v-model="filter" class="input !w-48"><option value="all">All open bills</option><option value="overdue">Overdue</option><option value="due7">Due in 7 days</option><option value="part_paid">Part paid</option></select></div>
    </div>

    <div class="mt-4 space-y-4">
      <article v-for="g in filteredGroups" :key="g.id" class="rounded-xl border border-slate-200">
        <header class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4">
          <div><h3 class="text-lg font-black">{{g.name}}</h3><p class="text-sm text-slate-500">{{g.bills.length}} open bill{{g.bills.length===1?'':'s'}} · {{g.overdueCount}} overdue</p></div>
          <div class="flex items-center gap-4"><div class="text-right"><div class="text-xs font-bold text-slate-500">Supplier Balance</div><div class="text-xl font-black">{{money(g.total)}}</div></div><button class="primary" @click="openSupplierPayment(g)">Pay Supplier</button></div>
        </header>
        <div class="overflow-x-auto"><table class="w-full min-w-[980px] text-sm"><thead><tr class="border-b text-left"><th class="p-3">Bill</th><th>Supplier Invoice</th><th>Bill Date</th><th>Due Date</th><th>Status</th><th class="text-right">Total</th><th class="text-right">Paid</th><th class="text-right">Owing</th><th class="p-3 text-right">Action</th></tr></thead><tbody>
          <tr v-for="b in g.bills" :key="b.id" class="border-b last:border-0"><td class="p-3 font-bold">{{b.bill_number}}</td><td>{{b.supplier_invoice_number||'—'}}</td><td>{{b.bill_date}}</td><td><span :class="isOverdue(b)?'font-bold text-red-600':''">{{b.due_date||'—'}}</span></td><td><span class="badge" :class="isOverdue(b)?'!bg-red-50 !text-red-700':''">{{displayStatus(b)}}</span></td><td class="text-right">{{money(b.total)}}</td><td class="text-right">{{money(b.paid_amount)}}</td><td class="text-right font-black">{{money(owing(b))}}</td><td class="p-3 text-right"><button class="secondary !px-3 !py-1.5" @click="openSinglePayment(b)">Pay Bill</button></td></tr>
        </tbody></table></div>
      </article>
      <div v-if="!filteredGroups.length" class="p-8 text-center text-slate-500">No supplier bills match this view.</div>
    </div>
  </section>

  <section class="panel mt-5 p-5"><h2 class="text-xl font-black">Payables Ageing</h2><div class="mt-4 grid gap-3 sm:grid-cols-5"><button v-for="a in ageingCards" :key="a.key" class="rounded-xl border p-3 text-left hover:bg-slate-50" @click="ageFilter=a.key"><div class="text-xs font-bold text-slate-500">{{a.label}}</div><div class="mt-1 text-lg font-black">{{money(a.value)}}</div></button></div><div v-if="ageFilter" class="mt-3 flex items-center gap-2 text-sm"><b>Ageing filter:</b> {{ageingCards.find(x=>x.key===ageFilter)?.label}} <button class="text-blue-600 font-bold" @click="ageFilter=''">Clear</button></div></section>

  <section class="panel mt-5 p-5"><h2 class="text-xl font-black">Recent Supplier Payments</h2><div class="mt-3 overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b text-left"><th class="p-2">Date</th><th>Supplier</th><th>Bill</th><th>Reference</th><th class="text-right">Amount</th></tr></thead><tbody><tr v-for="p in payments.slice(0,30)" :key="p.id" class="border-b"><td class="p-2">{{String(p.created_at||'').slice(0,10)}}</td><td>{{p.accounting_supplier_bills?.accounting_suppliers?.name||'—'}}</td><td>{{p.accounting_supplier_bills?.bill_number||'—'}}</td><td>{{p.reference||'—'}}</td><td class="text-right font-bold">{{money(p.amount)}}</td></tr><tr v-if="!payments.length"><td colspan="5" class="p-8 text-center text-slate-500">No supplier payments recorded yet.</td></tr></tbody></table></div></section>

  <div v-if="paymentGroup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closePayment"><div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
    <div class="flex items-start justify-between gap-3"><div><h2 class="text-xl font-black">Pay Supplier</h2><p class="mt-1 text-sm text-slate-500">{{paymentGroup.name}} · allocate one payment across selected bills</p></div><button class="secondary !px-3 !py-1" @click="closePayment">Close</button></div>
    <div class="mt-4 overflow-x-auto"><table class="w-full min-w-[650px] text-sm"><thead><tr class="border-b text-left"><th class="p-2">Pay</th><th>Bill</th><th>Due</th><th class="text-right">Outstanding</th><th class="w-40 text-right">Allocate</th></tr></thead><tbody><tr v-for="x in allocations" :key="x.bill.id" class="border-b"><td class="p-2"><input v-model="x.selected" type="checkbox" @change="toggleAllocation(x)"></td><td class="font-bold">{{x.bill.bill_number}}<div class="text-xs font-normal text-slate-500">{{x.bill.supplier_invoice_number||''}}</div></td><td :class="isOverdue(x.bill)?'font-bold text-red-600':''">{{x.bill.due_date||'—'}}</td><td class="text-right">{{money(owing(x.bill))}}</td><td><input v-model.number="x.amount" :disabled="!x.selected" class="input text-right disabled:bg-slate-100" type="number" min="0" :max="owing(x.bill)" step="0.01"></td></tr></tbody></table></div>
    <div class="mt-4 grid gap-4 md:grid-cols-2"><div><label class="label">Payment Date</label><input v-model="bulkPayment.payment_date" class="input" type="date"></div><div><label class="label">EFT / Bank Reference</label><input v-model="bulkPayment.reference" class="input" placeholder="EFT / bank reference"></div></div>
    <div class="mt-5 rounded-xl bg-slate-50 p-4"><div class="flex justify-between"><span>Selected bills</span><b>{{selectedAllocations.length}}</b></div><div class="mt-2 flex justify-between text-lg"><span>Total payment</span><b>{{money(paymentTotal)}}</b></div></div>
    <p v-if="paymentError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{{paymentError}}</p>
    <div class="mt-5 flex justify-end gap-2"><button class="secondary" @click="closePayment">Cancel</button><button class="primary" :disabled="saving||paymentTotal<=0" @click="saveBulkPayment">{{saving?'Posting…':`Record ${money(paymentTotal)} Payment`}}</button></div>
  </div></div>
</main>
</template>
<script setup lang="ts">
definePageMeta({layout:"admin",middleware:["admin"]});
const{adminFetch,isSuperAdmin}=useAdminFetch();
const bills=ref<any[]>([]),payments=ref<any[]>([]),msg=ref(""),search=ref(""),filter=ref("all"),ageFilter=ref(""),paymentGroup=ref<any>(null),allocations=ref<any[]>([]),saving=ref(false),paymentError=ref("");
const bulkPayment=reactive({reference:"",payment_date:new Date().toISOString().slice(0,10)});
const money=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
const owing=(b:any)=>Math.max(0,Math.round((Number(b.total||0)-Number(b.paid_amount||0))*100)/100);
const today=()=>new Date(new Date().toISOString().slice(0,10)+"T00:00:00");
function daysOverdue(b:any){if(!b.due_date)return 0;return Math.floor((today().getTime()-new Date(b.due_date+"T00:00:00").getTime())/86400000)}
function isOverdue(b:any){return owing(b)>0&&daysOverdue(b)>0}
function bucket(b:any){const d=daysOverdue(b);if(d<=0)return"current";if(d<=30)return"1-30";if(d<=60)return"31-60";if(d<=90)return"61-90";return"90+"}
function displayStatus(b:any){if(owing(b)<=0)return"Paid";if(isOverdue(b))return Number(b.paid_amount)>0?"Part Paid · Overdue":"Overdue";return Number(b.paid_amount)>0?"Part Paid":"Current"}
const openBills=computed(()=>bills.value.filter(b=>owing(b)>0));
const totalOutstanding=computed(()=>openBills.value.reduce((s,b)=>s+owing(b),0));
const overdueTotal=computed(()=>openBills.value.filter(isOverdue).reduce((s,b)=>s+owing(b),0));
const dueSoonTotal=computed(()=>openBills.value.filter(b=>{if(!b.due_date)return false;const d=-daysOverdue(b);return d>=0&&d<=7}).reduce((s,b)=>s+owing(b),0));
const partPaidCount=computed(()=>openBills.value.filter(b=>Number(b.paid_amount||0)>0).length);
const ageingCards=computed(()=>[{key:"current",label:"Current",value:openBills.value.filter(b=>bucket(b)==="current").reduce((s,b)=>s+owing(b),0)},{key:"1-30",label:"1–30 Days",value:openBills.value.filter(b=>bucket(b)==="1-30").reduce((s,b)=>s+owing(b),0)},{key:"31-60",label:"31–60 Days",value:openBills.value.filter(b=>bucket(b)==="31-60").reduce((s,b)=>s+owing(b),0)},{key:"61-90",label:"61–90 Days",value:openBills.value.filter(b=>bucket(b)==="61-90").reduce((s,b)=>s+owing(b),0)},{key:"90+",label:"90+ Days",value:openBills.value.filter(b=>bucket(b)==="90+").reduce((s,b)=>s+owing(b),0)}]);
const visibleBills=computed(()=>openBills.value.filter(b=>{if(ageFilter.value&&bucket(b)!==ageFilter.value)return false;if(filter.value==="overdue"&&!isOverdue(b))return false;if(filter.value==="due7"){if(!b.due_date)return false;const d=-daysOverdue(b);if(d<0||d>7)return false}if(filter.value==="part_paid"&&Number(b.paid_amount||0)<=0)return false;const q=search.value.trim().toLowerCase();return !q||String(b.bill_number||"").toLowerCase().includes(q)||String(b.supplier_invoice_number||"").toLowerCase().includes(q)||String(b.accounting_suppliers?.name||"").toLowerCase().includes(q)}));
const supplierGroups=computed(()=>{const m=new Map<string,any>();for(const b of openBills.value){const id=String(b.supplier_id||b.accounting_suppliers?.name||"unknown");if(!m.has(id))m.set(id,{id,name:b.accounting_suppliers?.name||"Unknown Supplier",bills:[],total:0,overdueCount:0});const g=m.get(id);g.bills.push(b);g.total+=owing(b);if(isOverdue(b))g.overdueCount++}return [...m.values()].sort((a,b)=>b.total-a.total)});
const filteredGroups=computed(()=>{const allowed=new Set(visibleBills.value.map(b=>b.id));return supplierGroups.value.map(g=>({...g,bills:g.bills.filter((b:any)=>allowed.has(b.id))})).filter(g=>g.bills.length).map(g=>({...g,total:g.bills.reduce((s:number,b:any)=>s+owing(b),0),overdueCount:g.bills.filter(isOverdue).length}))});
const selectedAllocations=computed(()=>allocations.value.filter(x=>x.selected&&Number(x.amount)>0));
const paymentTotal=computed(()=>Math.round(selectedAllocations.value.reduce((s,x)=>s+Number(x.amount||0),0)*100)/100);
async function load(){msg.value="";try{if(!isSuperAdmin.value)return navigateTo("/admin");[bills.value,payments.value]=await Promise.all([adminFetch("/api/admin/accounting/supplier-bills"),adminFetch("/api/admin/accounting/supplier-payments")])}catch(e:any){msg.value=e?.data?.statusMessage||e.message}}
function openSupplierPayment(g:any){paymentGroup.value=g;allocations.value=g.bills.map((b:any)=>({bill:b,selected:true,amount:owing(b)}));bulkPayment.reference="";bulkPayment.payment_date=new Date().toISOString().slice(0,10);paymentError.value=""}
function openSinglePayment(b:any){openSupplierPayment({id:String(b.supplier_id),name:b.accounting_suppliers?.name||"Supplier",bills:[b]})}
function toggleAllocation(x:any){x.amount=x.selected?owing(x.bill):0}
function closePayment(){paymentGroup.value=null;allocations.value=[];paymentError.value=""}
async function saveBulkPayment(){paymentError.value="";const rows=selectedAllocations.value.map(x=>({bill_id:Number(x.bill.id),amount:Number(x.amount)}));if(!rows.length){paymentError.value="Select at least one bill and enter an amount.";return}for(const x of selectedAllocations.value){if(Number(x.amount)<=0||Number(x.amount)>owing(x.bill)){paymentError.value=`Allocation for ${x.bill.bill_number} must be between $0.01 and ${money(owing(x.bill))}.`;return}}saving.value=true;try{await adminFetch("/api/admin/accounting/supplier-payments/bulk",{method:"POST",body:{supplier_id:Number(paymentGroup.value.id),reference:bulkPayment.reference,payment_date:bulkPayment.payment_date,allocations:rows}});const total=paymentTotal.value;closePayment();msg.value=`Supplier payment of ${money(total)} posted and allocated across ${rows.length} bill${rows.length===1?'':'s'}.`;await load()}catch(e:any){paymentError.value=e?.data?.statusMessage||e.message}finally{saving.value=false}}
onMounted(load)
</script>
<style scoped>.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.input{@apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm}.primary{@apply rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50}.secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold}.badge{@apply rounded-full bg-slate-100 px-2 py-1 text-xs font-bold}.label{@apply mb-1 block text-sm font-bold}</style>
