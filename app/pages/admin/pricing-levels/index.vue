<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Admin Dashboard
          </NuxtLink>
          <h1 class="mt-3 text-3xl font-bold text-slate-900">Manage Pricing Levels</h1>
          <p class="mt-1 text-slate-500">
            Set customer pricing names and markup levels. Customers see the level name only.
          </p>
        </div>

        <button
          type="button"
          :disabled="loading"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          @click="loadLevels"
        >
          Refresh
        </button>
      </div>

      <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        {{ successMessage }}
      </div>

      <section class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 class="font-bold text-slate-900">How pricing works</h2>
        <p class="mt-1 text-sm leading-6 text-slate-700">
          The Standard level is the authoritative public Sell Price markup. Product prices are calculated from Buy Price ex GST + the pricing-level markup + GST, then rounded to the nearest dollar.
          Changing the Standard markup also refreshes saved public product prices automatically; other customer levels take effect automatically on storefront pricing and secure Stripe checkout.
        </p>
      </section>

      <section class="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Add Pricing Level</h2>
            <p class="mt-1 text-sm text-slate-500">Create another customer group when you need one.</p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <label class="md:col-span-2">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Name</span>
            <input v-model="newLevel.name" type="text" class="input" placeholder="e.g. VIP Customer" />
          </label>
          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Markup %</span>
            <input v-model.number="newLevel.markup_percent" type="number" min="0" max="1000" step="0.01" class="input" />
          </label>
          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Sort Order</span>
            <input v-model.number="newLevel.sort_order" type="number" step="1" class="input" />
          </label>
        </div>

        <div class="mt-4 flex items-center justify-between gap-4">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input v-model="newLevel.active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Active
          </label>
          <button
            type="button"
            :disabled="creating || !newLevel.name"
            class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            @click="createLevel"
          >
            {{ creating ? "Adding..." : "Add Pricing Level" }}
          </button>
        </div>
      </section>

      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-5 py-4">
          <h2 class="text-lg font-bold text-slate-900">Current Pricing Levels</h2>
        </div>

        <div v-if="loading" class="p-10 text-center text-slate-500">Loading pricing levels...</div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-5 py-3">Level</th>
                <th class="px-5 py-3">Markup</th>
                <th class="px-5 py-3">Customers</th>
                <th class="px-5 py-3">Sort</th>
                <th class="px-5 py-3">Active</th>
                <th class="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="level in levels" :key="level.key">
                <td class="px-5 py-4">
                  <input v-model="level.name" type="text" class="input min-w-[180px]" />
                  <p v-if="level.is_standard" class="mt-1 text-xs font-semibold text-blue-600">
                    Standard / public price baseline
                  </p>
                </td>
                <td class="px-5 py-4">
                  <div class="relative w-28">
                    <input v-model.number="level.markup_percent" type="number" min="0" max="1000" step="0.01" class="input pr-8" />
                    <span class="absolute right-3 top-2.5 text-slate-500">%</span>
                  </div>
                </td>
                <td class="px-5 py-4 font-semibold text-slate-700">
                  {{ level.assigned_customers }}
                </td>
                <td class="px-5 py-4">
                  <input v-model.number="level.sort_order" type="number" step="1" class="input w-24" />
                </td>
                <td class="px-5 py-4">
                  <label class="inline-flex items-center gap-2">
                    <input
                      v-model="level.active"
                      type="checkbox"
                      :disabled="level.is_standard"
                      class="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                    />
                    <span :class="level.active ? 'text-green-700' : 'text-slate-500'">
                      {{ level.active ? "Active" : "Inactive" }}
                    </span>
                  </label>
                </td>
                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    :disabled="savingKey === level.key"
                    class="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                    @click="saveLevel(level)"
                  >
                    {{ savingKey === level.key ? "Saving..." : "Save" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="mt-4 text-xs leading-5 text-slate-500">
        Inactive levels no longer appear when assigning customers. The Standard level cannot be disabled because it is the fallback for new and unassigned customers.
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin",
  middleware: ["admin", "superadmin"],
});

type PricingLevel = {
  key: string;
  name: string;
  markup_percent: number;
  sort_order: number;
  active: boolean;
  assigned_customers: number;
  is_standard: boolean;
};

const { adminFetch } = useAdminFetch();
const levels = ref<PricingLevel[]>([]);
const loading = ref(true);
const creating = ref(false);
const savingKey = ref<string | null>(null);
const errorMessage = ref("");
const successMessage = ref("");

const newLevel = reactive({
  name: "",
  markup_percent: 20,
  sort_order: 40,
  active: true,
});

const loadLevels = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    levels.value = (await adminFetch<PricingLevel[]>("/api/admin/pricing-levels")) || [];
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load pricing levels.";
  } finally {
    loading.value = false;
  }
};

const saveLevel = async (level: PricingLevel) => {
  savingKey.value = level.key;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const result = await adminFetch<any>(
      `/api/admin/pricing-levels/${encodeURIComponent(level.key)}`,
      {
        method: "PUT",
        body: {
          name: level.name,
          markup_percent: level.markup_percent,
          sort_order: level.sort_order,
          active: level.active,
        },
      },
    );

    Object.assign(level, result);
    successMessage.value = `${level.name} pricing level saved.`;
    await loadLevels();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to save pricing level.";
  } finally {
    savingKey.value = null;
  }
};

const createLevel = async () => {
  creating.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const result = await adminFetch<any>("/api/admin/pricing-levels", {
      method: "POST",
      body: newLevel,
    });

    successMessage.value = `${result.name} pricing level added.`;
    newLevel.name = "";
    newLevel.markup_percent = 20;
    newLevel.sort_order =
      levels.value.length
        ? Math.max(...levels.value.map((item) => Number(item.sort_order || 0))) + 10
        : 10;
    newLevel.active = true;
    await loadLevels();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to add pricing level.";
  } finally {
    creating.value = false;
  }
};

onMounted(loadLevels);
</script>

<style scoped>
.input {
  @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100;
}
</style>
