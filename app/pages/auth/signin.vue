<template>
  <div class="flex items-center justify-center mt-20">
    <div class="w-full max-w-md bg-white rounded-lg">
      <h1 class="text-3xl font-bold mb-6">Sign In</h1>

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
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3"
        >
          {{ loading ? "Signing In..." : "Sign In" }}
        </button>

        <p v-if="errorMessage" class="text-red-600 text-sm">
          {{ errorMessage }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "auth",
});

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

watchEffect(() => {
  if (user.value) {
    router.push("/");
  }
});

const login = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error.message;
    return;
  }

  router.push("/");
};
</script>
