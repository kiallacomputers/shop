<template><main class="admin-content">
<div class="flex flex-wrap items-end justify-between gap-4"><div><NuxtLink to="/admin/products" class="text-sm font-bold text-blue-600">← Products</NuxtLink><p class="mt-3 text-xs font-black uppercase tracking-wider text-blue-600">Products</p><h1 class="text-3xl font-black">Product Data Health</h1><p class="text-slate-500">Click an issue to fix it here without leaving this page.</p></div><button class="btn-secondary" @click="load">Refresh Check</button></div>
<div v-if="err" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700">{{err}}</div>
<section class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div class="metric"><small>Products</small><b>{{summary.total}}</b></div><div class="metric"><small>Healthy</small><b class="text-emerald-700">{{summary.healthy}}</b></div><div class="metric"><small>Warnings</small><b class="text-amber-700">{{summary.warning}}</b></div><div class="metric"><small>Critical</small><b class="text-red-700">{{summary.critical}}</b></div><div class="metric"><small>Total Issues</small><b>{{summary.issues}}</b></div></section>
<section class="panel mt-5 p-4"><div class="grid gap-3 lg:grid-cols-[1fr_220px_220px]"><input v-model="search" class="input" placeholder="Search product or SKU…"><select v-model="status" class="input"><option value="issues">Products with issues</option><option value="all">All products</option><option value="critical">Critical only</option><option value="warning">Warnings only</option><option value="healthy">Healthy only</option></select><select v-model="issueFilter" class="input"><option value="">All issue types</option><option v-for="x in issueTypes" :key="x.key" :value="x.key">{{x.label}}</option></select></div></section>
<section class="panel mt-5 overflow-hidden"><div v-if="loading" class="p-10 text-center text-slate-500">Checking products…</div><div v-else class="overflow-x-auto"><table class="w-full min-w-[1050px] text-sm"><thead><tr class="bg-slate-50 text-left"><th class="p-3">Product</th><th>SKU</th><th>Supplier</th><th>Supplier SKU</th><th class="text-right">Buy</th><th class="text-center">Levels L/R/T</th><th>Issues — click to fix</th></tr></thead><tbody>
<tr v-for="p in filtered" :key="p.id" class="border-t"><td class="p-3"><div class="font-bold">{{p.name}}</div><span class="text-xs" :class="p.active?'text-emerald-700':'text-slate-400'">{{p.active?'Active':'Inactive'}}</span></td><td>{{p.sku||'—'}}</td><td>{{p.primary_supplier||'—'}}</td><td>{{p.supplier_sku||'—'}}</td><td class="text-right">{{money(p.buy_price)}}</td><td class="text-center font-bold">{{p.low_stock_level}} / {{p.reorder_level}} / {{p.target_stock_level}}</td><td><div class="flex max-w-[430px] flex-wrap gap-1"><span v-if="!p.issues.length" class="pill good">Healthy</span><button v-for="x in p.issues" :key="x.key+x.label" type="button" class="pill transition hover:ring-2 hover:ring-blue-300" :class="x.severity==='critical'?'bad':'warn'" @click="openFix(p,x)">{{x.label}} <span class="ml-1">✎</span></button></div></td></tr>
<tr v-if="!filtered.length"><td colspan="7" class="p-10 text-center text-slate-500">No products match the selected health filters.</td></tr></tbody></table></div></section>

<Teleport to="body"><div v-if="modal" class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4" @click.self="closeFix"><div class="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
<div class="flex items-start justify-between border-b p-5"><div><p class="text-xs font-black uppercase tracking-wider text-blue-600">Quick Fix</p><h2 class="text-xl font-black text-slate-900">{{modal.issue.label}}</h2><p class="mt-1 text-sm text-slate-500">{{modal.product.name}}</p></div><button class="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100" @click="closeFix">×</button></div>
<form class="space-y-4 p-5" @submit.prevent="saveFix">
<div v-if="modal.issue.key==='sku'"><label class="label">Product Code / SKU</label><input v-model="fix.value" class="input w-full" required placeholder="Enter product code"></div>
<div v-else-if="modal.issue.key==='category'"><label class="label">Category</label><select v-model="fix.value" class="input w-full" required><option value="">Choose category…</option><option v-for="c in categories" :key="c.id" :value="c.id">{{categoryName(c)}}</option></select></div>
<div v-else-if="isStockLevelIssue(modal.issue)" class="grid grid-cols-3 gap-3"><div><label class="label">Low Stock</label><input v-model.number="fix.low_stock_level" type="number" min="0" step="1" class="input w-full"></div><div><label class="label">Reorder</label><input v-model.number="fix.reorder_level" type="number" min="0" step="1" class="input w-full"></div><div><label class="label">Target</label><input v-model.number="fix.target_stock_level" type="number" min="0" step="1" class="input w-full"></div></div>
<div v-else-if="modal.issue.key==='sell_price'"><label class="label">Sell Price (inc GST)</label><input v-model.number="fix.value" type="number" min="0.01" step="0.01" class="input w-full" required></div>
<div v-else-if="modal.issue.key==='buy_price'"><label class="label">Buy Price ex GST</label><input v-model.number="fix.value" type="number" min="0.01" step="0.01" class="input w-full" required><p class="hint">{{fix.supplier_id?'Updates the selected/primary supplier buy price.':'Updates the product base buy price.'}}</p></div>
<template v-else-if="['supplier','primary_supplier','supplier_sku'].includes(modal.issue.key)"><div><label class="label">Supplier</label><select v-model.number="fix.supplier_id" class="input w-full" required @change="supplierChanged"><option :value="0">Choose supplier…</option><option v-for="s in suppliers" :key="s.id" :value="Number(s.id)">{{s.name}}</option></select></div><div><label class="label">Supplier SKU</label><input v-model="fix.supplier_sku" class="input w-full" placeholder="Supplier product code"></div><div><label class="label">Buy Price ex GST</label><input v-model="fix.buy_price_ex_gst" type="number" min="0" step="0.01" class="input w-full" placeholder="0.00"></div><p v-if="modal.issue.key!=='supplier_sku'" class="hint">This supplier will be set as the primary supplier for this product.</p></template>
<div v-if="modalError" class="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{{modalError}}</div>
<div class="flex justify-end gap-3 border-t pt-4"><button type="button" class="btn-secondary" :disabled="saving" @click="closeFix">Cancel</button><button type="submit" class="btn-primary" :disabled="saving">{{saving?'Saving…':'Save Fix'}}</button></div></form>
</div></div></Teleport>
</main></template>
<script setup lang="ts">
definePageMeta({layout:"admin",middleware:["admin"]});const{adminFetch}=useAdminFetch();const loading=ref(true),saving=ref(false),err=ref(""),modalError=ref(""),search=ref(""),status=ref("issues"),issueFilter=ref(""),products=ref<any[]>([]),categories=ref<any[]>([]),suppliers=ref<any[]>([]),summary=ref<any>({total:0,healthy:0,warning:0,critical:0,issues:0});const modal=ref<any>(null),fix=reactive<any>({value:"",supplier_id:0,supplier_sku:"",buy_price_ex_gst:"",low_stock_level:0,reorder_level:0,target_stock_level:0});const money=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
const issueTypes=computed(()=>{const m=new Map();for(const p of products.value)for(const x of p.issues)m.set(x.key,{key:x.key,label:x.label});return[...m.values()].sort((a:any,b:any)=>a.label.localeCompare(b.label))});const filtered=computed(()=>{const q=search.value.toLowerCase().trim();return products.value.filter((p:any)=>{if(q&&!p.name.toLowerCase().includes(q)&&!String(p.sku||"").toLowerCase().includes(q))return false;if(status.value==="issues"&&!p.issues.length)return false;if(["critical","warning","healthy"].includes(status.value)&&p.health!==status.value)return false;if(issueFilter.value&&!p.issues.some((x:any)=>x.key===issueFilter.value))return false;return true})});
const categoryName=(c:any)=>{const parent=categories.value.find((x:any)=>String(x.id)===String(c.parent_id));return parent?`${parent.name} → ${c.name}`:c.name};
const isStockLevelIssue=(i:any)=>["target","levels","stock_levels","stock-levels"].includes(String(i?.key||""))||/stock levels?/i.test(String(i?.label||""));
function openFix(p:any,i:any){modal.value={product:p,issue:i};modalError.value="";Object.assign(fix,{value:"",supplier_id:0,supplier_sku:"",buy_price_ex_gst:"",low_stock_level:p.low_stock_level,reorder_level:p.reorder_level,target_stock_level:p.target_stock_level});if(i.key==="sku")fix.value=p.sku||"";if(i.key==="sell_price")fix.value=p.sell_price||"";if(i.key==="buy_price"){fix.value=p.buy_price||"";fix.supplier_id=Number(p.suppliers?.find((x:any)=>x.is_primary)?.supplier_id||0)}const current=p.suppliers?.find((x:any)=>x.is_primary)||p.suppliers?.[0];if(["primary_supplier","supplier_sku"].includes(i.key)&&current){fix.supplier_id=Number(current.supplier_id);fix.supplier_sku=current.supplier_sku||"";fix.buy_price_ex_gst=current.buy_price_ex_gst??""}}
function supplierChanged(){const row=modal.value?.product?.suppliers?.find((x:any)=>Number(x.supplier_id)===Number(fix.supplier_id));fix.supplier_sku=row?.supplier_sku||"";fix.buy_price_ex_gst=row?.buy_price_ex_gst??""}
function closeFix(){if(!saving.value)modal.value=null}
async function saveFix() {
  if (!modal.value) return;
  saving.value = true;
  modalError.value = "";

  try {
    const key = modal.value.issue.key;
    const body: any = {
      product_id: modal.value.product.id,
      issue: key,
    };

    if (["sku", "category", "sell_price", "buy_price"].includes(key)) {
      body.value = fix.value;
    }

    if (key === "buy_price") {
      body.supplier_id = fix.supplier_id;
    }

    if (isStockLevelIssue(modal.value.issue)) {
      body.issue = "levels";
      Object.assign(body, {
        low_stock_level: fix.low_stock_level,
        reorder_level: fix.reorder_level,
        target_stock_level: fix.target_stock_level,
      });
    }

    if (["supplier", "primary_supplier", "supplier_sku"].includes(key)) {
      Object.assign(body, {
        supplier_id: fix.supplier_id,
        supplier_sku: fix.supplier_sku,
        buy_price_ex_gst: fix.buy_price_ex_gst,
        is_primary: key !== "supplier_sku",
      });
    }

    await adminFetch("/api/admin/products/data-health/fix", {
      method: "PUT",
      body,
    });

    modal.value = null;
    await load();
  } catch (e: any) {
    modalError.value =
      e?.data?.statusMessage || e?.message || "Unable to save this fix.";
  } finally {
    saving.value = false;
  }
}

async function load(){loading.value=true;err.value="";try{const[r,c,s]:any[]=await Promise.all([adminFetch("/api/admin/products/data-health"),adminFetch("/api/admin/categories"),adminFetch("/api/admin/products/suppliers")]);products.value=r.products||[];summary.value=r.summary||summary.value;categories.value=Array.isArray(c)?c:(c?.categories||[]);suppliers.value=Array.isArray(s)?s:[]}catch(e:any){err.value=e?.data?.statusMessage||e?.message||"Unable to check product data."}finally{loading.value=false}}onMounted(load)
</script>
<style scoped>.panel{@apply rounded-xl border border-slate-200 bg-white shadow-sm}.metric{@apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm}.metric small{@apply block text-xs font-bold uppercase text-slate-500}.metric b{@apply mt-1 block text-2xl}.input{@apply rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500}.label{@apply mb-1.5 block text-sm font-bold text-slate-700}.hint{@apply mt-1 text-xs text-slate-500}.btn-primary{@apply rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50}.btn-secondary{@apply rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold hover:bg-slate-50 disabled:opacity-50}.pill{@apply rounded-full px-2 py-1 text-xs font-bold}.good{@apply bg-emerald-100 text-emerald-700}.warn{@apply bg-amber-100 text-amber-800}.bad{@apply bg-red-100 text-red-700}</style>