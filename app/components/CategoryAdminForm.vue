<template>
  <form @submit.prevent="submitForm" class="space-y-6">
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="mb-5 text-lg font-bold text-slate-900">Category Details</h2>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Category Name
          </label>

          <input
            v-model="form.name"
            type="text"
            required
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            @input="generateSlug"
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
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Parent Category
          </label>

          <select
            v-model="form.parent_id"
            class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">No Parent Category</option>

            <option
              v-for="category in availableParents"
              :key="category.id"
              :value="String(category.id)"
            >
              {{ category.name }}
            </option>
          </select>

          <p class="mt-2 text-xs text-slate-500">
            Only top-level categories can be selected as a parent.
          </p>
        </div>

        <div class="flex items-end">
          <label
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
          >
            <input
              v-model="form.active"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-blue-600"
            />

            <span class="text-sm font-semibold text-slate-700">
              Active
            </span>
          </label>
        </div>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div class="flex justify-end gap-3">
      <NuxtLink
        to="/admin/categories"
        class="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </NuxtLink>

      <button
        type="submit"
        :disabled="saving"
        class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ saving ? "Saving..." : buttonText }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
type Category = {
  id: string | number;
  name: string;
  slug: string;
  parent_id: string | number | null;
  active: boolean;
};

const props = withDefaults(
  defineProps<{
    category?: Category | null;
    categories: Category[];
    submitLabel?: string;
  }>(),
  {
    category: null,
    submitLabel: "",
  },
);

const emit = defineEmits<{
  saved: [];
}>();

const { adminFetch } = useAdminFetch();

const saving = ref(false);
const errorMessage = ref("");

const form = reactive({
  name: props.category?.name ?? "",
  slug: props.category?.slug ?? "",
  parent_id: props.category?.parent_id
    ? String(props.category.parent_id)
    : "",
  active: props.category?.active ?? true,
});

const buttonText = computed(() => {
  if (props.submitLabel.trim()) {
    return props.submitLabel;
  }

  return props.category ? "Save Changes" : "Create Category";
});

watch(
  () => props.category,
  (category) => {
    if (!category) {
      return;
    }

    form.name = category.name ?? "";
    form.slug = category.slug ?? "";
    form.parent_id = category.parent_id
      ? String(category.parent_id)
      : "";
    form.active = category.active ?? true;
  },
);

const availableParents = computed(() =>
  props.categories
    .filter((category) => {
      // Only allow top-level categories to be selected as a parent.
      const isTopLevel =
        category.parent_id === null ||
        category.parent_id === undefined ||
        category.parent_id === "";

      if (!isTopLevel) {
        return false;
      }

      // When editing, don't allow the category to select itself.
      if (
        props.category &&
        String(category.id) === String(props.category.id)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      }),
    ),
);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const generateSlug = () => {
  if (!props.category) {
    form.slug = slugify(form.name);
  }
};

const submitForm = async () => {
  saving.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      parent_id: form.parent_id || null,
      active: form.active,
    };

    if (props.category) {
      await adminFetch(
        `/api/admin/categories/${props.category.id}`,
        {
          method: "PUT",
          body: payload,
        },
      );
    } else {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: payload,
      });
    }

    emit("saved");
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
