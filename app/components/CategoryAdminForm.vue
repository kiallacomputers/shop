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

        <div
          v-if="form.parent_id"
          class="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm font-bold text-slate-800">
                Existing Subcategories
                <template v-if="selectedParentName"> under {{ selectedParentName }}</template>
              </p>
              <p class="mt-1 text-xs text-slate-500">
                These subcategories already exist under the selected parent category.
              </p>
            </div>
            <span class="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {{ existingSubcategories.length }}
            </span>
          </div>

          <div
            v-if="existingSubcategories.length"
            class="mt-4 flex flex-wrap gap-2"
          >
            <span
              v-for="subcategory in existingSubcategories"
              :key="subcategory.id"
              class="rounded-lg border px-3 py-2 text-sm font-semibold"
              :class="isSimilarSubcategory(subcategory.name)
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-white text-slate-700'"
            >
              {{ subcategory.name }}
              <span
                v-if="isSimilarSubcategory(subcategory.name)"
                class="ml-1 text-xs font-bold text-amber-700"
              >
                Similar
              </span>
            </span>
          </div>

          <div
            v-else
            class="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500"
          >
            No subcategories yet under this category.
          </div>

          <div
            v-if="exactDuplicate"
            class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            A subcategory named “{{ exactDuplicate.name }}” already exists under {{ selectedParentName }}.
          </div>
          <div
            v-else-if="similarSubcategories.length && form.name.trim()"
            class="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Similar subcategory name{{ similarSubcategories.length === 1 ? "" : "s" }} already exist:
            <strong>{{ similarSubcategories.map((item) => item.name).join(", ") }}</strong>.
          </div>
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

    <div class="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Category SEO & Search Content</h2>
        <p class="mt-1 text-sm text-slate-500">Optional fields for search engines and useful category landing-page content.</p>
      </div>

      <div class="mt-5 grid gap-5">
        <label>
          <span class="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>SEO Title</span><span class="text-xs font-medium text-slate-400">{{ form.seo_title.length }}/60</span>
          </span>
          <input v-model="form.seo_title" type="text" maxlength="100" class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" :placeholder="`${form.name || 'Category'} | Kialla Computers`" />
        </label>

        <label>
          <span class="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Meta Description</span><span class="text-xs font-medium text-slate-400">{{ form.seo_description.length }}/160</span>
          </span>
          <textarea v-model="form.seo_description" rows="3" maxlength="220" class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" placeholder="Description shown to search engines for this category."></textarea>
        </label>

        <label>
          <span class="mb-2 block text-sm font-semibold text-slate-700">Category Introduction</span>
          <textarea v-model="form.seo_intro" rows="3" class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" placeholder="Short useful introduction shown above the product list."></textarea>
        </label>

        <label>
          <span class="mb-2 block text-sm font-semibold text-slate-700">Category Content</span>
          <textarea v-model="form.seo_content" rows="7" class="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" placeholder="Longer helpful content shown below the products. Explain the category, buying considerations, compatibility or common uses."></textarea>
          <span class="mt-1 block text-xs text-slate-500">Write for customers first. Avoid repeating keywords unnaturally.</span>
        </label>

        <div class="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Search preview</p>
          <p class="mt-2 text-lg font-medium text-[#1a0dab]">{{ form.seo_title.trim() || `${form.name || 'Category'} | Kialla Computers` }}</p>
          <p class="mt-1 text-sm text-green-700">shop.kiallacomputers.com.au/category/{{ form.slug || 'category-slug' }}</p>
          <p class="mt-1 text-sm leading-5 text-slate-600">{{ form.seo_description.trim() || `Shop ${form.name || 'this category'} from Kialla Computers. Browse our current range with secure checkout and Australian delivery.` }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div class="admin-action-bar">
      <NuxtLink
        to="/admin/categories"
        class="admin-btn-secondary"
      >
        Cancel
      </NuxtLink>

      <button
        v-if="!props.category"
        type="button"
        :disabled="saving"
        class="admin-btn-secondary"
        @click="submitForm('add-another')"
      >
        {{ saving && saveMode === "add-another" ? "Saving..." : "Save & Add Another" }}
      </button>

      <button
        type="submit"
        :disabled="saving"
        class="admin-btn-primary"
      >
        {{ saving && saveMode === "save" ? "Saving..." : buttonText }}
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
  seo_title?: string | null;
  seo_description?: string | null;
  seo_intro?: string | null;
  seo_content?: string | null;
};

const props = withDefaults(
  defineProps<{
    category?: Category | null;
    categories: Category[];
    submitLabel?: string;
    initialParentId?: string;
  }>(),
  {
    category: null,
    submitLabel: "",
    initialParentId: "",
  },
);

const emit = defineEmits<{
  saved: [];
  savedAndAddAnother: [{ parentId: string }];
}>();

const { adminFetch } = useAdminFetch();

const saving = ref(false);
const saveMode = ref<"save" | "add-another">("save");
const errorMessage = ref("");

const form = reactive({
  name: props.category?.name ?? "",
  slug: props.category?.slug ?? "",
  parent_id: props.category?.parent_id
    ? String(props.category.parent_id)
    : String(props.initialParentId || ""),
  active: props.category?.active ?? true,
  seo_title: props.category?.seo_title ?? "",
  seo_description: props.category?.seo_description ?? "",
  seo_intro: props.category?.seo_intro ?? "",
  seo_content: props.category?.seo_content ?? "",
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
    form.seo_title = category.seo_title ?? "";
    form.seo_description = category.seo_description ?? "";
    form.seo_intro = category.seo_intro ?? "";
    form.seo_content = category.seo_content ?? "";
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

const selectedParentName = computed(() =>
  props.categories.find((category) => String(category.id) === String(form.parent_id))?.name || "",
);

const existingSubcategories = computed(() =>
  props.categories
    .filter((category) =>
      String(category.parent_id ?? "") === String(form.parent_id || "") &&
      (!props.category || String(category.id) !== String(props.category.id)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
);

const normaliseCategoryName = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");

const exactDuplicate = computed(() => {
  const entered = normaliseCategoryName(form.name);
  if (!entered || !form.parent_id) return null;
  return existingSubcategories.value.find(
    (category) => normaliseCategoryName(category.name) === entered,
  ) || null;
});

const similarSubcategories = computed(() => {
  const entered = normaliseCategoryName(form.name);
  if (!entered || entered.length < 3 || !form.parent_id) return [];

  return existingSubcategories.value.filter((category) => {
    const existing = normaliseCategoryName(category.name);
    if (existing === entered) return false;
    return existing.includes(entered) || entered.includes(existing);
  });
});

const isSimilarSubcategory = (name: string) => {
  const entered = normaliseCategoryName(form.name);
  if (!entered || entered.length < 3) return false;
  const existing = normaliseCategoryName(name);
  return existing === entered || existing.includes(entered) || entered.includes(existing);
};

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

const submitForm = async (mode: "save" | "add-another" = "save") => {
  if (saving.value) return;

  if (exactDuplicate.value) {
    errorMessage.value = `A subcategory named "${exactDuplicate.value.name}" already exists under ${selectedParentName.value}.`;
    return;
  }

  saving.value = true;
  saveMode.value = mode;
  errorMessage.value = "";

  try {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      parent_id: form.parent_id || null,
      active: form.active,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      seo_intro: form.seo_intro.trim() || null,
      seo_content: form.seo_content.trim() || null,
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

    if (!props.category && mode === "add-another") {
      const parentId = String(form.parent_id || "");

      // Keep the same category type. For subcategories this preserves the
      // selected parent; for main categories it remains blank.
      form.name = "";
      form.slug = "";
      form.parent_id = parentId;
      form.active = true;
      form.seo_title = "";
      form.seo_description = "";
      form.seo_intro = "";
      form.seo_content = "";

      emit("savedAndAddAnother", { parentId });
    } else {
      emit("saved");
    }
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
