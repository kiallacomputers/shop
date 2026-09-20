<template>
<main class="admin-content">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <NuxtLink to="/admin/products" class="text-sm font-bold text-blue-600">← Products</NuxtLink>
      <p class="mt-3 text-xs font-black uppercase tracking-wider text-blue-600">Products</p>
      <h1 class="text-3xl font-black">Stocktake</h1>
      <p class="text-slate-500">Count physical stock, review variances and post audited stock adjustments to accounting.</p>
    </div>
    <button class="btn-primary" :disabled="posting || !changedRows.length" @click="reviewOpen=true">
      Review & Post {{ changedRows.length ? `(${changedRows.length})` : "" }}
    </button>
  </div>

  <div v-if="message" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-semibold text-emerald-800">{{message}}</div>
  <div v-if="err" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700">{{err}}</div>

  <section class="panel mt-5 p-4">
    <div class="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
      <input v-model="search" class="input" placeholder="Search product or SKU…" />
      <select v-model="filter" class="input">
        <option value="all">All products</option>
        <option value="uncounted">Not counted</option>
        <option value="changed">Variances only</option>
        <option value="matched">Matched only</option>
      </select>
      <button class="btn-secondary" @click="setVisibleToSystem">Set visible counts to system stock</button>
    </div>
    <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="metric-card"><small>Products</small><div>{{products.length}}</div></div>
      <div class="metric-card"><small>Counted</small><div>{{countedCount}}</div></div>
      <div class="metric-card"><small>Variances</small><div>{{changedRows.length}}</div></div>
      <div class="metric-card"><small>Net value adjustment</small><div :class="netValue<0?'text-red-600':'text-emerald-700'">{{money(netValue)}}</div></div>
    </div>
  </section>

  <section class="panel mt-5 overflow-hidden">
    <div class="border-b p-4">
      <h2 class="text-lg font-black">Physical Count</h2>
      <p class="text-sm text-slate-500">Enter the quantity physically counted. Blank means the product has not been counted yet.</p>
    </div>
    <div v-if="loading" class="p-10 text-center font-semibold text-slate-500">Loading stock…</div>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[980px] text-sm">
        <thead><tr class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <th class="p-3">Product</th><th>SKU</th><th class="text-right">System</th><th class="text-center">Counted</th>
          <th class="text-right">Variance</th><th class="text-right">Unit Cost</th><th class="text-right">Value Adjustment</th><th class="pr-3">Result</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id" class="border-t" :class="isChanged(p)?'bg-amber-50/60':''">
            <td class="p-3 font-bold">{{p.name}}</td>
            <td class="text-slate-600">{{displaySku(p)}}</td>
            <td class="text-right font-black">{{num(p.stock)}}</td>
            <td><input v-model="p.counted_stock" type="number" min="0" step="1" class="count-input" placeholder="—" @input="clearMessages" /></td>
            <td class="text-right font-black" :class="variance(p)<0?'text-red-600':variance(p)>0?'text-emerald-700':''">
              {{p.counted_stock===''?'—':signed(variance(p))}}
            </td>
            <td class="text-right">{{money(p.buy_price_ex_gst)}}</td>
            <td class="text-right font-bold" :class="valueAdjustment(p)<0?'text-red-600':valueAdjustment(p)>0?'text-emerald-700':''">
              {{p.counted_stock===''?'—':money(valueAdjustment(p))}}
            </td>
            <td class="pr-3"><span class="rounded-full px-2.5 py-1 text-xs font-black" :class="resultClass(p)">{{resultLabel(p)}}</span></td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="8" class="p-10 text-center text-slate-500">No products match this filter.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="panel mt-5 overflow-hidden">
    <div class="p-5"><h2 class="text-xl font-black">Recent Stocktake Adjustments</h2><p class="text-sm text-slate-500">Recent stocktake postings recorded in the inventory movement ledger and accounting journals.</p></div>
    <div class="overflow-x-auto"><table class="w-full min-w-[800px] text-sm">
      <thead><tr class="bg-slate-50 text-left"><th class="p-3">Date</th><th>Product</th><th>Reference</th><th class="text-right">Qty</th><th class="text-right">Value</th><th class="pr-3">Journal</th></tr></thead>
      <tbody>
        <tr v-for="x in history" :key="x.id" class="border-t"><td class="p-3">{{x.movement_date}}</td><td class="font-bold">{{x.product_name}}</td><td>{{x.reference}}</td><td class="text-right" :class="Number(x.quantity)<0?'text-red-600':'text-emerald-700'">{{signed(Number(x.quantity))}}</td><td class="text-right">{{money(Math.abs(Number(x.total_cost||0)))}}</td><td class="pr-3">{{x.journal_id?`Journal #${x.journal_id}`:'—'}}</td></tr>
        <tr v-if="!history.length"><td colspan="6" class="p-8 text-center text-slate-500">No stocktake adjustments have been posted yet.</td></tr>
      </tbody>
    </table></div>
  </section>

  <div v-if="reviewOpen" class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4" @click.self="reviewOpen=false">
    <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div class="sticky top-0 flex items-start justify-between border-b bg-white p-5">
        <div><p class="text-xs font-black uppercase tracking-wide text-blue-600">Final review</p><h2 class="text-2xl font-black">Post Stocktake Adjustments</h2><p class="text-sm text-slate-500">{{changedRows.length}} product variances will change stock and create accounting journal entries.</p></div>
        <button class="text-2xl text-slate-400" @click="reviewOpen=false">×</button>
      </div>
      <div class="p-5">
        <div class="grid gap-3 md:grid-cols-3">
          <div><label class="label">Stocktake date</label><input v-model="stocktakeDate" type="date" class="input w-full" /></div>
          <div><label class="label">Reference</label><input v-model="reference" class="input w-full" /></div>
          <div><label class="label">Reason</label><select v-model="reason" class="input w-full"><option>Stocktake variance</option><option>Annual stocktake</option><option>Cycle count</option><option>Stock correction</option></select></div>
        </div>
        <div class="mt-3"><label class="label">Notes</label><textarea v-model="notes" class="input w-full" rows="2" placeholder="Optional stocktake notes"></textarea></div>
        <div class="mt-5 overflow-x-auto rounded-xl border"><table class="w-full min-w-[700px] text-sm"><thead><tr class="bg-slate-50 text-left"><th class="p-3">Product</th><th class="text-right">System</th><th class="text-right">Counted</th><th class="text-right">Variance</th><th class="text-right pr-3">Value</th></tr></thead><tbody><tr v-for="p in changedRows" :key="p.id" class="border-t"><td class="p-3 font-bold">{{p.name}}</td><td class="text-right">{{num(p.stock)}}</td><td class="text-right">{{num(Number(p.counted_stock))}}</td><td class="text-right font-black" :class="variance(p)<0?'text-red-600':'text-emerald-700'">{{signed(variance(p))}}</td><td class="text-right pr-3">{{money(valueAdjustment(p))}}</td></tr></tbody></table></div>
        <div class="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><strong>Accounting:</strong> increases debit Inventory and credit General Expense (stocktake gain); decreases debit General Expense and credit Inventory (stocktake loss). Each variance is linked to its posted journal and inventory movement.</div>
      </div>
      <div class="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-5"><button class="btn-secondary" :disabled="posting" @click="reviewOpen=false">Cancel</button><button class="btn-primary" :disabled="posting" @click="postStocktake">{{posting?'Posting stocktake…':`Post ${changedRows.length} Adjustments`}}</button></div>
    </div>
  </div>
</main>
</template>

<script setup lang="ts">
definePageMeta({layout:"admin",middleware:["admin"]});
const {adminFetch,isSuperAdmin}=useAdminFetch();
const loading=ref(true),posting=ref(false),err=ref(""),message=ref(""),search=ref(""),filter=ref("all"),reviewOpen=ref(false);
const products=ref<any[]>([]),history=ref<any[]>([]);
const stocktakeDate=ref(new Date().toISOString().slice(0,10));
const reference=ref(`ST-${new Date().toISOString().slice(0,10).replaceAll("-","")}`);
const reason=ref("Stocktake variance"),notes=ref("");

const displaySku=(p:any)=>String(p?.sku ?? p?.product_code ?? p?.product_sku ?? p?.supplier_sku ?? "").trim() || "—";
const money=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
const num=(v:any)=>new Intl.NumberFormat("en-AU",{maximumFractionDigits:3}).format(Number(v||0));
const signed=(v:number)=>v>0?`+${num(v)}`:num(v);
const counted=(p:any)=>p.counted_stock!==""&&p.counted_stock!==null&&p.counted_stock!==undefined;
const variance=(p:any)=>counted(p)?Number(p.counted_stock)-Number(p.stock||0):0;
const isChanged=(p:any)=>counted(p)&&variance(p)!==0;
const valueAdjustment=(p:any)=>variance(p)*Number(p.buy_price_ex_gst||0);
const changedRows=computed(()=>products.value.filter(isChanged));
const countedCount=computed(()=>products.value.filter(counted).length);
const netValue=computed(()=>changedRows.value.reduce((a:number,p:any)=>a+valueAdjustment(p),0));
const filtered=computed(()=>products.value.filter((p:any)=>{const q=search.value.trim().toLowerCase();if(q&&!String(p.name||"").toLowerCase().includes(q)&&!displaySku(p).toLowerCase().includes(q))return false;if(filter.value==="uncounted")return !counted(p);if(filter.value==="changed")return isChanged(p);if(filter.value==="matched")return counted(p)&&!isChanged(p);return true}));
function resultLabel(p:any){if(!counted(p))return"Not counted";if(isChanged(p))return variance(p)>0?"Increase":"Decrease";return"Matched"}
function resultClass(p:any){if(!counted(p))return"bg-slate-100 text-slate-600";if(!isChanged(p))return"bg-emerald-100 text-emerald-700";return variance(p)>0?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-800"}
function clearMessages(){err.value="";message.value=""}
function setVisibleToSystem(){for(const p of filtered.value)p.counted_stock=String(Number(p.stock||0));clearMessages()}
async function load(){loading.value=true;clearMessages();try{if(!isSuperAdmin.value)return navigateTo("/admin");const [adminRows, accountingRows, h]:any[]=await Promise.all([
  adminFetch("/api/admin/products"),
  adminFetch("/api/admin/accounting/store-products"),
  adminFetch("/api/admin/accounting/stocktake/history")
]);
const accountingById=new Map((Array.isArray(accountingRows)?accountingRows:[]).map((p:any)=>[String(p.id),p]));
products.value=(Array.isArray(adminRows)?adminRows:[]).map((p:any)=>{
  const accounting:any=accountingById.get(String(p.id))||{};
  return {
    ...accounting,
    ...p,
    // Explicitly preserve the store SKU from Admin Products, while allowing
    // legacy product_code data as a fallback.
    sku: p.sku ?? p.product_code ?? accounting.sku ?? accounting.product_code ?? "",
    product_code: p.product_code ?? p.sku ?? accounting.product_code ?? accounting.sku ?? "",
    buy_price_ex_gst: accounting.buy_price_ex_gst ?? p.buy_price_ex_gst ?? p.buy_price ?? 0,
    counted_stock:""
  };
});
history.value=Array.isArray(h)?h:[]}catch(e:any){err.value=e?.data?.statusMessage||e?.message||"Unable to load stocktake."}finally{loading.value=false}}
async function postStocktake(){clearMessages();if(!changedRows.value.length)return;for(const p of changedRows.value){const c=Number(p.counted_stock);if(!Number.isInteger(c)||c<0){err.value=`${p.name}: counted stock must be a whole number of 0 or more.`;reviewOpen.value=false;return}}posting.value=true;try{const result:any=await adminFetch("/api/admin/accounting/stocktake/post",{method:"POST",body:{movement_date:stocktakeDate.value,reference:reference.value,reason:reason.value,notes:notes.value,items:changedRows.value.map((p:any)=>({product_id:p.id,counted_stock:Number(p.counted_stock)}))}});reviewOpen.value=false;message.value=`Stocktake posted successfully: ${result.adjustments} adjustment${result.adjustments===1?"":"s"}, ${result.journals} journal${result.journals===1?"":"s"}.`;await load();message.value=`Stocktake posted successfully: ${result.adjustments} adjustment${result.adjustments===1?"":"s"}, ${result.journals} journal${result.journals===1?"":"s"}.`}catch(e:any){err.value=e?.data?.statusMessage||e?.message||"Unable to post stocktake."}finally{posting.value=false}}
onMounted(load);
</script>
<style scoped>
.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.input{@apply rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.label{@apply mb-1 block text-xs font-bold text-slate-600}.count-input{@apply mx-auto block w-24 rounded-lg border border-slate-300 px-3 py-2 text-center font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100}.btn-primary{@apply rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50}.metric-card{@apply rounded-xl bg-slate-50 p-4}.metric-card small{@apply text-xs font-bold uppercase tracking-wide text-slate-500}.metric-card div{@apply mt-1 text-2xl font-black}
</style>
