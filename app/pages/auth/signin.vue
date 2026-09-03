<template>
  <div class="w-full">
    <div class="kc-panel w-full p-6 sm:p-8">
      <h1 class="kc-title text-3xl mb-2">Sign In</h1>

      <p class="mb-7 text-sm text-slate-500">Sign in to manage your account, delivery addresses and orders.</p>

      <form @submit.prevent="login" class="space-y-4">
        <div>
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-[#2367d1] hover:bg-[#194fa8] disabled:bg-slate-400 text-white font-extrabold py-3 transition"
        >
          {{ loading ? "Signing In..." : "Sign In" }}
        </button>

        <p v-if="errorMessage" class="text-red-600 text-sm">
          {{ errorMessage }}
        </p>

        <p>
          Do not have an account?
          <NuxtLink to="/auth/signup" class="text-blue-600 hover:text-blue-800">
            Sign Up
          </NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "auth",
});

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

// ============================================
// WHERE TO GO AFTER LOGIN
// ============================================
//
// If the user was redirected here from a protected
// page, use that page as the destination.
//
// Example:
// /signin?redirect=/shoppingcart
//
// Otherwise go to the home page.
//

const redirectTo = computed(() => {
  const redirect = route.query.redirect;

  if (typeof redirect === "string" && redirect.startsWith("/")) {
    return redirect;
  }

  return "/";
});

// ============================================
// LOGIN
// ============================================

const login = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      errorMessage.value = error.message;
      return;
    }

    // ==========================================
    // WAIT FOR SUPABASE USER STATE
    // ==========================================

    await nextTick();

    // ==========================================
    // REDIRECT
    // ==========================================

    await router.push(redirectTo.value);
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);

    errorMessage.value =
      error?.message ||
      "Unable to sign in. Please check your email and password.";
  } finally {
    loading.value = false;
  }
};
</script>
