
<template>
  <main class="min-h-screen bg-slate-50">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-8">
        <NuxtLink
          to="/admin"
          class="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Admin Dashboard
        </NuxtLink>

        <h1 class="mt-3 text-3xl font-bold text-slate-900">
          Manage Freight
        </h1>

        <p class="mt-1 text-slate-500">
          Configure Australia Post freight and free-delivery postcodes.
        </p>
      </div>

      <div
        v-if="errorMessage"
        class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700"
      >
        {{ successMessage }}
      </div>

      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500"
      >
        Loading freight settings...
      </div>

      <template v-else>
        <section
          class="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 class="text-lg font-bold text-slate-900">
            Australia Post Settings
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            The origin postcode is the postcode parcels are lodged/sent from.
          </p>

          <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label>
              <span class="mb-2 block text-sm font-semibold text-slate-700">
                Origin Postcode
              </span>

              <input
                v-model="settings.origin_postcode"
                type="text"
                inputmode="numeric"
                maxlength="4"
                placeholder="e.g. 3631"
                class="w-full rounded-lg border border-slate-300 px-4 py-2.5"
              />
            </label>

            <div class="flex items-end">
              <label
                class="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
              >
                <input
                  v-model="settings.enabled"
                  type="checkbox"
                  class="h-4 w-4"
                />

                <span class="font-semibold text-slate-700">
                  Freight calculation enabled
                </span>
              </label>
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button
              type="button"
              :disabled="savingSettings"
              class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              @click="saveSettings"
            >
              {{
                savingSettings
                  ? "Saving..."
                  : "Save Freight Settings"
              }}
            </button>
          </div>
        </section>

        <section
          class="rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="border-b border-slate-200 p-6">
            <h2 class="text-lg font-bold text-slate-900">
              Free Delivery Postcodes
            </h2>

            <p class="mt-1 text-sm text-slate-500">
              Any active postcode in this list bypasses Australia Post and receives free delivery.
            </p>

            <div
              class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]"
            >
              <input
                v-model="newPostcode"
                type="text"
                inputmode="numeric"
                maxlength="4"
                placeholder="Postcode"
                class="rounded-lg border border-slate-300 px-4 py-2.5"
              />

              <input
                v-model="newDescription"
                type="text"
                placeholder="Description, e.g. Free Local Delivery"
                class="rounded-lg border border-slate-300 px-4 py-2.5"
              />

              <button
                type="button"
                :disabled="addingPostcode"
                class="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                @click="addPostcode"
              >
                {{ addingPostcode ? "Adding..." : "Add" }}
              </button>
            </div>

            <div class="mt-4">
              <label class="block text-sm font-semibold text-slate-700">
                Add multiple postcodes
              </label>

              <p class="mt-1 text-xs text-slate-500">
                Paste postcodes separated by spaces, commas or new lines.
              </p>

              <div class="mt-2 flex flex-col gap-3 sm:flex-row">
                <textarea
                  v-model="bulkPostcodes"
                  rows="3"
                  placeholder="3630, 3631, 3629"
                  class="flex-1 rounded-lg border border-slate-300 px-4 py-2.5"
                ></textarea>

                <button
                  type="button"
                  :disabled="addingBulk"
                  class="self-end rounded-lg border border-blue-200 px-5 py-2.5 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  @click="addBulkPostcodes"
                >
                  {{ addingBulk ? "Adding..." : "Add Postcodes" }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="postcodes.length === 0"
            class="p-8 text-center text-slate-500"
          >
            No free-delivery postcodes have been added.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th class="px-6 py-3">
                    Postcode
                  </th>

                  <th class="px-6 py-3">
                    Description
                  </th>

                  <th class="px-6 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="postcode in postcodes"
                  :key="postcode.id"
                >
                  <td class="px-6 py-4 font-bold text-slate-900">
                    {{ postcode.postcode }}
                  </td>

                  <td class="px-6 py-4 text-slate-600">
                    {{ postcode.description || "Free Local Delivery" }}
                  </td>

                  <td class="px-6 py-4 text-right">
                    <button
                      type="button"
                      :disabled="deletingId === String(postcode.id)"
                      class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      @click="removePostcode(postcode)"
                    >
                      {{
                        deletingId === String(postcode.id)
                          ? "Removing..."
                          : "Remove"
                      }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div
          class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"
        >
          <p class="font-bold">
            Product freight measurements
          </p>

          <p class="mt-1">
            Review Weight, Length, Width and Height on each product. Existing products receive starter defaults from the SQL migration so freight can be tested immediately.
          </p>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

type FreePostcode = {
  id: string | number;
  postcode: string;
  description?: string | null;
  active: boolean;
};

const { adminFetch } = useAdminFetch();

const loading = ref(true);
const savingSettings = ref(false);
const addingPostcode = ref(false);
const addingBulk = ref(false);
const deletingId = ref<string | null>(null);

const errorMessage = ref("");
const successMessage = ref("");

const settings = reactive({
  origin_postcode: "",
  enabled: true,
});

const postcodes = ref<FreePostcode[]>([]);

const newPostcode = ref("");
const newDescription = ref("");
const bulkPostcodes = ref("");

const loadFreight = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [settingsResult, postcodeResult] =
      await Promise.all([
        adminFetch<any>(
          "/api/admin/freight/settings",
        ),
        adminFetch<FreePostcode[]>(
          "/api/admin/freight/postcodes",
        ),
      ]);

    settings.origin_postcode =
      settingsResult?.origin_postcode || "";

    settings.enabled =
      settingsResult?.enabled !== false;

    postcodes.value =
      postcodeResult || [];
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load freight settings.";
  } finally {
    loading.value = false;
  }
};

const saveSettings = async () => {
  savingSettings.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await adminFetch(
      "/api/admin/freight/settings",
      {
        method: "PUT",
        body: {
          origin_postcode:
            settings.origin_postcode,
          enabled: settings.enabled,
        },
      },
    );

    successMessage.value =
      "Freight settings saved.";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to save freight settings.";
  } finally {
    savingSettings.value = false;
  }
};

const addPostcodeValue = async (
  postcode: string,
  description?: string,
) => {
  await adminFetch(
    "/api/admin/freight/postcodes",
    {
      method: "POST",
      body: {
        postcode,
        description:
          description || null,
      },
    },
  );
};

const addPostcode = async () => {
  addingPostcode.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await addPostcodeValue(
      newPostcode.value.trim(),
      newDescription.value.trim(),
    );

    newPostcode.value = "";
    newDescription.value = "";

    await loadFreight();

    successMessage.value =
      "Free-delivery postcode added.";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to add postcode.";
  } finally {
    addingPostcode.value = false;
  }
};

const addBulkPostcodes = async () => {
  const values = [
    ...new Set(
      bulkPostcodes.value
        .split(/[\s,;]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];

  if (!values.length) {
    return;
  }

  addingBulk.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    for (const postcode of values) {
      await addPostcodeValue(
        postcode,
        "Free Local Delivery",
      );
    }

    bulkPostcodes.value = "";

    await loadFreight();

    successMessage.value =
      `${values.length} postcode${values.length === 1 ? "" : "s"} added.`;
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to add postcodes.";
  } finally {
    addingBulk.value = false;
  }
};

const removePostcode = async (
  postcode: FreePostcode,
) => {
  if (
    !window.confirm(
      `Remove free delivery for ${postcode.postcode}?`,
    )
  ) {
    return;
  }

  deletingId.value =
    String(postcode.id);

  try {
    await adminFetch(
      `/api/admin/freight/postcodes/${postcode.id}`,
      {
        method: "DELETE",
      },
    );

    postcodes.value =
      postcodes.value.filter(
        (item) =>
          String(item.id) !==
          String(postcode.id),
      );
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to remove postcode.";
  } finally {
    deletingId.value = null;
  }
};

onMounted(loadFreight);
</script>
