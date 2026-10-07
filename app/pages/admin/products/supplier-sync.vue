<template>
  <div class="admin-page"><div class="admin-page-inner max-w-[1600px]">
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><NuxtLink to="/admin/products" class="text-sm font-semibold text-blue-600">← Manage Products</NuxtLink>
        <h1 class="mt-3 text-3xl font-bold text-slate-900">Supplier Price-Change Review</h1>
        <p class="mt-1 text-slate-500">Check Leader stock and pricing, then decide exactly which cost changes to accept. Retail prices never change unless you choose recalculation.</p></div>
      <button class="rounded-lg bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50" :disabled="busy" @click="scan">{{busy?`Checking Leader… ${summary?.checked||0}/${summary?.total||'?'}`:'Sync All Leader Products'}}</button>
    </div>

    <div v-if="error" class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{{error}}</div>

    <div v-if="summary" class="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div class="card"><span>Checked</span><strong>{{summary.checked}}</strong></div>
      <div class="card"><span>Price changed</span><strong>{{priceChangedCount}}</strong></div>
      <div class="card"><span>Increased</span><strong class="!text-red-600">{{increaseCount}}</strong></div>
      <div class="card"><span>Decreased</span><strong class="!text-emerald-700">{{decreaseCount}}</strong></div>
      <div class="card"><span>Low margin</span><strong class="!text-amber-600">{{lowMarginCount}}</strong></div>
      <div class="card"><span>Failed</span><strong>{{failedCount}}</strong></div>
    </div>

    <div v-if="rows.length" class="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div class="flex flex-wrap gap-2">
        <button v-for="f in filters" :key="f.key" type="button" class="rounded-full border px-3 py-1.5 text-xs font-bold" :class="filter===f.key?'border-blue-600 bg-blue-600 text-white':'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'" @click="filter=f.key">{{f.label}} ({{filterCount(f.key)}})</button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-semibold text-slate-500">{{selectedIds.length}} selected</span>
        <button class="action" :disabled="!selectedIds.length||bulkBusy" @click="bulkApply(false)">Accept Buy Price</button>
        <button class="action-blue" :disabled="!selectedIds.length||bulkBusy" @click="bulkApply(true)">Accept + Recalculate</button>
        <button class="action-muted" :disabled="!selectedIds.length||bulkBusy" @click="bulkIgnore">Ignore</button>
      </div>
    </div>

    <div v-if="rows.length" class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-[1650px] w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr>
        <th class="p-4 text-center"><input type="checkbox" :checked="allVisibleSelected" @change="toggleAllVisible"></th>
        <th class="p-4 text-left">Product</th><th class="p-4 text-right">Current Buy</th><th class="p-4 text-right">Leader Buy</th><th class="p-4 text-right">Change</th><th class="p-4 text-right">Current Sell</th><th class="p-4 text-right">RRP → Leader RRP</th><th class="p-4 text-right">Margin After Cost</th><th class="p-4 text-center">Leader Stock</th><th class="p-4 text-center">Status</th><th class="p-4 text-right">Action</th>
      </tr></thead><tbody>
        <tr v-for="r in filteredRows" :key="r.row_key||r.product_id" class="border-t border-slate-100" :class="r.ignored?'bg-slate-50/70':''">
          <td class="p-4 text-center"><input v-if="r.status==='ok'&&r.changed&&!r.ignored" v-model="selectedIds" type="checkbox" :value="r.row_key||String(r.product_id)"></td>
          <td class="p-4"><p class="font-bold text-slate-900">{{r.name}}</p><p class="text-xs text-slate-500">{{r.sku}}</p><p v-if="r.error" class="mt-1 text-xs font-semibold text-red-600">{{r.error}}</p></td>
          <template v-if="r.status==='ok'">
            <td class="p-4 text-right">{{money(r.current_buy)}}</td><td class="p-4 text-right font-bold">{{money(r.supplier_buy)}}</td>
            <td class="p-4 text-right"><span :class="r.delta>0?'text-red-600':r.delta<0?'text-emerald-600':'text-slate-500'" class="font-bold">{{signedMoney(r.delta)}} <small>({{signed(r.delta_percent)}}%)</small></span></td>
            <td class="p-4 text-right">{{money(r.current_sell)}}</td><td class="p-4 text-right"><span v-if="r.supplier_rrp>0">{{money(r.current_rrp)}} → <b>{{money(r.supplier_rrp)}}</b></span><span v-else class="text-slate-400">No supplier RRP</span></td>
            <td class="p-4 text-right"><span class="font-black" :class="r.proposed_margin<10?'text-red-600':r.proposed_margin<20?'text-amber-600':'text-emerald-700'">{{Number(r.proposed_margin||0).toFixed(1)}}%</span></td>
            <td class="p-4 text-center"><span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="r.supplier_stock>0?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'">{{r.supplier_stock}}</span><p class="mt-1 whitespace-nowrap text-[10px] text-slate-400">VIC {{r.stock_by_state?.VIC||0}} · NSW {{r.stock_by_state?.NSW||0}} · QLD {{r.stock_by_state?.QLD||0}} · SA {{r.stock_by_state?.SA||0}} · WA {{r.stock_by_state?.WA||0}}</p></td>
            <td class="p-4 text-center"><span v-if="r.ignored" class="badge bg-slate-200 text-slate-700">Ignored</span><span v-else-if="r.changed" class="badge bg-amber-100 text-amber-800">Review</span><span v-else class="badge bg-emerald-100 text-emerald-700">Up to date</span></td>
            <td class="p-4 text-right"><div v-if="r.changed&&!r.ignored" class="flex justify-end gap-2"><button class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white" @click="openApply(r)">Review</button><button class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold" @click="ignoreRow(r)">Ignore</button></div><button v-else-if="r.ignored" class="text-xs font-bold text-blue-600" @click="restoreRow(r)">Restore</button><span v-else class="text-xs font-bold text-emerald-600">Up to date</span></td>
          </template><td v-else colspan="8" class="p-4 text-red-600">Unable to sync</td>
        </tr>
      </tbody></table>
    </div>
    <div v-else-if="summary&&!busy" class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No Leader-linked primary supplier products were found.</div>

    <Teleport to="body"><div v-if="selected" class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4" @click.self="selected=null">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><h2 class="text-xl font-black text-slate-900">Review Leader price change</h2><p class="mt-1 text-sm text-slate-500">{{selected.name}} · {{selected.sku}}</p>
        <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div class="card"><span>Current buy</span><strong>{{money(selected.current_buy)}}</strong></div><div class="card"><span>Leader buy</span><strong>{{money(selected.supplier_buy)}}</strong></div><div class="card"><span>Change</span><strong :class="selected.delta>0?'!text-red-600':'!text-emerald-700'">{{signedMoney(selected.delta)}}</strong></div><div class="card"><span>Margin after</span><strong>{{Number(selected.proposed_margin||0).toFixed(1)}}%</strong></div></div>
        <div class="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><p class="text-xs font-bold uppercase text-blue-700">RRP</p><p class="mt-1 text-lg font-black">{{money(selected.current_rrp)}} → {{selected.supplier_rrp>0?money(selected.supplier_rrp):'Keep current RRP'}}</p></div><div class="mt-5 rounded-xl border border-slate-200 p-4"><p class="font-bold text-slate-900">Choose what to update</p><p class="mt-1 text-sm text-slate-500">Accepting the buy price does not alter the customer's Sell Price unless you explicitly choose recalculation.</p></div>
        <div class="mt-6 flex flex-wrap justify-end gap-2"><button class="rounded-lg border px-4 py-2 font-bold" @click="selected=null">Cancel</button><button class="rounded-lg border border-slate-300 px-4 py-2 font-bold" @click="ignoreSelected">Ignore Change</button><button class="rounded-lg bg-slate-800 px-4 py-2 font-bold text-white" @click="applyChange(false)">Accept Buy Price Only</button><button class="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white" @click="applyChange(true)">Accept + Recalculate Sell + Supplier RRP</button></div>
      </div></div></Teleport>
  </div></div>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:'admin'})
const {adminFetch}=useAdminFetch()
const busy=ref(false), bulkBusy=ref(false), error=ref(''), rows=ref<any[]>([]), summary=ref<any>(null), selected=ref<any>(null), filter=ref('changed'), selectedIds=ref<string[]>([])
const filters=[{key:'changed',label:'Needs Review'},{key:'increase',label:'Increased'},{key:'decrease',label:'Decreased'},{key:'low_margin',label:'Margin < 20%'},{key:'ignored',label:'Ignored'},{key:'failed',label:'Failed'},{key:'all',label:'All'}]
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0)); const signedMoney=(v:any)=>(Number(v)>0?'+':'')+money(v); const signed=(v:any)=>(Number(v)>0?'+':'')+Number(v||0).toFixed(2)
const priceChangedCount=computed(()=>rows.value.filter(r=>r.status==='ok'&&r.changed).length), increaseCount=computed(()=>rows.value.filter(r=>r.status==='ok'&&r.changed&&r.delta>0).length), decreaseCount=computed(()=>rows.value.filter(r=>r.status==='ok'&&r.changed&&r.delta<0).length), lowMarginCount=computed(()=>rows.value.filter(r=>r.status==='ok'&&r.changed&&r.proposed_margin<20).length), failedCount=computed(()=>rows.value.filter(r=>r.status!=='ok').length)
function matches(r:any,key:string){if(key==='all')return true;if(key==='changed')return r.status==='ok'&&r.changed&&!r.ignored;if(key==='increase')return r.status==='ok'&&r.changed&&r.delta>0&&!r.ignored;if(key==='decrease')return r.status==='ok'&&r.changed&&r.delta<0&&!r.ignored;if(key==='low_margin')return r.status==='ok'&&r.changed&&r.proposed_margin<20&&!r.ignored;if(key==='ignored')return !!r.ignored;if(key==='failed')return r.status!=='ok';return true}
const filteredRows=computed(()=>rows.value.filter(r=>matches(r,filter.value)))
const selectableVisible=computed(()=>filteredRows.value.filter(r=>r.status==='ok'&&r.changed&&!r.ignored).map(r=>String(r.row_key||r.product_id)))
const allVisibleSelected=computed(()=>selectableVisible.value.length>0&&selectableVisible.value.every(id=>selectedIds.value.includes(id)))
function filterCount(key:string){return rows.value.filter(r=>matches(r,key)).length}
function toggleAllVisible(){if(allVisibleSelected.value)selectedIds.value=selectedIds.value.filter(id=>!selectableVisible.value.includes(id));else selectedIds.value=[...new Set([...selectedIds.value,...selectableVisible.value])]}
async function scan(){busy.value=true;error.value='';rows.value=[];selectedIds.value=[];summary.value={checked:0,changed:0,total:0};try{let offset=0;do{const r:any=await adminFetch('/api/admin/products/supplier-sync/scan',{method:'POST',body:{offset,limit:6}});summary.value.total=Number(r.total||0);summary.value.checked+=Number(r.checked||0);summary.value.changed+=Number(r.changed||0);rows.value=[...rows.value,...(r.results||[])].sort((a:any,b:any)=>Number(b.changed)-Number(a.changed)||Math.abs(Number(b.delta||0))-Math.abs(Number(a.delta||0)));if(r.next_offset===null||r.next_offset===undefined)break;offset=Number(r.next_offset)}while(true)}catch(e:any){error.value=e?.data?.statusMessage||e?.data?.message||e?.statusMessage||e?.message||'Unable to sync supplier products'}finally{busy.value=false}}
function openApply(r:any){selected.value=r}
async function applyRow(r:any,recalculate:boolean){await adminFetch('/api/admin/products/supplier-sync/apply',{method:'POST',body:{product_id:r.product_id,variant_id:r.variant_id||null,link_id:r.link_id,buy_price_ex_gst:r.supplier_buy,supplier_rrp:r.supplier_rrp,recalculate}});r.current_buy=r.supplier_buy;r.delta=0;r.delta_percent=0;r.changed=false;r.ignored=false}
async function applyChange(recalculate:boolean){if(!selected.value)return;try{await applyRow(selected.value,recalculate);selected.value=null}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to apply supplier update'}}
async function setIgnored(r:any,ignored:boolean){await adminFetch('/api/admin/products/supplier-sync/review',{method:'POST',body:{product_id:r.product_id,variant_id:r.variant_id||null,link_id:r.link_id,supplier_buy:r.supplier_buy,ignored}});r.ignored=ignored;if(ignored)selectedIds.value=selectedIds.value.filter(id=>id!==String(r.row_key||r.product_id))}
async function ignoreRow(r:any){try{await setIgnored(r,true)}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to ignore change'}}
async function restoreRow(r:any){try{await setIgnored(r,false)}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to restore change'}}
async function ignoreSelected(){if(!selected.value)return;await ignoreRow(selected.value);selected.value=null}
async function bulkApply(recalculate:boolean){bulkBusy.value=true;error.value='';try{for(const id of [...selectedIds.value]){const r=rows.value.find(x=>String(x.row_key||x.product_id)===String(id));if(r)await applyRow(r,recalculate)}selectedIds.value=[]}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Bulk update stopped because an item failed'}finally{bulkBusy.value=false}}
async function bulkIgnore(){bulkBusy.value=true;error.value='';try{for(const id of [...selectedIds.value]){const r=rows.value.find(x=>String(x.row_key||x.product_id)===String(id));if(r)await setIgnored(r,true)}selectedIds.value=[]}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Bulk ignore stopped because an item failed'}finally{bulkBusy.value=false}}
</script>
<style scoped>
.card{@apply rounded-xl border border-slate-200 bg-white p-4}.card span{@apply block text-xs font-bold uppercase tracking-wide text-slate-500}.card strong{@apply mt-1 block text-xl font-black text-slate-900}.badge{@apply inline-flex rounded-full px-2.5 py-1 text-xs font-bold}.action{@apply rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40}.action-blue{@apply rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40}.action-muted{@apply rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40}
</style>
