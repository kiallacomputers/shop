<template>
  <div class="border rounded-xl p-4 hover:shadow-md transition bg-white">
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      <!-- IMAGE -->

      <div
        class="w-full md:w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
      >
        <img
          v-if="firstImage"
          :src="firstImage"
          :alt="product.name"
          class="max-w-full max-h-full object-contain"
        />

        <span v-else class="text-xs text-gray-400"> No Image </span>
      </div>

      <!-- PRODUCT -->

      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-slate-800">
          {{ product.name }}
        </h3>

        <p class="text-sm text-gray-500 mt-1">ID: {{ product.id }}</p>

        <div class="flex flex-wrap gap-3 mt-2 text-sm">
          <!-- PRICE -->

          <span class="font-semibold text-[#2CB6D5]">
            ${{ product.price }}
          </span>

          <!-- STOCK -->

          <span :class="product.stock > 0 ? 'text-green-600' : 'text-red-600'">
            Stock: {{ product.stock }}
          </span>

          <!-- FEATURED -->

          <span
            v-if="product.featured"
            class="px-2 py-1 bg-red-100 text-red-700 rounded"
          >
            Featured
          </span>

          <!-- REFURBISHED -->

          <span
            v-if="product.refurbished"
            class="px-2 py-1 bg-orange-100 text-orange-700 rounded"
          >
            Refurbished
          </span>

          <!-- MULTIPLE IMAGES -->

          <span
            v-if="product.images?.length > 1"
            class="px-2 py-1 bg-blue-100 text-blue-700 rounded"
          >
            {{ product.images.length }} images
          </span>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- THREE DOT MENU -->
      <!-- ========================================== -->

      <div class="relative shrink-0">
        <!-- MENU BUTTON -->

        <button
          type="button"
          @click.stop="toggleMenu"
          class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          aria-label="Product actions"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
          </svg>
        </button>

        <!-- ======================================== -->
        <!-- POPUP MENU -->
        <!-- ======================================== -->

        <Transition name="menu">
          <div
            v-if="menuOpen"
            class="absolute right-0 top-12 z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          >
            <!-- VIEW -->

            <NuxtLink
              :to="`/product/${product.slug}`"
              @click="closeMenu"
              class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>

              <span> View </span>
            </NuxtLink>

            <!-- EDIT -->

            <NuxtLink
              :to="`/admin/products/edit/${product.id}`"
              @click="closeMenu"
              class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.862 4.487a2.25 2.25 0 113.182 3.182L8.25 19.463 4 20.5l1.037-4.25L16.862 4.487z"
                />
              </svg>

              <span> Edit </span>
            </NuxtLink>

            <!-- DIVIDER -->

            <div class="border-t border-gray-100"></div>

            <!-- DELETE -->

            <button
              type="button"
              @click="openDeleteConfirmation"
              :disabled="deletingId === product.id"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 7h12M9 7V4h6v3m-7 0v12a2 2 0 002 2h4a2 2 0 002-2V7M10 11v6M14 11v6"
                />
              </svg>

              <span>
                {{ deletingId === product.id ? "Deleting..." : "Delete" }}
              </span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- DELETE CONFIRMATION MODAL -->
    <!-- ================================================= -->

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteConfirmation"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <!-- BACKDROP -->

          <div class="absolute inset-0 bg-black/50" @click="cancelDelete"></div>

          <!-- MODAL -->

          <div
            class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6"
          >
            <!-- WARNING ICON -->

            <div
              class="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-7 h-7 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.02 14A2 2 0 004 21h16a2 2 0 001.73-3l-8.02-14a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <!-- TITLE -->

            <h2 class="text-xl font-bold text-slate-800 text-center">
              Delete Product?
            </h2>

            <!-- MESSAGE -->

            <p class="text-gray-600 text-center mt-3">
              Are you sure you really want to delete this product?
            </p>

            <!-- PRODUCT NAME -->

            <div class="mt-4 p-3 bg-gray-50 rounded-lg border text-center">
              <p class="font-semibold text-slate-800">
                {{ product.name }}
              </p>

              <p class="text-sm text-gray-500 mt-1">
                Product ID: {{ product.id }}
              </p>
            </div>

            <!-- WARNING -->

            <p class="text-sm text-red-600 text-center mt-4">
              ⚠ This action cannot be undone.
            </p>

            <!-- BUTTONS -->

            <div class="flex gap-3 mt-6">
              <!-- CANCEL -->

              <button
                type="button"
                @click="cancelDelete"
                :disabled="deletingId === product.id"
                class="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                Cancel
              </button>

              <!-- DELETE -->

              <button
                type="button"
                @click="confirmDelete"
                :disabled="deletingId === product.id"
                class="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {{
                  deletingId === product.id ? "Deleting..." : "Delete Product"
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// =====================================================
// PROPS
// =====================================================

const props = defineProps<{
  product: any;
  deletingId: number | null;
}>();

// =====================================================
// EMITS
// =====================================================

const emit = defineEmits<{
  delete: [product: any];
}>();

// =====================================================
// MENU
// =====================================================

const menuOpen = ref(false);

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

// =====================================================
// DELETE CONFIRMATION
// =====================================================

const showDeleteConfirmation = ref(false);

const openDeleteConfirmation = () => {
  menuOpen.value = false;

  showDeleteConfirmation.value = true;
};

const cancelDelete = () => {
  if (props.deletingId === props.product.id) {
    return;
  }

  showDeleteConfirmation.value = false;
};

const confirmDelete = () => {
  if (props.deletingId === props.product.id) {
    return;
  }

  showDeleteConfirmation.value = false;

  emit("delete", props.product);
};

// =====================================================
// FIRST IMAGE
// =====================================================

const firstImage = computed(() => {
  const images = props.product?.images;

  if (!Array.isArray(images)) {
    return "";
  }

  return (
    images.find(
      (image: any) => typeof image === "string" && image.trim() !== "",
    ) || ""
  );
});

// =====================================================
// CLOSE MENU WHEN CLICKING OUTSIDE
// =====================================================

const handleDocumentClick = () => {
  menuOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
