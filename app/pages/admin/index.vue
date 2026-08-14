<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const { adminFetch } = useAdminFetch();

const loading = ref(true);

const admin = ref<any>(null);

const loadAdmin = async () => {
  try {
    const result = await adminFetch<{
      isAdmin: boolean;
      user: any;
      adminUser: any;
    }>("/api/admin/check");

    admin.value = result;
  } catch (error) {
    console.error("ADMIN LOAD ERROR:", error);
  } finally {
    loading.value = false;
  }
};

await loadAdmin();
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Admin Dashboard</h1>

    <div v-if="loading" class="text-gray-500">Loading...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <NuxtLink
        to="/admin/#"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
      >
        <h2 class="text-xl font-semibold">Products</h2>

        <p class="text-gray-500 mt-2">Manage your products and stock.</p>
      </NuxtLink>

      <NuxtLink
        to="/admin/#"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
      >
        <h2 class="text-xl font-semibold">Orders</h2>

        <p class="text-gray-500 mt-2">View and manage customer orders.</p>
      </NuxtLink>

      <NuxtLink
        to="/admin/#"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
      >
        <h2 class="text-xl font-semibold">Categories</h2>

        <p class="text-gray-500 mt-2">Manage product categories.</p>
      </NuxtLink>
    </div>
  </div>
</template>
