<template>
  <main class="min-h-[70vh] bg-slate-50">
    <div class="max-w-lg mx-auto px-4 py-16">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">Account Security</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Reset Password</h1>
        <p class="mt-2 mb-7 text-sm text-slate-500">Enter your new password below.</p>

        <div v-if="errorMessage" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMessage }}
        </div>

        <form v-if="!passwordChanged" class="space-y-5" @submit.prevent="updatePassword">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
            <input v-model="password" type="password" autocomplete="new-password" required minlength="8"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input v-model="confirmPassword" type="password" autocomplete="new-password" required minlength="8"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <button type="submit" :disabled="saving"
            class="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {{ saving ? "Updating Password..." : "Update Password" }}
          </button>
        </form>

        <div v-else class="text-center">
          <h2 class="text-xl font-bold text-slate-900">Password Updated</h2>
          <p class="mt-2 text-sm text-slate-500">Your password has been changed successfully.</p>
          <NuxtLink to="/auth/signin"
            class="mt-6 inline-flex rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700">
            Sign In
          </NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();

const password = ref("");
const confirmPassword = ref("");
const saving = ref(false);
const passwordChanged = ref(false);
const errorMessage = ref("");

const updatePassword = async () => {
  errorMessage.value = "";

  if (password.value.length < 8) {
    errorMessage.value = "Your password must be at least 8 characters long.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "The passwords do not match.";
    return;
  }

  saving.value = true;

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    });

    if (error) throw error;

    passwordChanged.value = true;
    password.value = "";
    confirmPassword.value = "";
  } catch (error: any) {
    console.error("UPDATE PASSWORD ERROR:", error);
    errorMessage.value =
      error?.message ||
      "Unable to update your password. The reset link may have expired.";
  } finally {
    saving.value = false;
  }
};
</script>
