<template>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <NuxtLink
          to="/admin"
          class="text-sm font-semibold text-blue-600 hover:text-blue-700 admin-page-backlink"
        >
          ← Admin Dashboard
        </NuxtLink>
        <NuxtLink
          to="/admin/categories"
          class="admin-subnav-link"
        >
          Manage Categories
        </NuxtLink>
      </div>

      <h1 class="mt-3 text-3xl font-bold text-slate-900">
        {{ selectedParent ? "Add Subcategory" : "Add Main Category" }}
      </h1>

      <p class="mt-2 text-slate-500">
        <template v-if="selectedParent">
          This category will be added under <strong class="text-slate-700">{{ selectedParent.name }}</strong>.
        </template>
        <template v-else>
          Create a new top-level category for your store.
        </template>
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
      Loading categories...
    </div>

    <CategoryAdminForm
      v-else
      :categories="categories"
      :initial-parent-id="initialParentId"
      submit-label="Create Category"
      @saved="handleSaved"
    />
  </main>
</template>

<script setup lang="ts">
import CategoryAdminForm from "~/components/CategoryAdminForm.vue";

definePageMeta({ layout: "admin",
  middleware: "admin",
});

type Category = {
  id: string | number;
  name: string;
  slug: string;
  parent_id: string | number | null;
  active: boolean;
};

const { adminFetch } = useAdminFetch();
const route = useRoute();

const categories = ref<Category[]>([]);
const initialParentId = computed(() => String(route.query.parent || ""));
const selectedParent = computed(() =>
  categories.value.find(
    (category) =>
      String(category.id) === initialParentId.value &&
      (category.parent_id === null || category.parent_id === undefined || category.parent_id === ""),
  ) || null,
);

const loading = ref(true);
const errorMessage = ref("");

const handleSaved = async () => {
  await navigateTo("/admin/categories");
};

onMounted(async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    categories.value =
      (await adminFetch<Category[]>(
        "/api/admin/categories",
      )) || [];
  } catch (error: any) {
    console.error(
      "LOAD CATEGORIES ERROR:",
      error,
    );

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load categories.";
  } finally {
    loading.value = false;
  }
});
</script>
