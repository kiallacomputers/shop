<template>
  <main class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <NuxtLink
          to="/admin"
          class="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Admin Dashboard
        </NuxtLink>

        <p class="mt-4 text-sm font-black uppercase tracking-[0.16em] text-cyan-600">
          Storage Maintenance
        </p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">
          Unused Product Images
        </h1>
        <p class="mt-2 max-w-3xl text-slate-500">
          Images shown here exist in the Supabase <strong>products</strong>
          storage bucket but are not referenced by any current product.
          Advertisement files are excluded automatically.
        </p>
      </div>

      <button
        type="button"
        :disabled="loading || deleting"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        @click="loadUnused"
      >
        {{ loading ? "Scanning..." : "Scan Again" }}
      </button>
    </div>

    <div
      class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900"
    >
      <strong>Safety check:</strong>
      the server checks every selected image against the products table again
      immediately before deletion. If an image has become attached to a product,
      the delete operation is stopped.
    </div>

    <div
      v-if="errorMessage"
      class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      {{ successMessage }}
    </div>

    <div
      v-if="summary"
      class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-wide text-slate-400">
          Images scanned
        </p>
        <p class="mt-2 text-2xl font-black text-slate-900">
          {{ summary.scanned_files }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-wide text-slate-400">
          In use
        </p>
        <p class="mt-2 text-2xl font-black text-emerald-700">
          {{ summary.referenced_files }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-wide text-slate-400">
          Unused
        </p>
        <p class="mt-2 text-2xl font-black text-amber-700">
          {{ summary.unused_files }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-wide text-slate-400">
          Recoverable
        </p>
        <p class="mt-2 text-2xl font-black text-slate-900">
          {{ formatBytes(summary.unused_bytes) }}
        </p>
      </div>
    </div>

    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm"
    >
      Scanning the products bucket and checking product references...
    </div>

    <template v-else>
      <section
        v-if="files.length"
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300"
              :checked="allSelected"
              @change="toggleAll"
            />
            Select all unused images
          </label>

          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-500">
              {{ selectedPaths.length }} selected
            </span>
            <button
              type="button"
              :disabled="!selectedPaths.length || deleting"
              class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              @click="deleteSelected"
            >
              {{ deleting ? "Deleting..." : "Delete Selected" }}
            </button>
          </div>
        </div>

        <div class="grid gap-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <article
            v-for="file in files"
            :key="file.path"
            class="border-b border-r border-slate-100 p-4"
          >
            <label class="block cursor-pointer">
              <div class="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  :src="file.url"
                  :alt="file.name"
                  loading="lazy"
                  class="h-full w-full object-contain p-2"
                />
                <input
                  v-model="selectedPaths"
                  :value="file.path"
                  type="checkbox"
                  class="absolute left-3 top-3 h-5 w-5 rounded border-slate-300 bg-white shadow"
                />
              </div>

              <p
                class="mt-3 break-all text-sm font-bold text-slate-800"
                :title="file.path"
              >
                {{ file.name }}
              </p>
              <p class="mt-1 break-all text-xs text-slate-400">
                {{ file.path }}
              </p>

              <div class="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{{ formatBytes(file.size) }}</span>
                <span>{{ formatDate(file.created_at) }}</span>
              </div>
            </label>
          </article>
        </div>
      </section>

      <div
        v-else
        class="rounded-xl border border-emerald-200 bg-emerald-50 p-10 text-center"
      >
        <p class="text-lg font-bold text-emerald-800">
          No unused product images found
        </p>
        <p class="mt-2 text-sm text-emerald-700">
          Every product image currently in the scanned area of the storage
          bucket is referenced by a product.
        </p>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });

type StorageFile = {
  name: string;
  path: string;
  url: string;
  size: number | null;
  created_at: string | null;
  updated_at: string | null;
  mime_type: string | null;
};

type CleanupResponse = {
  bucket: string;
  scanned_files: number;
  referenced_files: number;
  unused_files: number;
  unused_bytes: number;
  files: StorageFile[];
};

const { adminFetch } = useAdminFetch();

const loading = ref(true);
const deleting = ref(false);
const files = ref<StorageFile[]>([]);
const summary = ref<CleanupResponse | null>(null);
const selectedPaths = ref<string[]>([]);
const errorMessage = ref("");
const successMessage = ref("");

const allSelected = computed(
  () =>
    files.value.length > 0 &&
    selectedPaths.value.length === files.value.length,
);

const formatBytes = (value: unknown) => {
  const bytes = Number(value || 0);
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const loadUnused = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  selectedPaths.value = [];

  try {
    const result = await adminFetch<CleanupResponse>(
      "/api/admin/storage-cleanup",
    );

    summary.value = result;
    files.value = result?.files || [];
  } catch (error: any) {
    files.value = [];
    summary.value = null;
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to scan product storage.";
  } finally {
    loading.value = false;
  }
};

const toggleAll = () => {
  selectedPaths.value = allSelected.value
    ? []
    : files.value.map((file) => file.path);
};

const deleteSelected = async () => {
  if (!selectedPaths.value.length) return;

  const count = selectedPaths.value.length;
  const confirmed = window.confirm(
    `Permanently delete ${count} unused image${count === 1 ? "" : "s"} from Supabase Storage?\n\nThis cannot be undone.`,
  );

  if (!confirmed) return;

  deleting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await adminFetch("/api/admin/storage-cleanup", {
      method: "DELETE",
      body: {
        paths: selectedPaths.value,
      },
    });

    successMessage.value =
      `${count} unused image${count === 1 ? "" : "s"} deleted from storage.`;

    await loadUnused();
    successMessage.value =
      `${count} unused image${count === 1 ? "" : "s"} deleted from storage.`;
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to delete the selected images.";
  } finally {
    deleting.value = false;
  }
};

onMounted(loadUnused);
</script>
