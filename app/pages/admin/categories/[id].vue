<template>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <NuxtLink to="/admin/categories" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
        ← Back to Categories
      </NuxtLink>
      <h1 class="mt-3 text-3xl font-bold text-slate-900">Edit Category</h1>
      <p class="mt-2 text-slate-500">Update the category name, hierarchy, visibility and order.</p>
    </div>

    <div
      v-if="errorMessage"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
      Loading category...
    </div>

    <CategoryAdminForm
      v-else-if="category"
      mode="edit"
      :category="category"
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

const route = useRoute();
const { adminFetch } = useAdminFetch();

const category = ref<Category | null>(null);
const categories = ref<Category[]>([]);
const loading = ref(true);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const id = String(route.params.id || "");

    const [categoryResult, categoryList] = await Promise.all([
      adminFetch<Category>(`/api/admin/categories/${id}`),
      adminFetch<Category[]>("/api/admin/categories"),
    ]);

    category.value = categoryResult;
    categories.value = categoryList;
  } catch (error: any) {
    console.error("LOAD CATEGORY ERROR:", error);
    errorMessage.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to load category.";
  } finally {
    loading.value = false;
  }
});
</script>
