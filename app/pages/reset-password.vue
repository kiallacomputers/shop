<template>
  <div class="kc-panel w-full p-6 sm:p-8">
    <p class="kc-eyebrow">Account Security</p>
    <h1 class="kc-title mt-1 text-3xl">Opening Password Reset</h1>
    <p class="mt-2 text-sm text-slate-500">
      Redirecting you to the secure password reset page...
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth" });

const route = useRoute();

onMounted(async () => {
  // Keep the Supabase recovery query/hash intact for reset links that were
  // generated before the canonical route changed to /auth/reset-password.
  const query = { ...route.query };
  const hash = route.hash || "";

  await navigateTo({
    path: "/auth/reset-password",
    query,
    hash,
  }, { replace: true });
});
</script>
