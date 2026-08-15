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
        <!-- BACK TO ADMIN -->

        <NuxtLink
          to="/admin"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
        >
          ← Admin Menu
        </NuxtLink>

        <!-- ADD CATEGORY -->

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

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
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

      <!-- CATEGORIES -->

      <div v-else class="divide-y">
        <div v-for="category in mainCategories" :key="category.id" class="p-5">
          <!-- MAIN CATEGORY -->

          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div class="flex items-center gap-3">
              <!-- COLLAPSE -->

              <button
                v-if="getChildren(category.id).length"
                type="button"
                @click="toggleCategory(category.id)"
                class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
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

              <div v-else class="w-8"></div>

              <!-- FOLDER -->

              <span class="text-2xl"> 📁 </span>

              <div>
                <h2 class="font-bold text-lg text-slate-800">
                  {{ category.name }}
                </h2>

                <p class="text-sm text-gray-500">
                  {{ getChildren(category.id).length }}
                  subcategor{{
                    getChildren(category.id).length === 1 ? "y" : "ies"
                  }}
                </p>
              </div>
            </div>

            <!-- STATUS -->

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

          <!-- SUBCATEGORIES -->

          <div
            v-if="
              expandedCategories.has(category.id) &&
              getChildren(category.id).length
            "
            class="mt-4 ml-11 space-y-2"
          >
            <div
              v-for="child in getChildren(category.id)"
              :key="child.id"
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 rounded-lg px-4 py-3 border"
            >
              <div class="flex items-center gap-3">
                <span class="text-gray-400"> └─ </span>

                <span class="text-xl"> 📂 </span>

                <div>
                  <p class="font-semibold text-slate-700">
                    {{ child.name }}
                  </p>

                  <p class="text-xs text-gray-400">
                    {{ child.slug }}
                  </p>
                </div>
              </div>

              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                :class="
                  child.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{ child.active ? "Active" : "Inactive" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ADD CATEGORY MODAL -->
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
            <h2 class="text-2xl font-bold text-slate-800">Add Category</h2>

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

          <form @submit.prevent="addCategory" class="space-y-5">
            <!-- CATEGORY NAME -->

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

            <!-- PARENT CATEGORY -->

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
                  v-for="category in mainCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>

              <p class="text-xs text-gray-500 mt-2">
                Select a parent to create a subcategory.
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
                {{ saving ? "Adding..." : "Add Category" }}
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

const adminFetch = useAdminFetch();

// ============================================
// STATE
// ============================================

const loading = ref(true);

const saving = ref(false);

const errorMessage = ref("");

const formError = ref("");

const showModal = ref(false);

const categories = ref<any[]>([]);

const expandedCategories = ref<Set<string | number>>(new Set());

// ============================================
// NEW CATEGORY
// ============================================

const newCategory = reactive({
  name: "",
  parent_id: null as string | number | null,
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
// GET CHILDREN
// ============================================

const getChildren = (parentId: string | number) => {
  return categories.value
    .filter((category) => category.parent_id === parentId)
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
// LOAD CATEGORIES
// ============================================

const loadCategories = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    const response = await adminFetch("/api/admin/categories");

    categories.value = Array.isArray(response) ? response : [];

    console.log("✅ CATEGORIES:", categories.value);
  } catch (error: any) {
    console.error("🔥 CATEGORY LOAD ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load categories.";
  } finally {
    loading.value = false;
  }
};

// ============================================
// OPEN MODAL
// ============================================

const openAddCategory = () => {
  newCategory.name = "";

  newCategory.parent_id = null;

  newCategory.active = true;

  formError.value = "";

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

  formError.value = "";
};

// ============================================
// ADD CATEGORY
// ============================================

const addCategory = async () => {
  if (!newCategory.name.trim()) {
    formError.value = "Please enter a category name.";

    return;
  }

  saving.value = true;

  formError.value = "";

  try {
    const response = await adminFetch("/api/admin/categories", {
      method: "POST",

      body: {
        name: newCategory.name.trim(),

        parent_id: newCategory.parent_id,

        active: newCategory.active,
      },
    });

    console.log("✅ CATEGORY CREATED:", response);

    showModal.value = false;

    newCategory.name = "";

    newCategory.parent_id = null;

    newCategory.active = true;

    await loadCategories();
  } catch (error: any) {
    console.error("🔥 CREATE CATEGORY ERROR:", error);

    formError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to create category.";
  } finally {
    saving.value = false;
  }
};

// ============================================
// LOAD
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
