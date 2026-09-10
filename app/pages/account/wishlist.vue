<template>
  <main class="kc-page">
    <div class="mb-8">
      <NuxtLink to="/account" class="text-sm font-semibold text-blue-600 hover:text-blue-700">← My Account</NuxtLink>
      <p class="kc-eyebrow mt-4">Saved products</p>
      <h1 class="kc-title mt-1 text-3xl">My Wishlist</h1>
      <p class="mt-2 text-slate-500">Products you have saved for later.</p>
    </div>

    <div v-if="loading" class="kc-panel p-10 text-center text-slate-500">Loading your wishlist...</div>
    <div v-else-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{{ errorMessage }}</div>
    <div v-else-if="!products.length" class="kc-panel p-10 text-center">
      <h2 class="text-xl font-bold text-slate-900">Your wishlist is empty</h2>
      <p class="mt-2 text-slate-500">Save products while you browse and they will appear here.</p>
      <NuxtLink to="/" class="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Browse Products</NuxtLink>
    </div>
    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const supabase = useSupabaseClient();
const { applyToProducts } = useCustomerPricing();
const { load: loadWishlistState } = useWishlist();
const products = ref<any[]>([]);
const loading = ref(true);
const errorMessage = ref("");

async function authFetch<T = any>(url: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("You must be signed in.");
  return await $fetch<T>(url, { headers: { Authorization: `Bearer ${session.access_token}` } });
}

async function loadWishlist() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await authFetch<any>("/api/account/wishlist");
    products.value = result?.products || [];
    await applyToProducts(products.value);
    products.value = products.value.map((p: any) => ({ ...p }));
    await loadWishlistState(true);
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to load your wishlist.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadWishlist);
</script>
