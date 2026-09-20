<template>
  <div class="kc-panel w-full p-6 sm:p-8 text-center">
    <p class="kc-eyebrow">Customer account</p>
    <h1 class="kc-title mt-1 text-3xl">Confirm Email Address</h1>

    <div v-if="checking" class="kc-alert kc-alert-info mt-6">
      Confirming your account…
    </div>

    <div v-else-if="errorMessage" class="mt-6">
      <div class="kc-alert kc-alert-error">{{ errorMessage }}</div>
      <NuxtLink to="/auth/signup" class="kc-btn-secondary mt-6 inline-flex">
        Create Account
      </NuxtLink>
    </div>

    <div v-else class="mt-6">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
      <h2 class="mt-4 text-xl font-black text-slate-900">Email Confirmed</h2>
      <p class="mt-2 text-sm text-slate-500">
        Your Kialla Computers account is ready. You can now sign in.
      </p>
      <NuxtLink to="/auth/signin" class="kc-btn-primary mt-6 inline-flex">
        Sign In
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ robots: "noindex, nofollow" });
definePageMeta({ layout: "auth" });

const supabase = useSupabaseClient();
const route = useRoute();

const checking = ref(true);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const tokenHash =
      typeof route.query.token_hash === "string" ? route.query.token_hash : "";

    if (!tokenHash) {
      throw new Error("The confirmation link is invalid or incomplete.");
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "signup",
    });

    if (error || !data.session) {
      throw error || new Error("The confirmation link is invalid or has expired.");
    }

    // Confirmation creates a session. End it so the customer signs in
    // normally with the password they chose during signup.
    await supabase.auth.signOut();
  } catch (error: any) {
    console.error("SIGNUP CONFIRM ERROR:", error);
    errorMessage.value =
      error?.message ||
      "Unable to confirm your account. The link may have expired.";
  } finally {
    checking.value = false;
  }
});
</script>
