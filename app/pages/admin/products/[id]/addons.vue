<template>
  <main class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p class="text-sm font-bold uppercase tracking-wide text-blue-600">Product extras</p><h1 class="text-3xl font-black text-slate-900">Manage Add-ons</h1><p class="mt-2 text-slate-500">Create warranty, software, hardware upgrade and service options for this product.</p></div>
      <NuxtLink :to="`/admin/products/${productId}`" class="admin-btn-secondary">Back to Product</NuxtLink>
    </div>

    <div v-if="errorMessage" class="kc-alert kc-alert-error mt-6">{{ errorMessage }}</div>
    <div v-if="successMessage" class="kc-alert kc-alert-success mt-6">{{ successMessage }}</div>

    <div class="mt-7 space-y-5">
      <section v-for="(group, gi) in groups" :key="group.key" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-[1fr_180px_auto_auto] md:items-end">
          <label><span class="admin-field-label">Group name</span><input v-model="group.name" class="input" placeholder="e.g. Warranty" /></label>
          <label><span class="admin-field-label">Selection</span><select v-model="group.selection_type" class="input"><option value="multiple">Multiple choices</option><option value="single">One choice</option></select></label>
          <label class="flex min-h-[42px] items-center gap-2"><input v-model="group.required" type="checkbox" /> <span class="text-sm font-bold">Required</span></label>
          <button type="button" class="admin-btn-danger" @click="groups.splice(gi,1)">Remove</button>
        </div>

        <div class="mt-5 space-y-3">
          <div v-for="(option, oi) in group.options" :key="option.key" class="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_150px_auto] sm:items-end">
            <label><span class="admin-field-label">Option</span><input v-model="option.name" class="input" placeholder="e.g. 3-Year Extended Warranty" /></label>
            <label><span class="admin-field-label">Add price</span><input v-model.number="option.price" class="input" type="number" min="0" step="0.01" /></label>
            <button type="button" class="admin-btn-secondary" @click="group.options.splice(oi,1)">Remove</button>
          </div>
        </div>
        <button type="button" class="admin-btn-secondary mt-4" @click="addOption(group)">+ Add Option</button>
      </section>
    </div>

    <div class="admin-action-bar mt-6">
      <button type="button" class="admin-btn-secondary" @click="addGroup">+ Add Group</button>
      <button type="button" class="admin-btn-primary" :disabled="saving" @click="save">{{ saving ? "Saving..." : "Save Add-ons" }}</button>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
const route = useRoute();
const { adminFetch } = useAdminFetch();
const productId = computed(() => Number(route.params.id));
const groups = ref<any[]>([]);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const key = () => `${Date.now()}-${Math.random()}`;
const addOption = (group:any) => group.options.push({ key:key(), name:"", price:0, active:true });
const addGroup = () => groups.value.push({ key:key(), name:"", selection_type:"multiple", required:false, active:true, options:[] });

onMounted(async () => {
  try {
    const rows:any = await adminFetch(`/api/admin/products/${productId.value}/addons`);
    groups.value = (rows || []).map((g:any) => ({ ...g, key:key(), options:(g.product_addon_options || []).map((o:any)=>({...o,key:key()})) }));
  } catch (e:any) { errorMessage.value = e?.data?.statusMessage || e?.message || "Unable to load add-ons."; }
});
const save = async () => {
  saving.value=true; errorMessage.value=""; successMessage.value="";
  try {
    await adminFetch(`/api/admin/products/${productId.value}/addons`, { method:"PUT", body:{ groups:groups.value }});
    successMessage.value="Product add-ons saved.";
  } catch(e:any) { errorMessage.value=e?.data?.statusMessage || e?.message || "Unable to save add-ons."; }
  finally { saving.value=false; }
};
</script>

<style scoped>
.input{width:100%;border-radius:.5rem;border:1px solid rgb(203 213 225);background:white;padding:.625rem .75rem;color:rgb(15 23 42);outline:none}
.input:focus{border-color:rgb(59 130 246);box-shadow:0 0 0 3px rgb(219 234 254)}
</style>
