<template>
  <main class="min-h-screen bg-slate-50">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-8">
        <NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-700 admin-page-backlink">
          ← Admin Dashboard
        </NuxtLink>

        <h1 class="mt-3 text-3xl font-bold text-slate-900">Manage Freight</h1>
        <p class="mt-1 text-slate-500">
          Configure Australia Post freight, local delivery and free pickup in store.
        </p>
      </div>

      <div v-if="errorMessage" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        {{ successMessage }}
      </div>

      <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        Loading freight settings...
      </div>

      <template v-else>
        <section class="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-bold text-slate-900">Australia Post Settings</h2>
          <p class="mt-1 text-sm text-slate-500">
            The origin postcode is where parcels are sent from.
          </p>

          <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label>
              <span class="mb-2 block text-sm font-semibold text-slate-700">Origin Postcode</span>
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
              <label class="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                <input v-model="settings.enabled" type="checkbox" class="h-4 w-4" />
                <span class="font-semibold text-slate-700">Freight calculation enabled</span>
              </label>
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button
              type="button"
              :disabled="savingSettings"
              class="admin-btn-primary"
              @click="saveSettings"
            >
              {{ savingSettings ? "Saving..." : "Save Freight Settings" }}
            </button>
          </div>
        </section>


        <section class="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Pickup in Store</h2>
              <p class="mt-1 text-sm text-slate-500">
                Let customers collect their order from your store at no freight charge.
              </p>
            </div>
            <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
              <input v-model="settings.pickup_enabled" type="checkbox" class="h-4 w-4" />
              <span class="font-semibold text-slate-700">Enable store pickup</span>
            </label>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="sm:col-span-2">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Pickup option name</span>
              <input v-model="settings.pickup_name" type="text" placeholder="Pickup in Store" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" />
            </label>
            <label class="sm:col-span-2">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Store address</span>
              <input v-model="settings.pickup_address_line_1" type="text" placeholder="Street address" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" />
            </label>
            <label class="sm:col-span-2">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Address line 2</span>
              <input v-model="settings.pickup_address_line_2" type="text" placeholder="Optional" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" />
            </label>
            <label>
              <span class="mb-2 block text-sm font-semibold text-slate-700">Suburb / Town</span>
              <input v-model="settings.pickup_suburb" type="text" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" />
            </label>
            <label>
              <span class="mb-2 block text-sm font-semibold text-slate-700">State</span>
              <select v-model="settings.pickup_state" class="w-full rounded-lg border border-slate-300 px-4 py-2.5">
                <option value="">Select state</option>
                <option v-for="state in australianStates" :key="state" :value="state">{{ state }}</option>
              </select>
            </label>
            <label>
              <span class="mb-2 block text-sm font-semibold text-slate-700">Postcode</span>
              <input v-model="settings.pickup_postcode" type="text" inputmode="numeric" maxlength="4" class="w-full rounded-lg border border-slate-300 px-4 py-2.5" />
            </label>
            <label class="sm:col-span-2">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Pickup instructions</span>
              <textarea v-model="settings.pickup_instructions" rows="3" placeholder="e.g. We will email you when your order is ready for collection." class="w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea>
            </label>
          </div>

          <div class="mt-5 flex justify-end">
            <button
              type="button"
              :disabled="savingSettings"
              class="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              @click="saveSettings"
            >
              {{ savingSettings ? "Saving..." : "Save Pickup Settings" }}
            </button>
          </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-200 p-6">
            <h2 class="text-lg font-bold text-slate-900">Local Flat Rate Postcodes</h2>

            <p class="mt-1 text-sm text-slate-500">
              Local postcodes bypass Australia Post and use either a $11 or $16.50 delivery rate.
            </p>

            <div class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[140px_1fr_130px_auto]">
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
                placeholder="e.g. Local Delivery"
                class="rounded-lg border border-slate-300 px-4 py-2.5"
              />

              <select
                v-model.number="newFlatRate"
                class="rounded-lg border border-slate-300 px-4 py-2.5"
              >
                <option :value="11">$11.00</option>
                <option :value="16.5">$16.50</option>
              </select>

              <button
                type="button"
                :disabled="addingPostcode"
                class="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                @click="addPostcode"
              >
                {{ addingPostcode ? "Adding..." : "Add" }}
              </button>
            </div>

            <div class="mt-5">
              <p class="text-sm font-semibold text-slate-700">Bulk Add</p>
              <p class="mt-1 text-xs text-slate-500">
                Paste postcodes separated by spaces, commas or new lines, then choose the rate for all of them.
              </p>

              <div class="mt-2 flex flex-col gap-3 sm:flex-row">
                <textarea
                  v-model="bulkPostcodes"
                  rows="3"
                  placeholder="3630, 3631, 3629"
                  class="flex-1 rounded-lg border border-slate-300 px-4 py-2.5"
                ></textarea>

                <select
                  v-model.number="bulkFlatRate"
                  class="self-end rounded-lg border border-slate-300 px-4 py-2.5"
                >
                  <option :value="11">$11.00</option>
                  <option :value="16.5">$16.50</option>
                </select>

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

          <div v-if="postcodes.length === 0" class="p-8 text-center text-slate-500">
            No local flat-rate postcodes have been added.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th class="px-6 py-3">Postcode</th>
                  <th class="px-6 py-3">Description</th>
                  <th class="px-6 py-3 text-right">Flat Rate</th>
                  <th class="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                <tr v-for="postcode in postcodes" :key="postcode.id">
                  <td class="px-6 py-4 font-bold text-slate-900">{{ postcode.postcode }}</td>
                  <td class="px-6 py-4 text-slate-600">
                    {{ postcode.description || "Local Flat Rate Delivery" }}
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-slate-900">
                    {{ currency(postcode.flat_rate) }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      type="button"
                      :disabled="deletingId === String(postcode.id)"
                      class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      @click="removePostcode(postcode)"
                    >
                      {{ deletingId === String(postcode.id) ? "Removing..." : "Remove" }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

type LocalPostcode = {
  id: string | number;
  postcode: string;
  description?: string | null;
  flat_rate: number | string;
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
  pickup_enabled: false,
  pickup_name: "Pickup in Store",
  pickup_address_line_1: "",
  pickup_address_line_2: "",
  pickup_suburb: "",
  pickup_state: "VIC",
  pickup_postcode: "",
  pickup_instructions: "We will contact you when your order is ready for collection.",
});

const australianStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const postcodes = ref<LocalPostcode[]>([]);

const newPostcode = ref("");
const newDescription = ref("");
const newFlatRate = ref(11);

const bulkPostcodes = ref("");
const bulkFlatRate = ref(11);

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

const loadFreight = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [settingsResult, postcodeResult] = await Promise.all([
      adminFetch<any>("/api/admin/freight/settings"),
      adminFetch<LocalPostcode[]>("/api/admin/freight/postcodes"),
    ]);

    settings.origin_postcode = settingsResult?.origin_postcode || "";
    settings.enabled = settingsResult?.enabled !== false;
    settings.pickup_enabled = settingsResult?.pickup_enabled === true;
    settings.pickup_name = settingsResult?.pickup_name || "Pickup in Store";
    settings.pickup_address_line_1 = settingsResult?.pickup_address_line_1 || "";
    settings.pickup_address_line_2 = settingsResult?.pickup_address_line_2 || "";
    settings.pickup_suburb = settingsResult?.pickup_suburb || "";
    settings.pickup_state = settingsResult?.pickup_state || "VIC";
    settings.pickup_postcode = settingsResult?.pickup_postcode || "";
    settings.pickup_instructions = settingsResult?.pickup_instructions || "We will contact you when your order is ready for collection.";
    postcodes.value = postcodeResult || [];
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
    await adminFetch("/api/admin/freight/settings", {
      method: "PUT",
      body: {
        origin_postcode: settings.origin_postcode,
        enabled: settings.enabled,
        pickup_enabled: settings.pickup_enabled,
        pickup_name: settings.pickup_name,
        pickup_address_line_1: settings.pickup_address_line_1,
        pickup_address_line_2: settings.pickup_address_line_2,
        pickup_suburb: settings.pickup_suburb,
        pickup_state: settings.pickup_state,
        pickup_postcode: settings.pickup_postcode,
        pickup_instructions: settings.pickup_instructions,
      },
    });

    successMessage.value = "Freight settings saved.";
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
  description: string | undefined,
  flatRate: number,
) => {
  await adminFetch("/api/admin/freight/postcodes", {
    method: "POST",
    body: {
      postcode,
      description: description || null,
      flat_rate: flatRate,
    },
  });
};

const addPostcode = async () => {
  addingPostcode.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await addPostcodeValue(
      newPostcode.value.trim(),
      newDescription.value.trim(),
      newFlatRate.value,
    );

    newPostcode.value = "";
    newDescription.value = "";

    await loadFreight();
    successMessage.value = "Local flat-rate postcode added.";
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

  if (!values.length) return;

  addingBulk.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    for (const postcode of values) {
      await addPostcodeValue(
        postcode,
        "Local Flat Rate Delivery",
        bulkFlatRate.value,
      );
    }

    bulkPostcodes.value = "";
    await loadFreight();

    successMessage.value =
      `${values.length} postcode${values.length === 1 ? "" : "s"} added at ${currency(bulkFlatRate.value)}.`;
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to add postcodes.";
  } finally {
    addingBulk.value = false;
  }
};

const removePostcode = async (postcode: LocalPostcode) => {
  if (!window.confirm(`Remove local delivery for ${postcode.postcode}?`)) {
    return;
  }

  deletingId.value = String(postcode.id);

  try {
    await adminFetch(`/api/admin/freight/postcodes/${postcode.id}`, {
      method: "DELETE",
    });

    postcodes.value = postcodes.value.filter(
      (item) => String(item.id) !== String(postcode.id),
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
