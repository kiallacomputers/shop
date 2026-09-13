<template>
  <div class="kc-panel w-full p-6 sm:p-8">
    <p class="kc-eyebrow">Account Security</p>
    <h1 class="kc-title mt-1 text-3xl">Forgot Password</h1>

    <p class="mb-7 mt-2 text-sm text-slate-500">
      Enter your account email address and we’ll send you a secure password reset link.
    </p>

    <div v-if="errorMessage" class="kc-alert kc-alert-error mb-5" role="alert">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="kc-alert kc-alert-success mb-5" role="status">
      {{ successMessage }}
    </div>

    <form v-if="!sent" class="space-y-5" @submit.prevent="sendResetLink">
      <label>
        <span class="kc-field-label">Email address</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="w-full border px-4 py-3"
          required
        />
      </label>

      <button
        type="submit"
        :disabled="loading"
        class="kc-btn-primary w-full min-h-[48px]"
      >
        {{ loading ? "Sending Reset Link…" : "Send Password Reset Link" }}
      </button>

      <p class="text-center text-sm text-slate-600">
        Remembered your password?
        <NuxtLink to="/auth/signin" class="kc-link">Sign in</NuxtLink>
      </p>
    </form>

    <div v-else class="text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-700">
        ✉
      </div>

      <h2 class="mt-4 text-xl font-black text-slate-900">
        Check your email
      </h2>

      <p class="mt-2 text-sm text-slate-500">
        If an account exists for <strong>{{ email }}</strong>, a password reset link has been sent.
      </p>

      <button
        type="button"
        class="kc-btn-secondary mt-6"
        :disabled="loading"
        @click="sent = false; successMessage = ''; errorMessage = ''"
      >
        Try another email
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ robots: "noindex, nofollow" });
definePageMeta({ layout: "auth" });

const supabase = useSupabaseClient();
const config = useRuntimeConfig();

const email = ref("");
const loading = ref(false);
const sent = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const sendResetLink = async () => {
  const cleanEmail = email.value.trim().toLowerCase();
  if (!cleanEmail || loading.value) return;

  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const siteUrl = String(config.public.siteUrl || window.location.origin).replace(/\/+$/, "");
    const redirectTo = `${siteUrl}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      // Keep the message generic so the page does not reveal whether
      // a customer account exists for a particular email address.
      console.warn("PASSWORD RESET REQUEST:", error.message);
    }

    email.value = cleanEmail;
    sent.value = true;
    successMessage.value =
      "If that email belongs to an account, a secure password reset link has been sent.";
  } catch (error: any) {
    console.error("PASSWORD RESET REQUEST ERROR:", error);

    // Use the same generic result for privacy.
    email.value = cleanEmail;
    sent.value = true;
    successMessage.value =
      "If that email belongs to an account, a secure password reset link has been sent.";
  } finally {
    loading.value = false;
  }
};
</script>
