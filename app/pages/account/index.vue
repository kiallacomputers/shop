<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">My Account</h1>
      <p v-if="user" class="text-slate-600 mt-2">Welcome, {{ user.email }}</p>
    </div>

    <div v-if="loading" class="bg-white border rounded-lg p-8 text-center">
      <p class="text-slate-500">Loading your account...</p>
    </div>

    <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-6">
      <h2 class="text-xl font-bold text-red-700 mb-2">Unable to load your account</h2>
      <p class="text-red-600">{{ errorMessage }}</p>
    </div>

    <div v-else>
      <div v-if="successMessage" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        {{ successMessage }}
      </div>

      <div v-if="addressError" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {{ addressError }}
      </div>

      <section class="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
        <h2 class="text-xl font-bold mb-4 text-slate-900">Account Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-slate-500">Email</p>
            <p class="font-semibold mt-1">{{ user?.email }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500">Customer ID</p>
            <p class="font-mono text-sm mt-1 break-all">{{ user?.id }}</p>
          </div>
        </div>
      </section>

      <!-- ADDRESS BOOK -->
      <section class="bg-white border border-slate-200 rounded-xl mb-8 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Delivery Addresses</h2>
            <p class="mt-1 text-sm text-slate-500">Save multiple delivery addresses and choose one as your primary address.</p>
          </div>
          <button
            v-if="!showAddressForm"
            type="button"
            class="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
            @click="openAddAddress"
          >
            + Add Address
          </button>
        </div>

        <div v-if="showAddressForm" class="p-6 bg-slate-50 border-b border-slate-200">
          <div class="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address' }}</h3>
              <p class="text-sm text-slate-500 mt-1">Fields marked * are required.</p>
            </div>
            <button type="button" class="text-sm font-semibold text-slate-500 hover:text-slate-800" @click="cancelAddressForm">Cancel</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Address Label</span>
              <input v-model="addressForm.label" type="text" placeholder="Home, Work, Office" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Recipient Name *</span>
              <input v-model="addressForm.full_name" type="text" autocomplete="name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label class="md:col-span-2">
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Street Address *</span>
              <input v-model="addressForm.address_line_1" type="text" autocomplete="address-line1" placeholder="Street number and street name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label class="md:col-span-2">
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Address Line 2</span>
              <input v-model="addressForm.address_line_2" type="text" autocomplete="address-line2" placeholder="Unit, suite, building (optional)" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Suburb / Town *</span>
              <input v-model="addressForm.suburb" type="text" autocomplete="address-level2" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">State / Territory *</span>
              <select v-model="addressForm.state" autocomplete="address-level1" class="w-full rounded-lg border border-slate-300 px-3 py-2.5">
                <option value="">Select state</option>
                <option v-for="state in australianStates" :key="state" :value="state">{{ state }}</option>
              </select>
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Postcode *</span>
              <input v-model="addressForm.postcode" type="text" inputmode="numeric" maxlength="4" autocomplete="postal-code" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Phone</span>
              <input v-model="addressForm.phone" type="tel" autocomplete="tel" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>
          </div>

          <label class="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <input v-model="addressForm.is_primary" type="checkbox" class="h-4 w-4" :disabled="editingPrimary" />
            <div>
              <span class="font-semibold text-slate-700">Make this my primary delivery address</span>
              <p v-if="editingPrimary" class="text-xs text-slate-500 mt-0.5">This is already your primary address. Choose “Make Primary” on another address to change it.</p>
            </div>
          </label>

          <div class="mt-5 flex justify-end gap-3">
            <button type="button" class="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-white" @click="cancelAddressForm">Cancel</button>
            <button type="button" :disabled="savingAddress" class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50" @click="saveAddress">
              {{ savingAddress ? 'Saving...' : editingAddressId ? 'Save Changes' : 'Save Address' }}
            </button>
          </div>
        </div>

        <div v-if="addresses.length === 0 && !showAddressForm" class="p-8 text-center">
          <h3 class="font-semibold text-slate-900">No delivery addresses saved</h3>
          <p class="mt-1 text-sm text-slate-500">Add an address to make future orders easier to manage.</p>
          <button type="button" class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700" @click="openAddAddress">Add Delivery Address</button>
        </div>

        <div v-else-if="addresses.length" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <article
            v-for="address in addresses"
            :key="address.id"
            class="relative rounded-xl border p-5"
            :class="address.is_primary ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-slate-900">{{ address.label || 'Delivery Address' }}</h3>
                  <span v-if="address.is_primary" class="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">Primary</span>
                </div>
                <div class="mt-3 text-sm leading-6 text-slate-700">
                  <p class="font-semibold">{{ address.full_name }}</p>
                  <p>{{ address.address_line_1 }}</p>
                  <p v-if="address.address_line_2">{{ address.address_line_2 }}</p>
                  <p>{{ address.suburb }} {{ address.state }} {{ address.postcode }}</p>
                  <p>Australia</p>
                  <p v-if="address.phone" class="mt-1">{{ address.phone }}</p>
                </div>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button v-if="!address.is_primary" type="button" :disabled="primaryAddressId === String(address.id)" class="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" @click="makePrimary(address)">
                {{ primaryAddressId === String(address.id) ? 'Saving...' : 'Make Primary' }}
              </button>
              <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" @click="editAddress(address)">Edit</button>
              <button type="button" :disabled="deletingAddressId === String(address.id)" class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50" @click="deleteAddress(address)">
                {{ deletingAddressId === String(address.id) ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- ORDERS -->
      <section>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">My Orders</h2>
            <p class="text-slate-500">{{ orders.length }} {{ orders.length === 1 ? 'order' : 'orders' }}</p>
          </div>
        </div>

        <div v-if="orders.length === 0" class="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <h3 class="text-xl font-semibold mb-2">No orders yet</h3>
          <p class="text-slate-500 mb-6">You haven't placed any orders yet.</p>
          <NuxtLink to="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Start Shopping</NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <div v-for="order in orders" :key="order.id" class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p class="text-sm text-slate-500">Order</p>
                <p class="font-bold text-lg">#{{ order.id }}</p>
                <p v-if="order.created_at" class="text-sm text-slate-500 mt-1">{{ formatDate(order.created_at) }}</p>
              </div>
              <div><span class="inline-block px-3 py-1 rounded-full text-sm font-semibold" :class="statusClass(order.status)">{{ order.status || 'Pending' }}</span></div>
              <div class="md:text-right"><p class="text-sm text-slate-500">Total</p><p class="text-xl font-bold">${{ Number(order.total || 0).toFixed(2) }}</p></div>
              <div>
                <NuxtLink :to="`/account/orders/${order.id}`" title="View Invoice" aria-label="View Invoice" class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25h6M9 10.5h6M9 6.75h6M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const supabase = useSupabaseClient();
const requestFetch = useRequestFetch();

const user = ref<any>(null);
const orders = ref<any[]>([]);
const addresses = ref<any[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const addressError = ref("");
const successMessage = ref("");

const showAddressForm = ref(false);
const editingAddressId = ref<string | null>(null);
const editingPrimary = ref(false);
const savingAddress = ref(false);
const deletingAddressId = ref<string | null>(null);
const primaryAddressId = ref<string | null>(null);

const australianStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const emptyAddressForm = () => ({
  label: "",
  full_name: "",
  address_line_1: "",
  address_line_2: "",
  suburb: "",
  state: "VIC",
  postcode: "",
  phone: "",
  is_primary: false,
});

const addressForm = reactive(emptyAddressForm());

function resetAddressForm() {
  Object.assign(addressForm, emptyAddressForm());
  editingAddressId.value = null;
  editingPrimary.value = false;
}

function openAddAddress() {
  addressError.value = "";
  successMessage.value = "";
  resetAddressForm();
  addressForm.is_primary = addresses.value.length === 0;
  showAddressForm.value = true;
}

function cancelAddressForm() {
  resetAddressForm();
  showAddressForm.value = false;
}

function editAddress(address: any) {
  addressError.value = "";
  successMessage.value = "";
  editingAddressId.value = String(address.id);
  editingPrimary.value = Boolean(address.is_primary);
  Object.assign(addressForm, {
    label: address.label || "",
    full_name: address.full_name || "",
    address_line_1: address.address_line_1 || "",
    address_line_2: address.address_line_2 || "",
    suburb: address.suburb || "",
    state: address.state || "VIC",
    postcode: address.postcode || "",
    phone: address.phone || "",
    is_primary: Boolean(address.is_primary),
  });
  showAddressForm.value = true;
  nextTick(() => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function validateAddress() {
  if (!addressForm.full_name.trim() || !addressForm.address_line_1.trim() || !addressForm.suburb.trim()) return "Name, street address and suburb are required.";
  if (!australianStates.includes(addressForm.state)) return "Please select a valid Australian state or territory.";
  if (!/^\d{4}$/.test(addressForm.postcode.trim())) return "Postcode must contain exactly 4 numbers.";
  return "";
}

async function loadAddresses() {
  addresses.value = await requestFetch<any[]>("/api/account/addresses");
}

async function saveAddress() {
  addressError.value = "";
  successMessage.value = "";
  const validation = validateAddress();
  if (validation) { addressError.value = validation; return; }

  savingAddress.value = true;
  try {
    const body = { ...addressForm, postcode: addressForm.postcode.trim(), state: addressForm.state.toUpperCase() };
    if (editingAddressId.value) {
      await requestFetch(`/api/account/addresses/${editingAddressId.value}`, { method: "PUT", body });
      successMessage.value = "Delivery address updated.";
    } else {
      await requestFetch("/api/account/addresses", { method: "POST", body });
      successMessage.value = "Delivery address added.";
    }
    await loadAddresses();
    cancelAddressForm();
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || error?.message || "Unable to save delivery address.";
  } finally {
    savingAddress.value = false;
  }
}

async function makePrimary(address: any) {
  addressError.value = "";
  successMessage.value = "";
  primaryAddressId.value = String(address.id);
  try {
    await requestFetch(`/api/account/addresses/${address.id}/primary`, { method: "PUT" });
    await loadAddresses();
    successMessage.value = `${address.label || "Delivery address"} is now your primary address.`;
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || error?.message || "Unable to change the primary address.";
  } finally {
    primaryAddressId.value = null;
  }
}

async function deleteAddress(address: any) {
  if (!window.confirm(`Delete ${address.label || "this delivery address"}?`)) return;
  addressError.value = "";
  successMessage.value = "";
  deletingAddressId.value = String(address.id);
  try {
    await requestFetch(`/api/account/addresses/${address.id}`, { method: "DELETE" });
    await loadAddresses();
    successMessage.value = "Delivery address deleted.";
    if (editingAddressId.value === String(address.id)) cancelAddressForm();
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || error?.message || "Unable to delete delivery address.";
  } finally {
    deletingAddressId.value = null;
  }
}

async function loadAccount() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!currentUser) {
      await navigateTo({ path: "/auth/signin", query: { redirect: "/account" } });
      return;
    }
    user.value = currentUser;

    const [addressResult, orderResult] = await Promise.all([
      requestFetch<any[]>("/api/account/addresses"),
      supabase.from("orders").select(`id,user_id,stripe_session_id,customer_email,customer_name,total,status,created_at`).eq("user_id", currentUser.id).order("created_at", { ascending: false }),
    ]);

    addresses.value = addressResult || [];
    if (orderResult.error) throw orderResult.error;
    orders.value = orderResult.data || [];
  } catch (error: any) {
    console.error("ACCOUNT ERROR:", error);
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to load your account.";
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function statusClass(status: string) {
  switch (String(status).toLowerCase()) {
    case "paid": return "bg-green-100 text-green-700";
    case "processing": return "bg-blue-100 text-blue-700";
    case "shipped": return "bg-purple-100 text-purple-700";
    case "completed": return "bg-green-100 text-green-700";
    case "cancelled": return "bg-red-100 text-red-700";
    case "refunded": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

await loadAccount();
</script>
