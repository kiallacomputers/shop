<template>
  <main class="min-h-[70vh] bg-slate-50">
    <div class="max-w-lg mx-auto px-4 py-16">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Account Security
        </p>

        <h1 class="mt-1 text-3xl font-bold text-slate-900">
          Reset Password
        </h1>

        <p class="mt-2 mb-7 text-sm text-slate-500">
          Enter your new password below.
        </p>

        <div
          v-if="checkingSession"
          class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-700"
        >
          Verifying your password reset link...
        </div>

        <div
          v-else-if="errorMessage"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
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
            class="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
            class="mt-6 inline-flex rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Sign In
          </NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const route = useRoute();

const password = ref("");
const confirmPassword = ref("");
const saving = ref(false);
const checkingSession = ref(true);
const sessionReady = ref(false);
const passwordChanged = ref(false);
const errorMessage = ref("");

let authSubscription: any = null;

const establishRecoverySession = async () => {
  checkingSession.value = true;
  errorMessage.value = "";

  try {
    // PKCE flow: Supabase returns ?code=...
    const code =
      typeof route.query.code === "string"
        ? route.query.code
        : "";

    if (code) {
      const { error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      sessionReady.value = true;
      checkingSession.value = false;
      return;
    }

    // Implicit flow / already established session fallback.
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (session) {
      sessionReady.value = true;
      checkingSession.value = false;
      return;
    }

    // Listen briefly for Supabase's PASSWORD_RECOVERY event.
    const { data } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" &&
          session
        ) {
          sessionReady.value = true;
          checkingSession.value = false;
          errorMessage.value = "";
        }
      },
    );

    authSubscription = data.subscription;

    // If no session appears, show a useful error.
    window.setTimeout(async () => {
      if (sessionReady.value) {
        return;
      }

      const {
        data: { session: lateSession },
      } = await supabase.auth.getSession();

      if (lateSession) {
        sessionReady.value = true;
        checkingSession.value = false;
        return;
      }

      checkingSession.value = false;
      errorMessage.value =
        "The recovery session could not be created. The reset link may have expired or already been used. Please request a new password reset email.";
    }, 1500);
  } catch (error: any) {
    console.error(
      "RECOVERY SESSION ERROR:",
      error,
    );

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

onBeforeUnmount(() => {
  authSubscription?.unsubscribe?.();
});
</script>
