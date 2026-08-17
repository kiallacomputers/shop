<template>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <NuxtLink to="/admin/categories" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
        ← Back to Categories
      </NuxtLink>
      <h1 class="mt-3 text-3xl font-bold text-slate-900">Add Category</h1>
      <p class="mt-2 text-slate-500">Create a new main category or subcategory.</p>
    </div>

    <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
      Loading categories...
    </div>

    <CategoryAdminForm
      v-else
      mode="create"
      :categories="categories"
    />
  </main>
</template>

<script setup lang="ts">
import CategoryAdminForm from "~/components/CategoryAdminForm.vue";

definePageMeta({ middleware: "admin" });

type Category = {
  id: string | number;
  name: string;
  slug?: string | null;
  parent_id?: string | number | null;
  active?: boolean | null;
  sort_order?: number | null;
};

const { adminFetch } = useAdminFetch();
const categories = ref<Category[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    categories.value = await adminFetch<Category[]>("/api/admin/categories");
  } finally {
    loading.value = false;
  }
});
</script>
