<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <NuxtLink to="/admin/products" class="text-sm font-medium text-blue-700 hover:underline">← Products</NuxtLink>
    <h1 class="mt-4 text-3xl font-bold text-slate-900">Add Product</h1>
    <p class="mt-1 text-slate-600">Start with the basics, then complete the product when you're ready.</p>
    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <button type="button" class="rounded-2xl border-2 p-5 text-left shadow-sm transition" :class="entryMode === 'quick' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'" @click="entryMode = 'quick'">
        <span class="block text-lg font-bold">⚡ Quick Create</span><span class="mt-2 block text-sm text-slate-600">Just a name, optional category, cost and stock. Saves as an unpublished draft.</span>
      </button>
      <button type="button" class="rounded-2xl border-2 p-5 text-left shadow-sm transition" :class="entryMode === 'full' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'" @click="entryMode = 'full'">
        <span class="block text-lg font-bold">🛠️ Full Product Setup</span><span class="mt-2 block text-sm text-slate-600">Use the existing detailed editor for products requiring more setup.</span>
      </button>
    </div>
    <div v-if="entryMode === 'quick'" class="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div v-if="errorMessage" role="alert" class="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{{ errorMessage }}</div>
      <form class="space-y-5" @submit.prevent="createQuickProduct">
        <label class="block"><span class="mb-1 block text-sm font-semibold">Product Name *</span><input v-model.trim="form.name" required maxlength="200" class="input" placeholder="e.g. Logitech M185 Wireless Mouse" /></label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="block"><span class="mb-1 block text-sm font-semibold">Category (optional)</span><select v-model="form.category_id" class="input"><option value="">Uncategorised</option><optgroup v-for="group in groupedCategories" :key="group.id" :label="group.name"><option v-for="child in group.children" :key="child.id" :value="String(child.id)">{{ child.name }}</option></optgroup></select></label>
          <label class="block"><span class="mb-1 block text-sm font-semibold">Product Code (optional)</span><input v-model.trim="form.product_code" class="input" placeholder="Automatically generated if blank" /></label>
          <label class="block"><span class="mb-1 block text-sm font-semibold">Buy Price (ex GST)</span><input v-model.number="form.buy_price_ex_gst" class="input" type="number" min="0" step="0.01" /></label>
          <label class="block"><span class="mb-1 block text-sm font-semibold">Stock Quantity</span><input v-model.number="form.stock" class="input" type="number" min="0" step="1" /></label>
        </div>
        <label class="block"><span class="mb-1 block text-sm font-semibold">Short Description (optional)</span><textarea v-model="form.blurb" class="input" rows="3" placeholder="What do you know about this product?"></textarea></label>
        <div class="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">This product will be created <strong>inactive</strong>. Add images, review pricing and finish the description before publishing.</div>
        <div class="flex flex-wrap items-center justify-end gap-3"><NuxtLink to="/admin/products" class="admin-btn-secondary">Cancel</NuxtLink><button type="submit" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Creating…' : 'Create Draft & Edit →' }}</button></div>
      </form>
    </div>
    <div v-else class="mt-6"><ProductAdminForm mode="create" /></div>
  </div>
</template>
<script setup lang="ts">
import ProductAdminForm from '~/components/ProductAdminForm.vue'
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { adminFetch } = useAdminFetch()
const router = useRouter()
const entryMode = ref<'quick' | 'full'>('quick')
const saving = ref(false)
const errorMessage = ref('')
const form = reactive({ name: '', category_id: '', product_code: '', buy_price_ex_gst: 0, stock: 0, blurb: '' })
const categories = ref<any[]>([])
const groupedCategories = computed(() => categories.value.filter((c:any) => c.parent_id == null).map((parent:any) => ({ ...parent, children: categories.value.filter((c:any) => String(c.parent_id) === String(parent.id)) })).filter((group:any) => group.children.length))
onMounted(async () => { try { const rows = await adminFetch('/api/admin/categories'); categories.value = Array.isArray(rows) ? rows : [] } catch { /* Category selection is optional. */ } })
async function createQuickProduct() {
  if (saving.value) return
  errorMessage.value = ''
  saving.value = true
  try {
    const product:any = await adminFetch('/api/admin/products', { method: 'POST', body: { ...form, quick_create: true, category_id: form.category_id || null } })
    if (!product?.id) throw new Error('Product was created but no product ID was returned. Check Products before trying again.')
    await router.push(`/admin/products/${product.id}`)
  } catch (error:any) { errorMessage.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Unable to create product.' }
  finally { saving.value = false }
}
</script>
<style scoped>.input{display:block;width:100%;border:1px solid #cbd5e1;border-radius:.6rem;padding:.65rem .85rem;background:white;color:#0f172a}.input:focus{outline:2px solid #2563eb;outline-offset:1px}</style>
