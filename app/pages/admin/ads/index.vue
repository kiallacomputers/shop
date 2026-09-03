<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Admin Dashboard
          </NuxtLink>
          <p class="mt-4 text-sm font-semibold uppercase tracking-wider text-blue-600">Administration</p>
          <h1 class="mt-1 text-3xl font-bold text-slate-900">Advertisement Management</h1>
          <p class="mt-2 text-slate-500">Manage storefront promotional banners. Recommended size: 1600 × 900 px.</p>
        </div>
        <button
          type="button"
          class="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700"
          @click="startNew"
        >
          + New Advertisement
        </button>
      </div>

      <div v-if="errorMessage" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        {{ successMessage }}
      </div>

      <section v-if="showForm" class="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-slate-900">{{ editingId ? "Edit Advertisement" : "New Advertisement" }}</h2>
            <p class="mt-1 text-sm text-slate-500">Keep important text and logos away from the far left and right edges.</p>
          </div>
          <button type="button" class="text-sm font-semibold text-slate-500 hover:text-slate-900" @click="cancelEdit">Cancel</button>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <div class="space-y-4">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Title</span>
              <input v-model="form.title" type="text" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" placeholder="e.g. Back to School" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Destination Link</span>
              <input v-model="form.link_url" type="text" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" placeholder="/category/laptops or https://..." />
            </label>

            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Sort Order</span>
                <input v-model.number="form.sort_order" type="number" step="1" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" />
              </label>
              <label class="flex items-end">
                <span class="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <input v-model="form.active" type="checkbox" class="h-4 w-4" />
                  <span class="font-semibold text-slate-700">Active</span>
                </span>
              </label>
            </div>

            <div>
              <span class="mb-2 block text-sm font-semibold text-slate-700">Banner Image</span>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  {{ uploading ? "Uploading..." : "Upload Banner" }}
                  <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" :disabled="uploading" @change="uploadImage" />
                </label>
                <span class="text-xs text-slate-500">JPG, PNG or WebP · ideally 1600 × 900 px</span>
              </div>
              <input v-model="form.image_url" type="text" class="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" placeholder="Image URL" />
            </div>

            <button
              type="button"
              :disabled="saving || uploading"
              class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              @click="saveAd"
            >
              {{ saving ? "Saving..." : editingId ? "Save Changes" : "Create Advertisement" }}
            </button>
          </div>

          <div>
            <p class="mb-2 text-sm font-semibold text-slate-700">Preview</p>
            <div class="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img v-if="form.image_url" :src="form.image_url" :alt="form.title || 'Banner preview'" class="h-full w-full object-contain" />
              <div v-else class="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">Upload a banner to preview it here.</div>
            </div>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-6 py-5">
          <h2 class="text-lg font-bold text-slate-900">Storefront Advertisements</h2>
          <p class="mt-1 text-sm text-slate-500">Active advertisements rotate automatically on the storefront.</p>
        </div>

        <div v-if="loading" class="p-10 text-center text-slate-500">Loading advertisements...</div>
        <div v-else-if="ads.length === 0" class="p-10 text-center text-slate-500">No advertisements have been created yet.</div>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="ad in ads" :key="ad.id" class="grid gap-4 p-5 md:grid-cols-[220px_1fr_auto] md:items-center">
            <div class="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img :src="ad.image_url" :alt="ad.title" class="h-full w-full object-contain" />
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-slate-900">{{ ad.title }}</h3>
                <span :class="ad.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'" class="rounded-full px-2.5 py-1 text-xs font-bold">
                  {{ ad.active ? "Active" : "Inactive" }}
                </span>
              </div>
              <p class="mt-1 truncate text-sm text-slate-500">{{ ad.link_url || "#shop" }}</p>
              <p class="mt-1 text-xs text-slate-400">Sort order: {{ ad.sort_order ?? 0 }}</p>
            </div>

            <div class="flex gap-2 md:justify-end">
              <button type="button" class="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50" @click="editAd(ad)">Edit</button>
              <button type="button" :disabled="deletingId === String(ad.id)" class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50" @click="deleteAd(ad)">
                {{ deletingId === String(ad.id) ? "Deleting..." : "Delete" }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });

type AdRecord = {
  id: string | number;
  title: string;
  image_url: string;
  link_url?: string | null;
  active: boolean;
  sort_order?: number | null;
};

const { adminFetch } = useAdminFetch();
const ads = ref<AdRecord[]>([]);
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const deletingId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const showForm = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const blankForm = () => ({ title: "", image_url: "", link_url: "#shop", active: true, sort_order: 0 });
const form = reactive(blankForm());

const loadAds = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    ads.value = await adminFetch<AdRecord[]>("/api/admin/ads");
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to load advertisements.";
  } finally {
    loading.value = false;
  }
};

const startNew = () => {
  editingId.value = null;
  Object.assign(form, blankForm(), { sort_order: ads.value.length });
  showForm.value = true;
  successMessage.value = "";
};

const editAd = (ad: AdRecord) => {
  editingId.value = String(ad.id);
  Object.assign(form, {
    title: ad.title || "",
    image_url: ad.image_url || "",
    link_url: ad.link_url || "#shop",
    active: ad.active !== false,
    sort_order: Number(ad.sort_order ?? 0),
  });
  showForm.value = true;
  successMessage.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const cancelEdit = () => {
  showForm.value = false;
  editingId.value = null;
};

const uploadImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploading.value = true;
  errorMessage.value = "";
  try {
    const body = new FormData();
    body.append("file", file);
    const result = await adminFetch<{ url: string }>("/api/admin/ads/upload-image", { method: "POST", body });
    form.image_url = result.url;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to upload banner.";
  } finally {
    uploading.value = false;
    input.value = "";
  }
};

const saveAd = async () => {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const url = editingId.value ? `/api/admin/ads/${editingId.value}` : "/api/admin/ads";
    await adminFetch(url, {
      method: editingId.value ? "PUT" : "POST",
      body: { ...form },
    });
    successMessage.value = editingId.value ? "Advertisement updated." : "Advertisement created.";
    showForm.value = false;
    editingId.value = null;
    await loadAds();
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to save advertisement.";
  } finally {
    saving.value = false;
  }
};

const deleteAd = async (ad: AdRecord) => {
  if (!window.confirm(`Delete advertisement “${ad.title}”?`)) return;
  deletingId.value = String(ad.id);
  errorMessage.value = "";
  try {
    await adminFetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    ads.value = ads.value.filter((item) => String(item.id) !== String(ad.id));
    successMessage.value = "Advertisement deleted.";
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to delete advertisement.";
  } finally {
    deletingId.value = null;
  }
};

onMounted(loadAds);
</script>
