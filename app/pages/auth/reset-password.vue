<template>
  <div class="kc-panel w-full p-6 sm:p-8">
        <p class="kc-eyebrow">
          Account Security
        </p>

        <h1 class="kc-title mt-1 text-3xl">
          Reset Password
        </h1>

        <p class="mt-2 mb-7 text-sm text-slate-500">
          Enter your new password below.
        </p>

        <div
          v-if="checkingSession"
          class="kc-alert kc-alert-info"
        >
          Verifying your password reset link...
        </div>

        <div
          v-else-if="errorMessage"
          class="kc-alert kc-alert-error"
        >
          <p class="font-semibold">Unable to reset password</p>
          <p class="mt-1">{{ errorMessage }}</p>
        </div>

        <form
          v-else-if="sessionReady && !passwordChanged"
          class="space-y-5"
          @submit.prevent="updatePassword"
        >
          <div>
            <label
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              New Password
            </label>

            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirm Password
            </label>

            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            :disabled="saving"
            class="kc-btn-primary w-full"
          >
            {{ saving ? "Updating Password..." : "Update Password" }}
          </button>
        </form>

        <div v-else-if="passwordChanged" class="text-center">
          <h2 class="text-xl font-bold text-slate-900">
            Password Updated
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            Your password has been changed successfully.
          </p>

          <NuxtLink
            to="/auth/signin"
            class="kc-btn-primary mt-6"
          >
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

const password = ref("");
const confirmPassword = ref("");
const saving = ref(false);
const checkingSession = ref(true);
const sessionReady = ref(false);
const passwordChanged = ref(false);
const errorMessage = ref("");

const establishRecoverySession = async () => {
  checkingSession.value = true;
  errorMessage.value = "";

  try {
    const tokenHash =
      typeof route.query.token_hash === "string"
        ? route.query.token_hash
        : "";

    if (tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (error || !data.session) {
        throw error || new Error("The password reset link is invalid or has expired.");
      }

      sessionReady.value = true;
      checkingSession.value = false;
      return;
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (session) {
      sessionReady.value = true;
      checkingSession.value = false;
      return;
    }

    if (typeof route.query.code === "string" && route.query.code) {
      throw new Error(
        "This password reset link uses the old recovery method. Please request a new password reset email and use the newest link.",
      );
    }

    throw new Error(
      "The password reset link is invalid or has expired. Please request a new password reset email.",
    );
  } catch (error: any) {
    console.error("RECOVERY SESSION ERROR:", error);
    checkingSession.value = false;
    errorMessage.value =
      error?.message ||
      "Unable to verify the password reset link.";
  }
};

const updatePassword = async () => {
  errorMessage.value = "";

  if (password.value.length < 8) {
    errorMessage.value =
      "Your password must be at least 8 characters long.";
    return;
  }

  if (
    password.value !==
    confirmPassword.value
  ) {
    errorMessage.value =
      "The passwords do not match.";
    return;
  }

  saving.value = true;

  try {
    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      throw new Error(
        "Auth session is missing. Please request a new password reset email.",
      );
    }

    const { error } =
      await supabase.auth.updateUser({
        password: password.value,
      });

    if (error) {
      throw error;
    }

    passwordChanged.value = true;

    password.value = "";
    confirmPassword.value = "";
  } catch (error: any) {
    console.error(
      "UPDATE PASSWORD ERROR:",
      error,
    );

    errorMessage.value =
      error?.message ||
      "Unable to update your password.";
  } finally {
    saving.value = false;
  }
};

onMounted(establishRecoverySession);

</script>
