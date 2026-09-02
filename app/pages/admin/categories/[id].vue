<template>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <NuxtLink
          to="/admin"
          class="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Admin Dashboard
        </NuxtLink>
        <NuxtLink
          to="/admin/categories"
          class="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          Manage Categories
        </NuxtLink>
      </div>

      <h1 class="mt-3 text-3xl font-bold text-slate-900">
        Edit Category
      </h1>

      <p class="mt-2 text-slate-500">
        Update the category name, parent category and visibility.
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500"
    >
      Loading category...
    </div>

    <CategoryAdminForm
      v-else-if="category"
      :category="category"
      :categories="categories"
      submit-label="Save Changes"
      @saved="handleSaved"
    />
  </main>
</template>

<script setup lang="ts">
import CategoryAdminForm from "~/components/CategoryAdminForm.vue";

definePageMeta({
  middleware: "admin",
});

type Category = {
  id: string | number;
  name: string;
  slug: string;
  parent_id: string | number | null;
  active: boolean;
};

const route = useRoute();

const { adminFetch } = useAdminFetch();

const category = ref<Category | null>(null);
const categories = ref<Category[]>([]);

const loading = ref(true);
const errorMessage = ref("");

const handleSaved = async () => {
  await navigateTo("/admin/categories");
};

onMounted(async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const id = String(route.params.id || "");

    if (!id) {
      throw new Error("Category ID is missing.");
    }

    const [categoryResult, categoryList] =
      await Promise.all([
        adminFetch<Category>(
          `/api/admin/categories/${id}`,
        ),
        adminFetch<Category[]>(
          "/api/admin/categories",
        ),
      ]);

    category.value = categoryResult;
    categories.value = categoryList || [];
  } catch (error: any) {
    console.error("LOAD CATEGORY ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load category.";
  } finally {
    loading.value = false;
  }
});
</script>
