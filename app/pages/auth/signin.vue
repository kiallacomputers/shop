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

        <div class="-mt-2 text-right">
          <NuxtLink
            to="/auth/forgot-password"
            class="kc-link text-sm font-semibold"
          >
            Forgot your password?
          </NuxtLink>
        </div>

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

<script setup lang="ts">
useSeoMeta({ robots: "noindex, nofollow" });
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

  // Only allow local application paths. In particular, reject protocol-relative
  // URLs (//example.com) and backslash variants so a login redirect can never
  // be turned into an external redirect.
  if (
    typeof redirect !== "string" ||
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\")
  ) {
    return "/";
  }

  return redirect;
});
const login = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await $fetch<{ access_token: string; refresh_token: string }>("/api/auth/signin", {
      method: "POST",
      body: { email: email.value.trim(), password: password.value },
    });
    const { error } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    if (error) throw error;
    password.value = "";
    await nextTick();
    await router.push(redirectTo.value);
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    errorMessage.value = error?.message || "Unable to sign in. Please check your email and password.";
  } finally { loading.value = false; }
};
</script>
