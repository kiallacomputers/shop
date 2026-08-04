<script setup>
definePageMeta({
  layout: "auth",
});

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const client = useSupabaseClient();

const signUp = async () => {
  loading.value = true;
  error.value = "";

  const { error: err } = await client.auth.signUp({
    email: email.value,
    password: password.value,
  });

  if (err) {
    error.value = err.message;
  } else {
    alert("Check your email to verify your account.");
  }

  loading.value = false;
};
</script>

<template>
  <div class="max-w-md mx-auto mt-20">
    <h1 class="text-3xl font-bold mb-6">Sign Up</h1>

    <input
      v-model="email"
      type="email"
      placeholder="Email"
      class="border p-3 w-full mb-4 rounded"
    />

    <input
      v-model="password"
      type="password"
      placeholder="Password"
      class="border p-3 w-full mb-4 rounded"
    />

    <button
      @click="signUp"
      class="bg-blue-600 text-white px-5 py-3 rounded w-full"
    >
      Create Account
    </button>

    <p class="text-red-500 mt-4">{{ error }}</p>
    <p>
      Already have an account ? <NuxtLink to="/auth/signin">Sign In</NuxtLink>
    </p>
  </div>
</template>
