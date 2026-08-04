<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold">Dashboard</h1>

    <p class="mt-4">Welcome {{ user?.email }}</p>

    <button
      @click="logout"
      class="mt-6 bg-red-600 text-white px-5 py-2 rounded"
    >
      Logout
    </button>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: "auth",
});

const user = useSupabaseUser();
const supabase = useSupabaseClient();

const logout = async () => {
  await supabase.auth.signOut();
  navigateTo("/login");
};
</script>
