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

      <div class="flex flex-col sm:flex-row gap-3">
        <!-- BACK TO ADMIN -->

        <NuxtLink
          to="/admin"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 font-semibold rounded-lg transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>

          Back to Admin
        </NuxtLink>

        <!-- ADD CATEGORY -->

        <button
          type="button"
          @click="openAddModal()"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>

          Add Category
        </button>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ERROR -->
    <!-- ============================================ -->

    <div
      v-if="errorMessage"
      class="mb-6 bg-red-100 border border-red-300 text-red-700 rounded-lg p-4"
    >
      {{ errorMessage }}
    </div>

    <!-- ============================================ -->
    <!-- LOADING -->
    <!-- ============================================ -->

    <div v-if="loading" class="bg-white rounded-lg shadow p-12 text-center">
      <div class="flex justify-center mb-4">
        <div
          class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
        ></div>
      </div>

      <p class="text-gray-500">Loading categories...</p>
    </div>

    <!-- ============================================ -->
    <!-- CATEGORY LIST -->
    <!-- ============================================ -->

    <div v-else class="bg-white rounded-lg shadow overflow-visible">
      <!-- HEADER -->

      <div
        class="hidden md:grid grid-cols-[1fr_180px_80px] gap-4 px-6 py-4 bg-gray-50 border-b font-semibold text-gray-600"
      >
        <div>Category</div>

        <div>Sort Order</div>

        <div class="text-right">Actions</div>
      </div>

      <!-- EMPTY -->

      <div v-if="mainCategories.length === 0" class="p-12 text-center">
        <div class="text-gray-400 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-12 h-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M3 7.5A2.5 2.5 0 015.5 5h4l2 2h7A2.5 2.5 0 0121 9.5v7a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9z"
            />
          </svg>
        </div>

        <p class="text-gray-500">No categories found.</p>

        <button
          type="button"
          @click="openAddModal()"
          class="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
        >
          Create your first category
        </button>
      </div>

      <!-- CATEGORY TREE -->

      <div
        v-for="category in mainCategories"
        :key="category.id"
        class="border-b last:border-b-0"
      >
        <!-- MAIN CATEGORY -->

        <div
          class="relative grid grid-cols-[1fr_auto] md:grid-cols-[1fr_180px_80px] gap-4 items-center px-4 md:px-6 py-4 hover:bg-gray-50"
        >
          <!-- CATEGORY NAME -->

          <div class="flex items-center gap-3 min-w-0">
            <!-- EXPAND -->

            <button
              v-if="category.children.length"
              type="button"
              @click="toggleCategory(category.id)"
              class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 shrink-0"
              :title="
                expandedCategories.has(category.id) ? 'Collapse' : 'Expand'
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 transition-transform"
                :class="expandedCategories.has(category.id) ? 'rotate-90' : ''"
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

            <span v-else class="w-8 shrink-0"></span>

            <!-- FOLDER -->

            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-blue-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M3 7.5A2.5 2.5 0 015.5 5h4l2 2h7A2.5 2.5 0 0119 9.5v7a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9z"
              />
            </svg>

            <div class="min-w-0">
              <div class="font-bold text-slate-800 truncate">
                {{ category.name }}
              </div>

              <div class="text-xs text-gray-500">
                Main Category

                <span v-if="category.children.length">
                  · {{ category.children.length }} subcategor{{
                    category.children.length === 1 ? "y" : "ies"
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- SORT -->

          <div class="hidden md:block text-gray-600">
            {{ category.sort_order ?? 0 }}
          </div>

          <!-- ACTIONS -->

          <div class="relative flex justify-end">
            <button
              type="button"
              @click.stop="toggleMenu(category.id)"
              class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600"
              title="Actions"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>

            <!-- MENU -->

            <div
              v-if="openMenu === category.id"
              class="absolute right-0 top-10 z-[100] w-44 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
              @click.stop
            >
              <button
                type="button"
                @click="editCategory(category)"
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16.862 3.487a2.25 2.25 0 013.182 3.182L8.25 18.463 4 19.5l1.037-4.25L16.862 3.487z"
                  />
                </svg>

                <span>Edit</span>
              </button>

              <button
                type="button"
                @click="deleteCategory(category)"
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 text-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 7h12M9 7V4h6v3m-8 0l1 13h8l1-13M10 11v6m4-6v6"
                  />
                </svg>

                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        <!-- SUB CATEGORIES -->

        <div
          v-if="expandedCategories.has(category.id) && category.children.length"
          class="bg-gray-50 border-t"
        >
          <div
            v-for="child in category.children"
            :key="child.id"
            class="relative grid grid-cols-[1fr_auto] md:grid-cols-[1fr_180px_80px] gap-4 items-center px-4 md:px-6 py-3 pl-16 md:pl-20 border-b last:border-b-0 hover:bg-gray-100"
          >
            <!-- CHILD NAME -->

            <div class="flex items-center gap-3 min-w-0">
              <span class="text-gray-400"> └─ </span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-slate-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M3 7.5A2.5 2.5 0 015.5 5h4l2 2h7A2.5 2.5 0 0119 9.5v7a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9z"
                />
              </svg>

              <div class="min-w-0">
                <div class="font-semibold text-slate-700 truncate">
                  {{ child.name }}
                </div>

                <div class="text-xs text-gray-500">Subcategory</div>
              </div>
            </div>

            <!-- SORT -->

            <div class="hidden md:block text-gray-600">
              {{ child.sort_order ?? 0 }}
            </div>

            <!-- ACTIONS -->

            <div class="relative flex justify-end">
              <button
                type="button"
                @click.stop="toggleMenu(child.id)"
                class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600"
                title="Actions"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              </button>

              <!-- MENU -->

              <div
                v-if="openMenu === child.id"
                class="absolute right-0 top-10 z-[100] w-44 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                @click.stop
              >
                <button
                  type="button"
                  @click="editCategory(child)"
                  class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16.862 3.487a2.25 2.25 0 013.182 3.182L8.25 18.463 4 19.5l1.037-4.25L16.862 3.487z"
                    />
                  </svg>

                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  @click="deleteCategory(child)"
                  class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 text-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 7h12M9 7V4h6v3m-8 0l1 13h8l1-13M10 11v6m4-6v6"
                    />
                  </svg>

                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ADD / EDIT MODAL -->
    <!-- ============================================ -->

    <div
      v-if="showModal"
      class="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <!-- MODAL HEADER -->

        <div class="flex items-center justify-between px-6 py-5 border-b">
          <h2 class="text-xl font-bold text-slate-800">
            {{ editingCategory ? "Edit Category" : "Add Category" }}
          </h2>

          <button
            type="button"
            @click="closeModal"
            class="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        <!-- FORM -->

        <form @submit.prevent="saveCategory" class="p-6 space-y-5">
          <!-- NAME -->

          <div>
            <label class="block font-semibold mb-2"> Category Name </label>

            <input
              v-model="categoryForm.name"
              type="text"
              required
              autofocus
              class="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Computers"
            />
          </div>

          <!-- PARENT -->

          <div>
            <label class="block font-semibold mb-2"> Parent Category </label>

            <select
              v-model="categoryForm.parent_id"
              class="w-full border rounded-lg px-4 py-3 bg-white"
            >
              <option :value="null">Main Category</option>

              <option
                v-for="category in parentOptions"
                :key="category.id"
                :value="category.id"
                :disabled="editingCategory?.id === category.id"
              >
                {{ category.name }}
              </option>
            </select>

            <p class="text-xs text-gray-500 mt-2">
              Select a parent to make this a subcategory.
            </p>
          </div>

          <!-- SORT ORDER -->

          <div>
            <label class="block font-semibold mb-2"> Sort Order </label>

            <input
              v-model.number="categoryForm.sort_order"
              type="number"
              min="0"
              class="w-full border rounded-lg px-4 py-3"
            />

            <p class="text-xs text-gray-500 mt-2">
              Lower numbers appear first.
            </p>
          </div>

          <!-- ERROR -->

          <div
            v-if="modalError"
            class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-3 text-sm"
          >
            {{ modalError }}
          </div>

          <!-- BUTTONS -->

          <div class="flex justify-end gap-3 pt-3">
            <button
              type="button"
              @click="closeModal"
              class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              :disabled="saving"
              class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
            >
              {{ saving ? "Saving..." : "Save Category" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

// ============================================
// ADMIN FETCH
// ============================================

const adminFetch = useAdminFetch();

// ============================================
// STATE
// ============================================

const loading = ref(true);

const saving = ref(false);

const errorMessage = ref("");

const modalError = ref("");

const openMenu = ref<number | string | null>(null);

const expandedCategories = ref<Set<number | string>>(new Set());

const showModal = ref(false);

const editingCategory = ref<any>(null);

const categories = ref<any[]>([]);

// ============================================
// FORM
// ============================================

const categoryForm = reactive({
  name: "",
  parent_id: null as number | string | null,
  sort_order: 0,
});

// ============================================
// SORT CATEGORIES
// ============================================

const sortCategories = (items: any[]) => {
  return [...items].sort((a, b) => {
    const orderA = Number(a.sort_order ?? 0);
    const orderB = Number(b.sort_order ?? 0);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
};

// ============================================
// CATEGORY TREE
// ============================================

const mainCategories = computed(() => {
  const parents = categories.value.filter((category) => !category.parent_id);

  return sortCategories(parents).map((parent) => ({
    ...parent,

    children: sortCategories(
      categories.value.filter(
        (category) => String(category.parent_id) === String(parent.id),
      ),
    ),
  }));
});

// ============================================
// PARENT OPTIONS
// ============================================

const parentOptions = computed(() => {
  return sortCategories(
    categories.value.filter((category) => !category.parent_id),
  );
});

// ============================================
// LOAD CATEGORIES
// ============================================

const loadCategories = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    const response = await adminFetch("/api/admin/categories");

    categories.value = Array.isArray(response) ? response : [];
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load categories.";
  } finally {
    loading.value = false;
  }
};

// ============================================
// TOGGLE CATEGORY
// ============================================

const toggleCategory = (id: number | string) => {
  const next = new Set(expandedCategories.value);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  expandedCategories.value = next;
};

// ============================================
// ACTION MENU
// ============================================

const toggleMenu = (id: number | string) => {
  if (openMenu.value === id) {
    openMenu.value = null;
  } else {
    openMenu.value = id;
  }
};

// ============================================
// ADD MODAL
// ============================================

const openAddModal = (parentId: number | string | null = null) => {
  openMenu.value = null;

  editingCategory.value = null;

  categoryForm.name = "";

  categoryForm.parent_id = parentId;

  categoryForm.sort_order = 0;

  modalError.value = "";

  showModal.value = true;
};

// ============================================
// EDIT
// ============================================

const editCategory = (category: any) => {
  openMenu.value = null;

  editingCategory.value = category;

  categoryForm.name = category.name || "";

  categoryForm.parent_id = category.parent_id ?? null;

  categoryForm.sort_order = Number(category.sort_order ?? 0);

  modalError.value = "";

  showModal.value = true;
};

// ============================================
// CLOSE MODAL
// ============================================

const closeModal = () => {
  if (saving.value) {
    return;
  }

  showModal.value = false;

  editingCategory.value = null;

  modalError.value = "";
};

// ============================================
// SAVE
// ============================================

const saveCategory = async () => {
  saving.value = true;

  modalError.value = "";

  try {
    const payload = {
      name: categoryForm.name.trim(),

      parent_id: categoryForm.parent_id || null,

      sort_order: Number(categoryForm.sort_order) || 0,
    };

    if (!payload.name) {
      throw new Error("Category name is required.");
    }

    // ========================================
    // UPDATE
    // ========================================

    if (editingCategory.value) {
      await adminFetch(`/api/admin/categories/${editingCategory.value.id}`, {
        method: "PUT",
        body: payload,
      });
    }

    // ========================================
    // CREATE
    // ========================================
    else {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: payload,
      });
    }

    closeModal();

    await loadCategories();
  } catch (error: any) {
    console.error("🔥 SAVE CATEGORY ERROR:", error);

    modalError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to save category.";
  } finally {
    saving.value = false;
  }
};

// ============================================
// DELETE
// ============================================

const deleteCategory = async (category: any) => {
  openMenu.value = null;

  const confirmed = window.confirm(
    `Are you sure you want to delete "${category.name}"?\n\nThis action cannot be undone.`,
  );

  if (!confirmed) {
    return;
  }

  try {
    await adminFetch(`/api/admin/categories/${category.id}`, {
      method: "DELETE",
    });

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
// CLOSE MENU WHEN CLICKING ELSEWHERE
// ============================================

const closeMenu = () => {
  openMenu.value = null;
};

onMounted(() => {
  document.addEventListener("click", closeMenu);

  loadCategories();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenu);
});
</script>
