<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ============================================ -->
    <!-- HEADER -->
    <!-- ============================================ -->

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Categories</h1>

        <p class="text-gray-500 mt-1">
          Manage product categories and subcategories.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/admin"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
        >
          ← Admin Menu
        </NuxtLink>

        <button
          type="button"
          @click="openAddCategory"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          + Add Category
        </button>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- LOADING -->
    <!-- ============================================ -->

    <div v-if="loading" class="bg-white rounded-lg shadow p-12 text-center">
      <div class="flex justify-center mb-4">
        <div
          class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
        ></div>
      </div>

      <p class="text-gray-500">Loading categories...</p>
    </div>

    <!-- ============================================ -->
    <!-- ERROR -->
    <!-- ============================================ -->

    <div
      v-else-if="errorMessage"
      class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- ============================================ -->
    <!-- CATEGORY LIST -->
    <!-- ============================================ -->

    <div v-else class="bg-white rounded-lg shadow overflow-visible">
      <!-- EMPTY -->

      <div v-if="mainCategories.length === 0" class="p-12 text-center">
        <div class="text-5xl mb-4">📁</div>

        <h2 class="text-xl font-semibold text-slate-700">No Categories</h2>

        <p class="text-gray-500 mt-2">Create your first product category.</p>

        <button
          type="button"
          @click="openAddCategory"
          class="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          + Add Category
        </button>
      </div>

      <!-- ========================================== -->
      <!-- CATEGORY LIST -->
      <!-- ========================================== -->

      <div v-else class="divide-y">
        <div
          v-for="category in mainCategories"
          :key="category.id"
          class="relative p-5"
        >
          <!-- ====================================== -->
          <!-- MAIN CATEGORY HEADER -->
          <!-- ====================================== -->

          <div class="flex items-center justify-between gap-4">
            <!-- LEFT -->

            <div class="flex items-center gap-3 min-w-0">
              <!-- EXPAND -->

              <button
                v-if="getChildren(category.id).length > 0"
                type="button"
                @click="toggleCategory(category.id)"
                class="w-8 h-8 shrink-0 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                :title="
                  expandedCategories.has(category.id) ? 'Collapse' : 'Expand'
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 transition-transform"
                  :class="{
                    'rotate-90': expandedCategories.has(category.id),
                  }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div v-else class="w-8 shrink-0"></div>

              <!-- FOLDER -->

              <span class="text-2xl shrink-0"> 📁 </span>

              <!-- NAME -->

              <div class="min-w-0">
                <h2 class="font-bold text-lg text-slate-800 truncate">
                  {{ category.name }}
                </h2>

                <p class="text-sm text-gray-500">
                  {{ getChildren(category.id).length }}

                  {{
                    getChildren(category.id).length === 1
                      ? "subcategory"
                      : "subcategories"
                  }}
                </p>
              </div>
            </div>

            <!-- RIGHT -->

            <div class="flex items-center gap-3 shrink-0">
              <!-- STATUS -->

              <span
                class="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                :class="
                  category.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{ category.active ? "Active" : "Inactive" }}
              </span>

              <!-- MENU -->

              <div class="relative">
                <button
                  type="button"
                  @click.stop="toggleMenu(category.id)"
                  class="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  title="Actions"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 text-slate-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="5" cy="12" r="2" />

                    <circle cx="12" cy="12" r="2" />

                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

                <!-- MENU -->

                <div
                  v-if="openMenuId === category.id"
                  class="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-[100]"
                  @click.stop
                >
                  <button
                    type="button"
                    @click="editCategory(category)"
                    class="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-gray-50"
                  >
                    <span class="text-blue-600"> ✏️ </span>

                    <span> Edit </span>
                  </button>

                  <button
                    type="button"
                    @click="deleteCategory(category)"
                    class="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 border-t"
                  >
                    <span> 🗑️ </span>

                    <span> Delete </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- MOBILE STATUS -->

          <div class="sm:hidden mt-3 ml-11">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              :class="
                category.active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              "
            >
              {{ category.active ? "Active" : "Inactive" }}
            </span>
          </div>

          <!-- ======================================== -->
          <!-- SUBCATEGORIES -->
          <!-- ======================================== -->

          <div
            v-if="
              expandedCategories.has(category.id) &&
              getChildren(category.id).length > 0
            "
            class="mt-4 ml-11 space-y-2"
          >
            <div
              v-for="child in getChildren(category.id)"
              :key="child.id"
              class="relative flex items-center justify-between gap-4 bg-gray-50 rounded-lg px-4 py-3 border"
            >
              <!-- LEFT -->

              <div class="flex items-center gap-3 min-w-0">
                <span class="text-gray-400 shrink-0"> └─ </span>

                <span class="text-xl shrink-0"> 📂 </span>

                <div class="min-w-0">
                  <p class="font-semibold text-slate-700 truncate">
                    {{ child.name }}
                  </p>

                  <p class="text-xs text-gray-400 truncate">
                    {{ child.slug }}
                  </p>
                </div>
              </div>

              <!-- RIGHT -->

              <div class="flex items-center gap-3 shrink-0">
                <!-- STATUS -->

                <span
                  class="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                  :class="
                    child.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ child.active ? "Active" : "Inactive" }}
                </span>

                <!-- MENU -->

                <div class="relative">
                  <button
                    type="button"
                    @click.stop="toggleMenu(child.id)"
                    class="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                    title="Actions"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-6 h-6 text-slate-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="5" cy="12" r="2" />

                      <circle cx="12" cy="12" r="2" />

                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>

                  <!-- CHILD MENU -->

                  <div
                    v-if="openMenuId === child.id"
                    class="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-[100]"
                    @click.stop
                  >
                    <button
                      type="button"
                      @click="editCategory(child)"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-gray-50"
                    >
                      <span class="text-blue-600"> ✏️ </span>

                      Edit
                    </button>

                    <button
                      type="button"
                      @click="deleteCategory(child)"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 border-t"
                    >
                      <span> 🗑️ </span>

                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- MODAL -->
    <!-- ============================================ -->

    <Transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <!-- BACKDROP -->

        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

        <!-- MODAL -->

        <div
          class="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6"
        >
          <!-- HEADER -->

          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-slate-800">
              {{ editingCategory ? "Edit Category" : "Add Category" }}
            </h2>

            <button
              type="button"
              @click="closeModal"
              class="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500 text-xl"
            >
              ×
            </button>
          </div>

          <!-- ERROR -->

          <div
            v-if="formError"
            class="mb-5 bg-red-100 border border-red-300 text-red-700 rounded-lg p-3"
          >
            {{ formError }}
          </div>

          <!-- FORM -->

          <form @submit.prevent="saveCategory" class="space-y-5">
            <!-- NAME -->

            <div>
              <label class="block font-semibold text-slate-700 mb-2">
                Category Name
              </label>

              <input
                v-model="newCategory.name"
                type="text"
                required
                autofocus
                placeholder="e.g. Computers"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- PARENT -->

            <div>
              <label class="block font-semibold text-slate-700 mb-2">
                Parent Category
              </label>

              <select
                v-model="newCategory.parent_id"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option :value="null">Main Category</option>

                <option
                  v-for="category in availableParentCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>

              <p class="text-xs text-gray-500 mt-2">
                Select a parent to make this a subcategory.
              </p>
            </div>

            <!-- ACTIVE -->

            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="newCategory.active"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />

                <span class="font-semibold text-slate-700"> Active </span>
              </label>

              <p class="text-sm text-gray-500 mt-1 ml-8">
                Active categories are available for products.
              </p>
            </div>

            <!-- BUTTONS -->

            <div class="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                @click="closeModal"
                class="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="submit"
                :disabled="saving"
                class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {{
                  saving
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : "Add Category"
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// ============================================
// PAGE META
// ============================================

definePageMeta({
  middleware: "admin",
});

// ============================================
// ADMIN FETCH
// ============================================

const { adminFetch } = useAdminFetch();

// ============================================
// STATE
// ============================================

const loading = ref(true);

const saving = ref(false);

const errorMessage = ref("");

const formError = ref("");

const showModal = ref(false);

const categories = ref<any[]>([]);

const openMenuId = ref<string | number | null>(null);

const editingCategory = ref<any | null>(null);

const expandedCategories = ref<Set<string | number>>(new Set());

// ============================================
// FORM
// ============================================

const newCategory = reactive<{
  id: string | number | null;
  name: string;
  parent_id: string | number | null;
  active: boolean;
}>({
  id: null,
  name: "",
  parent_id: null,
  active: true,
});

// ============================================
// MAIN CATEGORIES
// ============================================

const mainCategories = computed(() => {
  return categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
});

// ============================================
// AVAILABLE PARENT CATEGORIES
// ============================================

const availableParentCategories = computed(() => {
  return mainCategories.value.filter(
    (category) => category.id !== editingCategory.value?.id,
  );
});

// ============================================
// GET CHILDREN
// ============================================

const getChildren = (parentId: string | number) => {
  return categories.value
    .filter((category) => String(category.parent_id) === String(parentId))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
};

// ============================================
// TOGGLE CATEGORY
// ============================================

const toggleCategory = (categoryId: string | number) => {
  const updated = new Set(expandedCategories.value);

  if (updated.has(categoryId)) {
    updated.delete(categoryId);
  } else {
    updated.add(categoryId);
  }

  expandedCategories.value = updated;
};

// ============================================
// TOGGLE MENU
// ============================================

const toggleMenu = (categoryId: string | number) => {
  if (openMenuId.value === categoryId) {
    openMenuId.value = null;
  } else {
    openMenuId.value = categoryId;
  }
};

// ============================================
// CLOSE MENU
// ============================================

const closeMenu = () => {
  openMenuId.value = null;
};

onMounted(() => {
  document.addEventListener("click", closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenu);
});

// ============================================
// LOAD CATEGORIES
// ============================================

const loadCategories = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    console.log("=================================");
    console.log("ADMIN FETCH CATEGORIES");
    console.log("=================================");

    const response = await adminFetch("/api/admin/categories");

    console.log("CATEGORY API RESPONSE:", response);
    console.log("CATEGORY RESPONSE TYPE:", typeof response);
    console.log("IS ARRAY:", Array.isArray(response));

    // -----------------------------------------
    // Handle normal array response
    // -----------------------------------------

    if (Array.isArray(response)) {
      categories.value = response;
    }

    // -----------------------------------------
    // Handle { data: [...] }
    // -----------------------------------------
    else if (Array.isArray(response?.data)) {
      categories.value = response.data;
    }

    // -----------------------------------------
    // Anything else
    // -----------------------------------------
    else {
      console.error("INVALID CATEGORY RESPONSE:", response);

      categories.value = [];

      throw new Error("Invalid category response from server.");
    }

    console.log("CATEGORIES LOADED:", categories.value);
    console.log("CATEGORY COUNT:", categories.value.length);

    // -----------------------------------------
    // Validate each category
    // -----------------------------------------

    categories.value.forEach((category, index) => {
      console.log(`CATEGORY ${index}:`, category);
    });
  } catch (error: any) {
    console.error("=================================");
    console.error("🔥 CATEGORY LOAD ERROR");
    console.error("ERROR:", error);
    console.error("ERROR DATA:", error?.data);
    console.error("ERROR MESSAGE:", error?.message);
    console.error("=================================");

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load categories.";

    categories.value = [];
  } finally {
    loading.value = false;
  }
};

// ============================================
// OPEN ADD
// ============================================

const openAddCategory = () => {
  editingCategory.value = null;

  newCategory.id = null;

  newCategory.name = "";

  newCategory.parent_id = null;

  newCategory.active = true;

  formError.value = "";

  openMenuId.value = null;

  showModal.value = true;
};

// ============================================
// EDIT CATEGORY
// ============================================

const editCategory = (category: any) => {
  editingCategory.value = category;

  newCategory.id = category.id;

  newCategory.name = category.name || "";

  newCategory.parent_id = category.parent_id ?? null;

  newCategory.active = category.active !== false;

  formError.value = "";

  openMenuId.value = null;

  showModal.value = true;
};

// ============================================
// CLOSE MODAL
// ============================================

const closeModal = () => {
  showModal.value = false;

  editingCategory.value = null;

  formError.value = "";

  newCategory.id = null;

  newCategory.name = "";

  newCategory.parent_id = null;

  newCategory.active = true;
};

// ============================================
// SLUG
// ============================================

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// ============================================
// SAVE CATEGORY
// ============================================

const saveCategory = async () => {
  if (!newCategory.name.trim()) {
    formError.value = "Please enter a category name.";

    return;
  }

  saving.value = true;

  formError.value = "";

  try {
    // ========================================
    // EDIT
    // ========================================

    if (editingCategory.value) {
      const slug = generateSlug(newCategory.name);

      console.log("🔥 UPDATING CATEGORY:", newCategory.id);

      const response = await adminFetch(
        `/api/admin/categories/${newCategory.id}`,
        {
          method: "PUT",
          body: {
            name: newCategory.name.trim(),
            slug,
            parent_id: newCategory.parent_id,
            active: newCategory.active,
          },
        },
      );

      console.log("✅ CATEGORY UPDATED:", response);
    }

    // ========================================
    // ADD
    // ========================================
    else {
      console.log("🔥 CREATING CATEGORY:", newCategory.name);

      const response = await adminFetch("/api/admin/categories", {
        method: "POST",
        body: {
          name: newCategory.name.trim(),
          parent_id: newCategory.parent_id,
          active: newCategory.active,
        },
      });

      console.log("✅ CATEGORY CREATED:", response);
    }

    // ========================================
    // RESET
    // ========================================

    closeModal();

    // ========================================
    // RELOAD
    // ========================================

    await loadCategories();
  } catch (error: any) {
    console.error("🔥 SAVE CATEGORY ERROR:", error);

    formError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to save category.";
  } finally {
    saving.value = false;
  }
};

// ============================================
// DELETE CATEGORY
// ============================================

const deleteCategory = async (category: any) => {
  openMenuId.value = null;

  const children = getChildren(category.id);

  let message = `Are you sure you want to delete "${category.name}"?`;

  if (children.length > 0) {
    message += `\n\nThis category has ${children.length} subcategor${
      children.length === 1 ? "y" : "ies"
    }.`;
  }

  message += "\n\nThis action cannot be undone.";

  const confirmed = window.confirm(message);

  if (!confirmed) {
    return;
  }

  try {
    console.log("🔥 DELETING CATEGORY:", category.id);

    await adminFetch(`/api/admin/categories/${category.id}`, {
      method: "DELETE",
    });

    console.log("✅ CATEGORY DELETED:", category.id);

    await loadCategories();
  } catch (error: any) {
    console.error("🔥 DELETE CATEGORY ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete category.";
  }
};

// ============================================
// INITIAL LOAD
// ============================================

onMounted(async () => {
  await loadCategories();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
