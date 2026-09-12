<script setup lang="ts">
useSeoMeta({ robots: "noindex, nofollow" });
definePageMeta({ layout: "auth" });
const supabase = useSupabaseClient();
const loading = ref(false);
const form = reactive({ fullName: "", email: "", password: "" });
const errorMessage = ref("");
const successMessage = ref("");
const signUp = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { data: { display_name: form.fullName.trim() } },
    });
    if (error) { errorMessage.value = error.message; return; }
    successMessage.value = "Your account has been created. Check your email to verify your account before signing in.";
  } catch (error: any) {
    errorMessage.value = error?.message || "Unable to create your account right now.";
  } finally { loading.value = false; }
};
</script>

<template>
  <div class="kc-panel w-full p-6 sm:p-8">
    <p class="kc-eyebrow">Customer account</p>
    <h1 class="kc-title mt-1 text-3xl">Create account</h1>
    <p class="mb-7 mt-2 text-sm text-slate-500">Create an account to save addresses, track orders and keep a wishlist.</p>

    <form class="space-y-5" @submit.prevent="signUp">
      <label><span class="kc-field-label">Full name</span><input v-model="form.fullName" type="text" autocomplete="name" required class="w-full border px-4 py-3" /></label>
      <label><span class="kc-field-label">Email address</span><input v-model="form.email" type="email" autocomplete="email" required class="w-full border px-4 py-3" /></label>
      <label><span class="kc-field-label">Password</span><input v-model="form.password" type="password" autocomplete="new-password" required minlength="8" class="w-full border px-4 py-3" /><span class="mt-1.5 block text-xs text-slate-500">Use at least 8 characters.</span></label>

      <div v-if="errorMessage" class="kc-alert kc-alert-error" role="alert">{{ errorMessage }}</div>
      <div v-if="successMessage" class="kc-alert kc-alert-success" role="status">{{ successMessage }}</div>

      <button type="submit" :disabled="loading || !!successMessage" class="kc-btn-primary w-full min-h-[48px]">{{ loading ? "Creating account…" : successMessage ? "Account created" : "Create account" }}</button>
      <p class="text-center text-sm text-slate-600">Already have an account? <NuxtLink to="/auth/signin" class="kc-link">Sign in</NuxtLink></p>
    </form>
  </div>
</template>
