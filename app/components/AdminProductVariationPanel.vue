<template>
  <section class="rounded-xl border border-blue-100 bg-white p-3 sm:p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 class="font-bold text-slate-900">Product variations ({{ variants.length }})</h3>
      <NuxtLink :to="`/admin/products/${productId}/variants`" class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Manage variations</NuxtLink>
    </div>
    <p v-if="loading" class="text-sm text-slate-500">Loading variations…</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }} <button class="underline" @click="load">Retry</button></p>
    <p v-else-if="!variants.length" class="text-sm text-slate-500">No variations found.</p>
    <div v-else class="space-y-2">
      <div v-for="v in variants" :key="v.id" class="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-3 text-sm sm:grid-cols-6 sm:items-center">
        <div class="col-span-2 sm:col-span-1"><p class="break-words font-bold text-slate-900">{{ v.name }}</p><p class="break-all text-xs text-slate-500">{{ v.product_code }}</p></div>
        <div><p class="text-xs text-slate-500">Sell / RRP</p><p class="font-semibold">{{ money(v.price) }} / {{ money(v.old_price) }}</p></div>
        <div><p class="text-xs text-slate-500">Stock</p><p class="font-semibold">{{ v.stock ?? 0 }}</p></div>
        <div><p class="text-xs text-slate-500">Supplier VIC</p><p class="font-semibold">{{ v.leader_stock_vic ?? '—' }}</p></div>
        <div><p class="text-xs text-slate-500">Status</p><p class="font-semibold" :class="v.active === false ? 'text-slate-500' : 'text-emerald-700'">{{ v.active === false ? 'Disabled' : 'Active' }}</p></div>
        <div class="col-span-2 flex flex-wrap gap-2 sm:col-span-1"><NuxtLink :to="`/admin/products/${productId}/variants`" class="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-bold text-blue-700">Edit / Stock</NuxtLink><button type="button" :disabled="busy === String(v.id)" class="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-bold disabled:opacity-50" @click="toggle(v)">{{ v.active === false ? 'Enable' : 'Disable' }}</button></div>
      </div>
    </div>
    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
  </section>
</template>
<script setup lang="ts">
const props = defineProps<{ productId: string | number; adminFetch: (url: string, options?: any) => Promise<any> }>();
const emit = defineEmits<{ changed: [] }>();
type Variant = { id: string | number; name: string; product_code: string; price: number | null; old_price: number | null; stock: number; active: boolean; leader_stock_vic?: number | null };
const variants = ref<Variant[]>([]);
const loading = ref(true);
const error = ref('');
const actionError = ref('');
const busy = ref<string | null>(null);
const money = (v: any) => v == null ? '—' : new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(v));
const load = async () => { loading.value = true; error.value = ''; try { variants.value = await props.adminFetch(`/api/admin/products/${props.productId}/variants`) || []; } catch (e: any) { error.value = e?.data?.statusMessage || e?.message || 'Unable to load variations'; } finally { loading.value = false; } };
const toggle = async (v: Variant) => { const next = v.active === false; if (!window.confirm(`${next ? 'Enable' : 'Disable'} variation "${v.name}"?`)) return; busy.value = String(v.id); actionError.value = ''; try { await props.adminFetch(`/api/admin/products/${props.productId}/variants/${v.id}/status`, { method: 'PATCH', body: { active: next } }); v.active = next; emit('changed'); } catch (e: any) { actionError.value = e?.data?.statusMessage || e?.message || 'Unable to update variation'; } finally { busy.value = null; } };
onMounted(load);
</script>
