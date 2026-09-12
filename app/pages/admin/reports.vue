<template>
  <main class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-800">← Admin Dashboard</NuxtLink><p class="mt-4 text-sm font-semibold uppercase tracking-wider text-violet-600">SuperAdmin</p><h1 class="mt-1 text-3xl font-bold text-slate-900">Business Reports</h1><p class="mt-2 text-slate-500">Sales, orders, products, customers, inventory and GST reporting.</p></div>
      <span class="self-start rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">SuperAdmin only</span>
    </div>

    <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
        <label class="text-sm font-semibold text-slate-700">Period<select v-model="preset" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" @change="applyPreset"><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="lastMonth">Last Month</option><option value="quarter">This Quarter</option><option value="fy">Financial Year</option><option value="custom">Custom</option></select></label>
        <label class="text-sm font-semibold text-slate-700">From<input v-model="start" type="date" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" @change="preset='custom'" /></label>
        <label class="text-sm font-semibold text-slate-700">To<input v-model="end" type="date" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" @change="preset='custom'" /></label>
        <button class="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700" @click="load">Run Report</button>
      </div>
    </section>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading reports…</div>
    <div v-else-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{{ errorMessage }}</div>
    <template v-else-if="report">
      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><div v-for="card in summaryCards" :key="card.label" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ card.value }}</p></div></div>

      <div class="mb-5 flex flex-wrap gap-2"><button v-for="t in tabs" :key="t.key" class="rounded-full px-4 py-2 text-sm font-semibold" :class="tab===t.key?'bg-slate-900 text-white':'bg-white text-slate-700 border border-slate-200'" @click="tab=t.key">{{ t.label }}</button></div>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-lg font-bold text-slate-900">{{ activeTab.label }}</h2><p class="text-sm text-slate-500">{{ activeTab.description }}</p></div><button class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" @click="exportCsv">Export CSV</button></div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th v-for="c in columns" :key="c.key" class="px-4 py-3">{{ c.label }}</th></tr></thead>
            <tbody class="divide-y divide-slate-100"><tr v-for="(row,i) in rows" :key="i" class="hover:bg-slate-50"><td v-for="c in columns" :key="c.key" class="whitespace-nowrap px-4 py-3 text-slate-700"><NuxtLink v-if="c.link && linkFor(row,c.link)" :to="linkFor(row,c.link)!" class="font-semibold text-blue-600 hover:underline">{{ display(row,c) }}</NuxtLink><span v-else>{{ display(row,c) }}</span></td></tr><tr v-if="!rows.length"><td :colspan="columns.length" class="px-4 py-10 text-center text-slate-500">No records for this period.</td></tr></tbody>
          </table>
        </div>
      </section>
      <p class="mt-4 text-xs text-slate-500">Estimated gross profit uses current Buy Price ex GST and does not deduct freight, payment fees or other business overheads. GST is calculated from GST-inclusive order totals.</p>
    </template>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth", "admin", "superadmin"] });
const { adminFetch } = useAdminFetch();
const report = ref<any>(null); const loading = ref(false); const errorMessage = ref(""); const tab = ref("sales"); const preset = ref("month");
const localDate = (d: Date) => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; };
const start=ref(""); const end=ref("");
const tabs=[{key:"sales",label:"Sales & GST",description:"Order-level sales, GST and revenue."},{key:"gst",label:"GST Report",description:"GST summary for the selected period."},{key:"orders",label:"Orders",description:"All orders created in the selected period."},{key:"products",label:"Product Sales",description:"Units, revenue and estimated profit by product."},{key:"customers",label:"Customers",description:"Customer spend, order count and average order value."},{key:"inventory",label:"Inventory",description:"Current stock quantity, cost and stock value."}];
const activeTab=computed(()=>tabs.find(x=>x.key===tab.value)||tabs[0]);
const columnSets:any={
 sales:[{key:"id",label:"Order",link:"order"},{key:"created_at",label:"Date",type:"date"},{key:"customer_name",label:"Customer"},{key:"status",label:"Status"},{key:"total",label:"Revenue",type:"money"}],
 gst:[{key:"period",label:"Period"},{key:"revenue",label:"GST-Inclusive Sales",type:"money"},{key:"sales_ex_gst",label:"Sales ex GST",type:"money"},{key:"gst",label:"GST Collected",type:"money"}],
 orders:[{key:"id",label:"Order",link:"order"},{key:"created_at",label:"Date",type:"date"},{key:"customer_name",label:"Customer"},{key:"customer_email",label:"Email"},{key:"status",label:"Status"},{key:"shipping_cost",label:"Delivery",type:"money"},{key:"total",label:"Total",type:"money"}],
 products:[{key:"name",label:"Product",link:"product"},{key:"variant_name",label:"Variant"},{key:"code",label:"Code"},{key:"quantity",label:"Qty Sold"},{key:"orders",label:"Orders"},{key:"revenue",label:"Revenue",type:"money"},{key:"estimated_profit_ex_gst",label:"Est. Profit ex GST",type:"money"}],
 customers:[{key:"name",label:"Customer",link:"customer"},{key:"business_name",label:"Business"},{key:"email",label:"Email"},{key:"pricing_level",label:"Pricing"},{key:"orders",label:"Orders"},{key:"spend",label:"Spend",type:"money"},{key:"average_order",label:"Avg Order",type:"money"},{key:"last_purchase",label:"Last Purchase",type:"date"}],
 inventory:[{key:"name",label:"Product",link:"product"},{key:"variant_name",label:"Variant"},{key:"code",label:"Code"},{key:"category",label:"Category"},{key:"stock",label:"Stock"},{key:"buy_price_ex_gst",label:"Buy ex GST",type:"money"},{key:"stock_value_ex_gst",label:"Stock Value",type:"money"},{key:"status",label:"Status"}],
};
const columns=computed(()=>columnSets[tab.value]);
const rows=computed(()=>{if(tab.value==="sales")return report.value?.orders?.filter((x:any)=>x.revenue_order)||[];if(tab.value==="gst"&&report.value)return [{period:`${report.value.range.start} to ${report.value.range.end}`,...report.value.summary}];return report.value?.[tab.value]||[];});
const currency=(v:any)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
const summaryCards=computed(()=>report.value?[{label:"Revenue",value:currency(report.value.summary.revenue)},{label:"Orders",value:String(report.value.summary.orders)},{label:"Sales ex GST",value:currency(report.value.summary.sales_ex_gst)},{label:"GST",value:currency(report.value.summary.gst)},{label:"Est. Gross Profit",value:currency(report.value.summary.estimated_gross_profit_ex_gst)},{label:"Average Order",value:currency(report.value.summary.average_order)}]:[]);
const display=(r:any,c:any)=>c.type==="money"?currency(r[c.key]):c.type==="date"&&r[c.key]?new Date(r[c.key]).toLocaleDateString("en-AU"):String(r[c.key]??"");
const linkFor=(r:any,type:string)=>type==="order"?`/admin/orders/${r.id}`:type==="product"?`/admin/products/${r.product_id}`:type==="customer"&&r.user_id?`/admin/accounts/${r.user_id}`:null;
function applyPreset(){ const now=new Date(), s=new Date(now), e=new Date(now); if(preset.value==="today"){} else if(preset.value==="week"){s.setDate(now.getDate()-((now.getDay()+6)%7));} else if(preset.value==="month"){s.setDate(1);} else if(preset.value==="lastMonth"){s.setMonth(now.getMonth()-1,1);e.setDate(0);} else if(preset.value==="quarter"){s.setMonth(Math.floor(now.getMonth()/3)*3,1);} else if(preset.value==="fy"){s.setFullYear(now.getMonth()<6?now.getFullYear()-1:now.getFullYear(),6,1);} else return; start.value=localDate(s);end.value=localDate(e);load(); }
async function load(){loading.value=true;errorMessage.value="";try{report.value=await adminFetch(`/api/admin/reports?start=${start.value}&end=${end.value}`);}catch(e:any){errorMessage.value=e?.data?.statusMessage||e?.statusMessage||e?.message||"Unable to load reports.";}finally{loading.value=false;}}
function csvEscape(v:any){const s=String(v??"");return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
function exportCsv(){const data=rows.value;const cols=columns.value;const lines=[cols.map((c:any)=>csvEscape(c.label)).join(","),...data.map((r:any)=>cols.map((c:any)=>csvEscape(c.type==="money"?Number(r[c.key]||0):c.type==="date"&&r[c.key]?new Date(r[c.key]).toLocaleString("en-AU"):r[c.key])).join(","))];const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`kialla-${tab.value}-${start.value}-to-${end.value}.csv`;a.click();URL.revokeObjectURL(url);}
onMounted(applyPreset);
</script>

