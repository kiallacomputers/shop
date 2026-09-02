<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <NuxtLink
          to="/admin"
          class="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Admin Dashboard
        </NuxtLink>
        <p class="mt-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Administration
        </p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Manage Categories</h1>
        <p class="mt-2 text-slate-500">
          Create and organise the categories used by your online store.
        </p>
      </div>

      <NuxtLink
        to="/admin/categories/new"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </NuxtLink>
    </div>

    <div class="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">Search</label>
          <input
            v-model="search"
            type="text"
            placeholder="Search category name or slug..."
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">Status</label>
          <select
            v-model="statusFilter"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Categories</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div class="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
        Showing <span class="font-semibold text-slate-700">{{ visibleCount }}</span>
        of <span class="font-semibold text-slate-700">{{ categories.length }}</span> categories
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm"
    >
      Loading categories...
    </div>

    <div
      v-else-if="groupedCategories.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"
    >
      <h2 class="text-lg font-bold text-slate-800">No categories found</h2>
      <p class="mt-1 text-sm text-slate-500">Try changing your search or add a new category.</p>
    </div>

    <div v-else class="space-y-5">
      <section
        v-for="group in groupedCategories"
        :key="group.parent.id"
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="flex flex-col gap-4 bg-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="truncate text-lg font-bold text-slate-900">{{ group.parent.name }}</h2>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="group.parent.active === false ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'"
              >
                {{ group.parent.active === false ? "Inactive" : "Active" }}
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              /{{ group.parent.slug }} · Sort {{ Number(group.parent.sort_order || 0) }} ·
              {{ group.children.length }} {{ group.children.length === 1 ? "subcategory" : "subcategories" }}
            </p>
          </div>

          <div class="flex shrink-0 gap-2">
            <NuxtLink
              :to="`/admin/categories/${group.parent.id}`"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
            >
              Edit
            </NuxtLink>
            <button
              type="button"
              :disabled="deletingId === String(group.parent.id)"
              class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              @click="deleteCategory(group.parent)"
            >
              {{ deletingId === String(group.parent.id) ? "Deleting..." : "Delete" }}
            </button>
          </div>
        </div>

        <div v-if="group.children.length" class="divide-y divide-slate-100">
          <div
            v-for="category in group.children"
            :key="category.id"
            class="grid grid-cols-1 gap-3 px-5 py-4 hover:bg-slate-50/70 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div class="flex min-w-0 items-center gap-3 pl-3 sm:pl-6">
              <span class="text-slate-300">└─</span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate font-semibold text-slate-800">{{ category.name }}</p>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    :class="category.active === false ? 'bg-slate-100 text-slate-600' : 'bg-green-50 text-green-700'"
                  >
                    {{ category.active === false ? "Inactive" : "Active" }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-slate-500">
                  /{{ category.slug }} · Sort {{ Number(category.sort_order || 0) }}
                </p>
              </div>
            </div>

            <div class="flex gap-2 pl-8 sm:pl-0">
              <NuxtLink
                :to="`/admin/categories/${category.id}`"
                class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
              >
                Edit
              </NuxtLink>
              <button
                type="button"
                :disabled="deletingId === String(category.id)"
                class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                @click="deleteCategory(category)"
              >
                {{ deletingId === String(category.id) ? "Deleting..." : "Delete" }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="px-5 py-4 text-sm text-slate-400">
          No subcategories.
        </div>
      </section>

      <section
        v-if="orphanCategories.length"
        class="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm"
      >
        <div class="bg-amber-50 px-5 py-4">
          <h2 class="font-bold text-amber-900">Categories with missing parent</h2>
          <p class="mt-1 text-xs text-amber-700">These categories reference a parent that no longer exists.</p>
        </div>
        <div class="divide-y divide-slate-100">
          <div
            v-for="category in orphanCategories"
            :key="category.id"
            class="flex items-center justify-between gap-3 px-5 py-4"
          >
            <div>
              <p class="font-semibold text-slate-800">{{ category.name }}</p>
              <p class="mt-1 text-xs text-slate-500">/{{ category.slug }}</p>
            </div>
            <NuxtLink
              :to="`/admin/categories/${category.id}`"
              class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Edit
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });

type Category = {
  id: string | number;
  name: string;
  slug: string;
  parent_id?: string | number | null;
  active?: boolean | null;
  sort_order?: number | null;
};

const { adminFetch } = useAdminFetch();

const categories = ref<Category[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const deletingId = ref<string | null>(null);
const search = ref("");
const statusFilter = ref("");

const matchesFilter = (category: Category) => {
  const query = search.value.trim().toLowerCase();

  if (query) {
    const matches =
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query);
    if (!matches) return false;
  }

  if (statusFilter.value === "active" && category.active === false) return false;
  if (statusFilter.value === "inactive" && category.active !== false) return false;

  return true;
};

const sortCategories = (items: Category[]) =>
  [...items].sort((a, b) => {
    const sortDifference = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (sortDifference !== 0) return sortDifference;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

const groupedCategories = computed(() => {
  const parents = sortCategories(categories.value.filter((category) => category.parent_id == null));

  return parents
    .map((parent) => {
      const allChildren = sortCategories(
        categories.value.filter(
          (category) => String(category.parent_id ?? "") === String(parent.id),
        ),
      );

      const filteredChildren = allChildren.filter(matchesFilter);
      const parentMatches = matchesFilter(parent);

      if (!parentMatches && filteredChildren.length === 0) return null;

      return {
        parent,
        children: parentMatches && !search.value.trim() && !statusFilter.value
          ? allChildren
          : filteredChildren,
      };
    })
    .filter(Boolean) as Array<{ parent: Category; children: Category[] }>;
});

const knownIds = computed(() => new Set(categories.value.map((category) => String(category.id))));

const orphanCategories = computed(() =>
  sortCategories(
    categories.value.filter(
      (category) =>
        category.parent_id != null &&
        !knownIds.value.has(String(category.parent_id)) &&
        matchesFilter(category),
    ),
  ),
);

const visibleCount = computed(() => {
  const ids = new Set<string>();
  for (const group of groupedCategories.value) {
    ids.add(String(group.parent.id));
    for (const child of group.children) ids.add(String(child.id));
  }
  for (const orphan of orphanCategories.value) ids.add(String(orphan.id));
  return ids.size;
});

const loadCategories = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    categories.value = await adminFetch<Category[]>("/api/admin/categories");
  } catch (error: any) {
    console.error("LOAD CATEGORIES ERROR:", error);
    errorMessage.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to load categories.";
  } finally {
    loading.value = false;
  }
};

const deleteCategory = async (category: Category) => {
  const confirmed = window.confirm(
    `Delete category "${category.name}"?\n\nCategories containing products or subcategories cannot be deleted.`,
  );

  if (!confirmed) return;

  deletingId.value = String(category.id);
  errorMessage.value = "";

  try {
    await adminFetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    categories.value = categories.value.filter(
      (item) => String(item.id) !== String(category.id),
    );
  } catch (error: any) {
    console.error("DELETE CATEGORY ERROR:", error);
    errorMessage.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to delete category.";
  } finally {
    deletingId.value = null;
  }
};

onMounted(loadCategories);
</script>
