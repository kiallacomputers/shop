<template>
  <div class="w-full">
    <div class="kc-panel w-full p-6 sm:p-8">
      <p class="kc-eyebrow">Customer account</p>
      <h1 class="kc-title mt-1 text-3xl">Sign in</h1>
      <p class="mb-7 mt-2 text-sm text-slate-500">Manage your orders, delivery addresses, wishlist and account details.</p>

      <form class="space-y-5" @submit.prevent="login">
        <label>
          <span class="kc-field-label">Email address</span>
          <input v-model="email" type="email" autocomplete="email" class="w-full border px-4 py-3" required />
        </label>

        <label>
          <span class="kc-field-label">Password</span>
          <input v-model="password" type="password" autocomplete="current-password" class="w-full border px-4 py-3" required />
        </label>

        <div v-if="errorMessage" class="kc-alert kc-alert-error" role="alert">{{ errorMessage }}</div>

        <button type="submit" :disabled="loading" class="kc-btn-primary w-full min-h-[48px]">
          {{ loading ? "Signing in…" : "Sign in" }}
        </button>

        <p class="text-center text-sm text-slate-600">
          Don’t have an account?
          <NuxtLink to="/auth/signup" class="kc-link">Create one</NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({ robots: "noindex, nofollow" });
lang="ts">
definePageMeta({ layout: "auth" });
const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");
const redirectTo = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/";
});
const login = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
    if (error) { errorMessage.value = error.message; return; }
    await nextTick();
    await router.push(redirectTo.value);
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    errorMessage.value = error?.message || "Unable to sign in. Please check your email and password.";
  } finally { loading.value = false; }
};
</script>
