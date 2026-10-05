<template>
  <div class="admin-page"><div class="admin-page-inner max-w-[1500px]">
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><NuxtLink to="/admin/products" class="text-sm font-semibold text-blue-600">← Manage Products</NuxtLink>
        <h1 class="mt-3 text-3xl font-bold text-slate-900">Supplier Price & Stock Sync</h1>
        <p class="mt-1 text-slate-500">Check Leader against your primary supplier records. Nothing changes until you approve it.</p></div>
      <button class="rounded-lg bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50" :disabled="busy" @click="scan">{{busy?`Checking Leader… ${summary?.checked||0}/${summary?.total||'?'}`:'Sync All Leader Products'}}</button>
    </div>
    <div v-if="error" class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{{error}}</div>
    <div v-if="summary" class="mb-5 grid gap-3 sm:grid-cols-3">
      <div class="card"><span>Products checked</span><strong>{{summary.checked}}</strong></div>
      <div class="card"><span>Price changes</span><strong>{{summary.changed}}</strong></div>
      <div class="card"><span>Unchanged</span><strong>{{Math.max(0,summary.checked-summary.changed)}}</strong></div>
    </div>
    <div v-if="rows.length" class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-[1100px] w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr>
        <th class="p-4 text-left">Product</th><th class="p-4 text-right">Current Buy</th><th class="p-4 text-right">Leader Buy</th><th class="p-4 text-right">Change</th><th class="p-4 text-center">Leader Stock</th><th class="p-4 text-right">Margin at Current Sell</th><th class="p-4 text-right">Action</th>
      </tr></thead><tbody>
        <tr v-for="r in rows" :key="r.product_id" class="border-t border-slate-100">
          <td class="p-4"><p class="font-bold text-slate-900">{{r.name}}</p><p class="text-xs text-slate-500">{{r.sku}}</p><p v-if="r.error" class="mt-1 text-xs font-semibold text-red-600">{{r.error}}</p></td>
          <template v-if="r.status==='ok'">
            <td class="p-4 text-right">{{money(r.current_buy)}}</td><td class="p-4 text-right font-bold">{{money(r.supplier_buy)}}</td>
            <td class="p-4 text-right"><span :class="r.delta>0?'text-red-600':r.delta<0?'text-emerald-600':'text-slate-500'" class="font-bold">{{signedMoney(r.delta)}} <small>({{signed(r.delta_percent)}}%)</small></span></td>
            <td class="p-4 text-center"><span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="r.supplier_stock>0?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'">{{r.supplier_stock}}</span><p class="mt-1 whitespace-nowrap text-[10px] text-slate-400">VIC {{r.stock_by_state?.VIC||0}} · NSW {{r.stock_by_state?.NSW||0}} · QLD {{r.stock_by_state?.QLD||0}} · SA {{r.stock_by_state?.SA||0}} · WA {{r.stock_by_state?.WA||0}}</p></td>
            <td class="p-4 text-right"><span class="font-black" :class="r.proposed_margin<10?'text-red-600':r.proposed_margin<20?'text-amber-600':'text-emerald-700'">{{r.proposed_margin.toFixed(1)}}%</span></td>
            <td class="p-4 text-right"><button v-if="r.changed" class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" :disabled="applying===r.product_id" @click="openApply(r)">Review & Apply</button><span v-else class="text-xs font-bold text-emerald-600">Up to date</span></td>
          </template><td v-else colspan="6" class="p-4 text-red-600">Unable to sync</td>
        </tr>
      </tbody></table>
    </div>
    <div v-else-if="summary&&!busy" class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No Leader-linked primary supplier products were found.</div>

    <Teleport to="body"><div v-if="selected" class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4" @click.self="selected=null">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 class="text-xl font-black text-slate-900">Apply supplier price?</h2><p class="mt-2 text-sm text-slate-500">{{selected.name}}</p>
        <div class="mt-4 grid grid-cols-2 gap-3"><div class="card"><span>Current buy</span><strong>{{money(selected.current_buy)}}</strong></div><div class="card"><span>New buy</span><strong>{{money(selected.supplier_buy)}}</strong></div></div>
        <label class="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-3"><input v-model="recalculate" type="checkbox" class="mt-1"><span><b class="block text-sm text-slate-900">Recalculate store Sell Price and RRP</b><small class="text-slate-500">Off by default. If left off, only the buy cost and supplier record change.</small></span></label>
        <div class="mt-6 flex justify-end gap-2"><button class="rounded-lg border px-4 py-2 font-bold" @click="selected=null">Cancel</button><button class="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white" @click="applyChange">Apply Update</button></div>
      </div></div></Teleport>
  </div></div>
</template>
<script setup lang="ts">
definePageMeta({layout: 'admin', middleware:'admin'})
const {adminFetch}=useAdminFetch()
const busy=ref(false), error=ref(''), rows=ref<any[]>([]), summary=ref<any>(null), selected=ref<any>(null), recalculate=ref(false), applying=ref<number|null>(null)
const money=(v:any)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(v||0))
const signedMoney=(v:any)=>(Number(v)>0?'+':'')+money(v)
const signed=(v:any)=>(Number(v)>0?'+':'')+Number(v||0).toFixed(2)
async function scan(){
  busy.value=true;error.value='';rows.value=[];summary.value={checked:0,changed:0,total:0}
  try{
    let offset=0
    do{
      const r:any=await adminFetch('/api/admin/products/supplier-sync/scan',{method:'POST',body:{offset,limit:6}})
      summary.value.total=Number(r.total||0)
      summary.value.checked+=Number(r.checked||0)
      summary.value.changed+=Number(r.changed||0)
      rows.value=[...rows.value,...(r.results||[])].sort((a:any,b:any)=>Number(b.changed)-Number(a.changed)||Math.abs(Number(b.delta||0))-Math.abs(Number(a.delta||0)))
      if(r.next_offset===null||r.next_offset===undefined)break
      offset=Number(r.next_offset)
    }while(true)
  }catch(e:any){error.value=e?.data?.statusMessage||e?.data?.message||e?.statusMessage||e?.message||'Unable to sync supplier products'}
  finally{busy.value=false}
}
function openApply(r:any){selected.value=r;recalculate.value=false}
async function applyChange(){if(!selected.value)return;applying.value=selected.value.product_id;try{await adminFetch('/api/admin/products/supplier-sync/apply',{method:'POST',body:{product_id:selected.value.product_id,link_id:selected.value.link_id,buy_price_ex_gst:selected.value.supplier_buy,recalculate:recalculate.value}});selected.value=null;await scan()}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to apply supplier update'}finally{applying.value=null}}
</script>
<style scoped>
.card{@apply rounded-xl border border-slate-200 bg-white p-4}.card span{@apply block text-xs font-bold uppercase tracking-wide text-slate-500}.card strong{@apply mt-1 block text-xl font-black text-slate-900}
</style>
