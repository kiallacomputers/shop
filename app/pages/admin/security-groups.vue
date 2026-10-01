<template>
  <main>
    <div class="mb-8">
      <p class="text-sm font-bold uppercase tracking-wide text-violet-600">Administration</p>
      <h1 class="mt-1 text-3xl font-black text-slate-900">Security Groups</h1>
      <p class="mt-2 text-slate-500">Build precise Admin access. Select only the pages and actions a group needs. SuperAdmins always retain full access and existing ungrouped Admin accounts keep Legacy Full Access.</p>
    </div>

    <div v-if="message" class="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">{{ message }}</div>
    <div v-if="error" class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{{ error }}</div>

    <section class="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><h2 class="text-xl font-black">{{ editId ? 'Edit Security Group' : 'Create Security Group' }}</h2><p class="mt-1 text-sm text-slate-500">Permissions are enforced by the server APIs as well as the Admin menu.</p></div>
        <button v-if="editId" class="admin-btn-secondary" @click="resetForm">Cancel edit</button>
      </div>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <label class="text-sm font-bold text-slate-700">Group name<input v-model="form.name" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" maxlength="80" /></label>
        <label class="text-sm font-bold text-slate-700">Description<input v-model="form.description" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" maxlength="500" /></label>
      </div>

      <div class="mt-6 space-y-3">
        <div v-for="section in permissionSections" :key="section.key" class="overflow-hidden rounded-xl border border-slate-200">
          <button type="button" class="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left" @click="toggleSection(section.key)">
            <span><strong class="text-slate-900">{{ section.label }}</strong><span class="ml-2 text-xs font-semibold text-slate-500">{{ selectedCount(section) }}/{{ section.items.length }} selected</span></span>
            <span class="font-bold text-slate-500">{{ openSections.has(section.key) ? '−' : '+' }}</span>
          </button>
          <div v-if="openSections.has(section.key)" class="p-4">
            <div class="mb-3 flex gap-2"><button type="button" class="admin-btn-secondary !px-3 !py-1.5 text-xs" @click="setSection(section,true)">Select all</button><button type="button" class="admin-btn-secondary !px-3 !py-1.5 text-xs" @click="setSection(section,false)">Clear all</button></div>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label v-for="item in section.items" :key="item.key" class="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <input v-model="form.permissions[item.key]" type="checkbox" class="mt-0.5 h-4 w-4" />
                <span><strong class="block text-sm text-slate-800">{{ item.label }}</strong><small v-if="item.help" class="text-slate-500">{{ item.help }}</small></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-5 flex justify-end"><button class="admin-btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : (editId ? 'Save Changes' : 'Create Group') }}</button></div>
    </section>

    <section class="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-black">Groups</h2>
      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <div v-for="g in groups" :key="g.id" class="rounded-xl border border-slate-200 p-4">
          <div class="flex justify-between gap-3"><div><h3 class="font-black">{{ g.name }}</h3><p class="text-sm text-slate-500">{{ g.description || 'No description' }}</p></div><div class="flex gap-2"><button class="admin-btn-secondary" @click="edit(g)">Edit</button><button class="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600" @click="remove(g)">Delete</button></div></div>
          <div class="mt-3 flex flex-wrap gap-2"><span v-for="s in permissionSections" :key="s.key" class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{{ s.label }} {{ groupCount(g,s) }}/{{ s.items.length }}</span></div>
        </div>
        <p v-if="!groups.length" class="text-slate-500">No security groups yet.</p>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-black">Administrator Access</h2><p class="mt-1 text-sm text-slate-500">Assign Admin accounts to a group. Legacy Full Access preserves the access they had before security groups were introduced.</p>
      <div class="mt-4 overflow-x-auto"><table class="w-full text-left text-sm"><thead><tr class="border-b"><th class="p-3">Administrator</th><th class="p-3">Role</th><th class="p-3">Security Group</th></tr></thead><tbody><tr v-for="a in admins" :key="a.id" class="border-b border-slate-100"><td class="p-3 font-semibold">{{ a.email }}</td><td class="p-3">{{ a.role }}</td><td class="p-3"><span v-if="a.role==='superadmin'" class="font-bold text-violet-700">Full Access (SuperAdmin)</span><select v-else :value="a.security_group_id||''" class="min-w-56 rounded-lg border border-slate-300 px-3 py-2" @change="assign(a,($event.target as HTMLSelectElement).value)"><option value="">Legacy Full Access</option><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select></td></tr></tbody></table></div>
    </section>
  </main>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin'});
const {adminFetch}=useAdminFetch();
const permissionSections=[
 {key:'product',label:'Product',items:[['product.view','View Products'],['product.create','Create Products'],['product.edit','Edit Products'],['product.delete','Delete Products'],['product.pricing','Change Product Pricing'],['product.categories','Manage Categories'],['product.stock','Bulk Stock Levels'],['product.reorder','Reorder Centre'],['product.stocktake','Stocktake'],['product.reviews','Product Reviews'],['product.back_in_stock','Back in Stock'],['product.data_health','Product Data Health']]},
 {key:'sales',label:'Sales',items:[['sales.orders.view','View Orders'],['sales.orders.manage','Process / Edit Orders'],['sales.customers.view','View Customers'],['sales.customers.manage','Edit Customers'],['sales.quotes.view','View Manual Quotes'],['sales.quotes.manage','Create / Edit / Send Quotes'],['sales.quotes.delete','Delete Quotes'],['sales.quote_requests','Quote Requests']]},
 {key:'purchase',label:'Purchase',items:[['purchase.suppliers.view','View Suppliers'],['purchase.suppliers.manage','Manage Suppliers'],['purchase.orders.view','View Purchase Orders'],['purchase.orders.create_edit','Create / Edit Draft POs'],['purchase.orders.approve','Approve Purchase Orders'],['purchase.orders.place','Send / Mark as Ordered'],['purchase.orders.cancel','Cancel Purchase Orders'],['purchase.orders.close','Close POs'],['purchase.orders.delete_unapproved','Delete Unapproved POs'],['purchase.receive_stock','Receive Stock'],['purchase.supplier_bills','Supplier Bills & Payments'],['purchase.inventory','Inventory & COGS'],['purchase.stock_intelligence','Stock Intelligence']]},
 {key:'accounting',label:'Accounting',items:[['accounting.dashboard','Accounting Dashboard'],['accounting.invoices','Sales & Invoices'],['accounting.receivables','Accounts Receivable'],['accounting.payables','Accounts Payable'],['accounting.bank_reconciliation','Bank Reconciliation'],['accounting.accounts','Chart of Accounts'],['accounting.journals','General Journals'],['accounting.financial_statements','Financial Statements'],['accounting.cash_flow','Cash Flow'],['accounting.reports','Accounting Reports'],['accounting.period_close','Period Close'],['accounting.year_end','Year End Export']]},
 {key:'administration',label:'Administration',items:[['administration.chat','Live Chat'],['administration.admin_accounts','Admin Accounts'],['administration.security_groups','Security Groups'],['administration.security_centre','Security Centre'],['administration.storage_cleanup','Storage Cleanup']]},
 {key:'business',label:'Business',items:[['business.ads','Advertisements'],['business.freight','Freight & Pickup'],['business.pricing_levels','Pricing Levels'],['business.abandoned_carts','Abandoned Carts'],['business.analytics','Analytics'],['business.reports','Business Reports'],['business.marketing_seo','Marketing & SEO'],['business.google_shopping','Google Shopping'],['business.google_performance','Google Performance'],['business.google_search','Google Search'],['business.google_api','Google API Setup'],['business.facebook','Facebook Share']]},
].map(s=>({...s,items:s.items.map(([key,label])=>({key,label}))}));
const allKeys=permissionSections.flatMap(s=>s.items.map(i=>i.key));
const blank=()=>({name:'',description:'',permissions:Object.fromEntries(allKeys.map(k=>[k,false]))});
const form=reactive<any>(blank()); const groups=ref<any[]>([]); const admins=ref<any[]>([]); const editId=ref<string|null>(null); const saving=ref(false); const message=ref(''); const error=ref(''); const openSections=reactive(new Set<string>(['product']));
const toggleSection=(k:string)=>openSections.has(k)?openSections.delete(k):openSections.add(k); const selectedCount=(s:any)=>s.items.filter((i:any)=>form.permissions[i.key]).length; const setSection=(s:any,v:boolean)=>s.items.forEach((i:any)=>form.permissions[i.key]=v); const groupCount=(g:any,s:any)=>s.items.filter((i:any)=>g.permissions?.[i.key]===true || g.permissions?.[s.key]===true).length;
const load=async()=>{const r:any=await adminFetch('/api/admin/security-groups');groups.value=r.groups||[];admins.value=r.admins||[]};
const resetForm=()=>{editId.value=null;Object.assign(form,blank())};
const edit=(g:any)=>{editId.value=g.id;form.name=g.name;form.description=g.description||'';const perms=blank().permissions;for(const s of permissionSections)for(const i of s.items)perms[i.key]=g.permissions?.[i.key]===true||g.permissions?.[s.key]===true;form.permissions=perms;for(const s of permissionSections)if(groupCount(g,s))openSections.add(s.key);window.scrollTo({top:0,behavior:'smooth'})};
const save=async()=>{error.value='';message.value='';if(!form.name.trim()){error.value='Group name is required.';return}saving.value=true;try{const url=editId.value?`/api/admin/security-groups/${editId.value}`:'/api/admin/security-groups';await adminFetch(url,{method:editId.value?'PUT':'POST',body:{name:form.name,description:form.description,permissions:form.permissions}});message.value=editId.value?'Security group updated.':'Security group created.';resetForm();await load()}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to save group.'}finally{saving.value=false}};
const remove=async(g:any)=>{if(!confirm(`Delete security group “${g.name}”?`))return;try{await adminFetch(`/api/admin/security-groups/${g.id}`,{method:'DELETE'});message.value='Security group deleted.';await load()}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to delete group.'}};
const assign=async(a:any,id:string)=>{try{await adminFetch('/api/admin/security-groups/assign',{method:'PUT',body:{user_id:a.id,security_group_id:id||null}});message.value=`Access updated for ${a.email}.`;await load()}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to assign group.';await load()}};
onMounted(load);
</script>
