<template>
  <div class="w-full">
    <div class="kc-panel w-full p-6 sm:p-8">
      <p class="kc-eyebrow">Customer account</p>
      <h1 class="kc-title mt-1 text-3xl">Sign in</h1>
      <p class="mb-7 mt-2 text-sm text-slate-500">Manage your orders, delivery addresses, wishlist and account details.</p>

      <div
        v-if="loginSuccessful"
        class="flex min-h-[285px] flex-col items-center justify-center text-center"
        role="status"
        aria-live="polite"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700">
          ✓
        </div>
        <h2 class="mt-5 text-xl font-black text-slate-900">Signed in successfully</h2>
        <p class="mt-2 text-sm font-medium text-slate-500">{{ successRedirectMessage }}</p>
        <div class="mt-5 h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" aria-hidden="true"></div>
      </div>

      <form v-else class="space-y-5" @submit.prevent="login">
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
const loginSuccessful = ref(false);
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

const successRedirectMessage = computed(() =>
  redirectTo.value.startsWith("/admin")
    ? "Taking you back to Admin…"
    : "Taking you to the store…"
);
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

    // Authentication is complete. Immediately replace the login form so the
    // customer gets clear feedback while Nuxt finishes the page transition.
    password.value = "";
    loginSuccessful.value = true;
    await nextTick();
    await router.push(redirectTo.value);
  } catch (error: any) {
    loginSuccessful.value = false;

    // Keep the technical error in the browser console for troubleshooting,
    // but never expose raw API/Nuxt errors to the customer.
    console.error("LOGIN ERROR:", error);

    const status = Number(
      error?.statusCode ||
      error?.status ||
      error?.response?.status ||
      error?.data?.statusCode ||
      0
    );

    const serverMessage = String(
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.statusMessage ||
      ""
    ).toLowerCase();

    if (
      status === 401 ||
      status === 422 ||
      serverMessage.includes("incorrect") ||
      serverMessage.includes("invalid login") ||
      serverMessage.includes("invalid credentials")
    ) {
      errorMessage.value =
        "The email address or password you entered is incorrect. Please check your details and try again.";
    } else if (
      status === 429 ||
      serverMessage.includes("rate limit") ||
      serverMessage.includes("too many")
    ) {
      errorMessage.value =
        "Too many sign-in attempts. Please wait a few minutes and try again.";
    } else if (
      serverMessage.includes("email not confirmed") ||
      serverMessage.includes("email not verified")
    ) {
      errorMessage.value =
        "Please verify your email address before signing in.";
    } else if (status >= 500) {
      errorMessage.value =
        "We couldn't sign you in right now. Please try again shortly.";
    } else {
      errorMessage.value =
        "Unable to sign in. Please check your details and try again.";
    }
  } finally {
    loading.value = false;
  }
};
</script>
