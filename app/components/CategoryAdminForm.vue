<template>
  <form class="space-y-6" @submit.prevent="saveCategory">
    <div
      v-if="errorMessage"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6">
        <h2 class="text-lg font-bold text-slate-900">Category Details</h2>
        <p class="mt-1 text-sm text-slate-500">
          Set the name, parent category, visibility and menu order.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Category Name
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. AMD AM5 CPU"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            @input="handleNameInput"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Slug
          </label>
          <input
            v-model="form.slug"
            type="text"
            required
            placeholder="amd-am5-cpu"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            @input="slugManuallyEdited = true"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Parent Category
          </label>
          <select
            v-model="form.parent_id"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">No Parent — Main Category</option>
            <option
              v-for="category in availableParents"
              :key="category.id"
              :value="String(category.id)"
            >
              {{ categoryLabel(category) }}
            </option>
          </select>
          <p class="mt-1.5 text-xs text-slate-500">
            Leave blank for a top-level category.
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Sort Order
          </label>
          <input
            v-model.number="form.sort_order"
            type="number"
            min="0"
            step="1"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p class="mt-1.5 text-xs text-slate-500">
            Lower numbers appear first in the menu.
          </p>
        </div>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-5">
        <label class="inline-flex cursor-pointer items-center gap-3">
          <input
            v-model="form.active"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <span class="block text-sm font-semibold text-slate-700">Active</span>
            <span class="block text-xs text-slate-500">
              Active categories can be displayed in the shop menu.
            </span>
          </span>
        </label>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <NuxtLink
        to="/admin/categories"
        class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </NuxtLink>

      <button
        type="submit"
        :disabled="saving"
        class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ saving ? "Saving..." : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
type Category = {
  id: string | number;
  name: string;
  slug?: string | null;
  parent_id?: string | number | null;
  active?: boolean | null;
  sort_order?: number | null;
};

const props = defineProps<{
  category?: Category | null;
  categories: Category[];
  mode: "create" | "edit";
}>();

const { adminFetch } = useAdminFetch();

const saving = ref(false);
const errorMessage = ref("");
const slugManuallyEdited = ref(props.mode === "edit");

const form = reactive({
  name: props.category?.name || "",
  slug: props.category?.slug || "",
  parent_id:
    props.category?.parent_id === null ||
    props.category?.parent_id === undefined
      ? ""
      : String(props.category.parent_id),
  active: props.category?.active !== false,
  sort_order: Number(props.category?.sort_order || 0),
});

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const handleNameInput = () => {
  if (!slugManuallyEdited.value || !form.slug) {
    form.slug = makeSlug(form.name);
  }
};

const submitLabel = computed(() =>
  props.mode === "create" ? "Create Category" : "Save Changes",
);

const byId = computed(() =>
  new Map(props.categories.map((category) => [String(category.id), category])),
);

const descendantIds = computed(() => {
  if (!props.category?.id) return new Set<string>();

  const result = new Set<string>();
  const target = String(props.category.id);

  const visit = (parentId: string) => {
    for (const category of props.categories) {
      if (String(category.parent_id ?? "") === parentId) {
        const id = String(category.id);
        if (!result.has(id)) {
          result.add(id);
          visit(id);
        }
      }
    }
  };

  visit(target);
  return result;
});

const availableParents = computed(() => {
  return props.categories
    .filter((category) => {
      if (!props.category?.id) return true;
      const id = String(category.id);
      return id !== String(props.category.id) && !descendantIds.value.has(id);
    })
    .sort((a, b) => {
      const parentA = a.parent_id == null ? 0 : 1;
      const parentB = b.parent_id == null ? 0 : 1;
      if (parentA !== parentB) return parentA - parentB;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
});

const categoryLabel = (category: Category) => {
  if (category.parent_id == null) return category.name;
  const parent = byId.value.get(String(category.parent_id));
  return parent ? `${parent.name} → ${category.name}` : category.name;
};

const saveCategory = async () => {
  saving.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      name: form.name.trim(),
      slug: makeSlug(form.slug || form.name),
      parent_id: form.parent_id || null,
      active: form.active,
      sort_order: Number(form.sort_order || 0),
    };

    if (props.mode === "create") {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: payload,
      });
    } else {
      await adminFetch(`/api/admin/categories/${props.category?.id}`, {
        method: "PUT",
        body: payload,
      });
    }

    await navigateTo("/admin/categories");
  } catch (error: any) {
    console.error("SAVE CATEGORY ERROR:", error);
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to save category.";
  } finally {
    saving.value = false;
  }
};
</script>
