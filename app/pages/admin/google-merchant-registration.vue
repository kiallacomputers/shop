<template>
<div class="space-y-6">
  <div>
    <p class="text-xs font-black uppercase tracking-wider text-blue-600">Marketing</p>
    <h1 class="mt-1 text-3xl font-black">Google Merchant API Setup</h1>
    <p class="mt-1 text-slate-500">One-time developer registration linking this site's Google Cloud project to Merchant Center.</p>
  </div>

  <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{{error}}</div>
  <div v-if="success" class="rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-800">{{success}}</div>

  <section class="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <div><div class="text-xs font-black uppercase text-slate-500">Merchant ID</div><div class="mt-1 font-bold">{{status?.merchant_id||"Loading…"}}</div></div>
      <div><div class="text-xs font-black uppercase text-slate-500">Registration</div>
        <div class="mt-1 font-bold" :class="status?.registered?'text-green-700':'text-amber-700'">{{status?.registered?"Registered":"Not confirmed"}}</div></div>
    </div>

    <div>
      <label class="block text-sm font-black mb-2">Developer contact email</label>
      <input v-model.trim="developerEmail" class="input w-full" type="email" placeholder="Your human Google Account email"/>
      <p class="mt-2 text-xs text-slate-500">Use a real Google Account that can receive Merchant API notices. Do not use the service-account address.</p>
    </div>

    <div v-if="status?.google_message && !status?.registered" class="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
      <b>Google status:</b> {{status.google_message}}
    </div>

    <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      This is a one-time Google account configuration action. It links the Google Cloud project used by this site to Merchant Center and assigns the developer contact for API communications.
    </div>

    <button v-if="!status?.registered" class="btn-primary" :disabled="busy||!developerEmail" @click="confirming=true">
      {{busy?"Registering…":"Register Google Merchant API"}}
    </button>
    <NuxtLink v-else to="/admin/google-performance" class="btn-primary inline-flex">Open Google Performance</NuxtLink>
  </section>

  <div v-if="confirming" class="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4">
    <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
      <h2 class="text-xl font-black">Register this Google Cloud project?</h2>
      <p class="mt-3 text-sm text-slate-600">Merchant Center: <b>{{status?.merchant_id}}</b><br/>Developer contact: <b>{{developerEmail}}</b></p>
      <p class="mt-3 text-sm text-slate-600">This only needs to be done once for this Google Cloud project.</p>
      <div class="mt-6 flex justify-end gap-2"><button class="btn-secondary" @click="confirming=false">Cancel</button><button class="btn-primary" @click="register">Yes, Register</button></div>
    </div>
  </div>
</div>
</template>
<script setup lang="ts">
definePageMeta({layout:"admin",middleware:["admin"]});
const {adminFetch}=useAdminFetch();
const status=ref<any>(null),developerEmail=ref(""),error=ref(""),success=ref(""),busy=ref(false),confirming=ref(false);
async function load(){
  error.value="";
  try{
    status.value=await adminFetch("/api/admin/google-merchant-registration");
    if(!developerEmail.value) developerEmail.value=status.value?.developer_email||"";
  }catch(e:any){error.value=e?.data?.statusMessage||e?.data?.message||e?.statusMessage||e?.message||"Unable to check Merchant API registration."}
}
async function register(){
  confirming.value=false;busy.value=true;error.value="";success.value="";
  try{
    const r:any=await adminFetch("/api/admin/google-merchant-registration/register",{method:"POST",body:{developerEmail:developerEmail.value}});
    success.value=r?.message||"Google Merchant API registration completed.";
    await load();
  }catch(e:any){error.value=e?.data?.statusMessage||e?.data?.message||e?.statusMessage||e?.message||"Registration failed."}
  finally{busy.value=false}
}
onMounted(load);
</script>
