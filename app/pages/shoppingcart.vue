<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <main class="w-full">
      <div v-if="!cart.items.length" class="text-center py-16">
        <h1 class="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p class="text-gray-500 mb-6">There are no items in your shopping cart.</p>
        <NuxtLink to="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Continue Shopping
        </NuxtLink>
      </div>

      <div v-else>
        <h1 class="text-3xl font-bold mb-6">Shopping Cart</h1>

        <div v-for="item in cart.items" :key="item.id" class="flex items-center gap-4 border-b py-4">
          <div class="w-20 h-20 shrink-0 flex items-center justify-center">
            <img
              v-if="getProductImage(item.image)"
              :src="getProductImage(item.image)"
              :alt="item.name"
              class="w-20 h-20 object-contain"
              @error="imageError(item)"
            />
            <div v-else class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No Image</div>
          </div>

          <div class="flex flex-1 items-center gap-4 min-w-0">
            <div class="flex-1 min-w-0"><h3 class="truncate font-medium">{{ item.name }}</h3></div>
            <div class="w-24 text-right shrink-0"><p class="font-semibold">${{ Number(item.price).toFixed(2) }}</p></div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button type="button" @click="cart.decrease(item.id)" class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300">−</button>
            <span class="w-6 text-center">{{ item.quantity }}</span>
            <button type="button" @click="cart.increase(item.id)" class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300">+</button>
          </div>
        </div>

        <!-- DELIVERY ADDRESS -->
        <section class="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Delivery Address</h2>
              <p class="mt-1 text-sm text-slate-500">
                Choose the saved address for this order. Your primary address is selected automatically.
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              @click="showNewAddressForm = !showNewAddressForm"
            >
              {{ showNewAddressForm ? "Cancel" : "+ Add New Address" }}
            </button>
          </div>

          <div v-if="addressLoading" class="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Loading your saved addresses...
          </div>

          <div v-else-if="addressError" class="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ addressError }}
          </div>

          <div v-else-if="addresses.length" class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label
              v-for="address in addresses"
              :key="address.id"
              class="relative cursor-pointer rounded-xl border p-4 transition"
              :class="selectedAddressId === String(address.id) ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-start gap-3">
                <input v-model="selectedAddressId" type="radio" :value="String(address.id)" class="mt-1 h-4 w-4" @change="selectAddress(address)" />
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-bold text-slate-900">{{ address.label || "Delivery Address" }}</p>
                    <span v-if="address.is_primary" class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">Primary</span>
                  </div>
                  <p class="mt-2 font-semibold text-slate-800">{{ address.full_name }}</p>
                  <p class="text-sm text-slate-600">{{ address.address_line_1 }}</p>
                  <p v-if="address.address_line_2" class="text-sm text-slate-600">{{ address.address_line_2 }}</p>
                  <p class="text-sm text-slate-600">{{ address.suburb }} {{ address.state }} {{ address.postcode }}</p>
                  <p v-if="address.phone" class="mt-1 text-xs text-slate-500">{{ address.phone }}</p>
                </div>
              </div>
            </label>
          </div>

          <div v-else-if="!showNewAddressForm" class="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            You do not have a saved delivery address yet. Add one below before calculating delivery.
          </div>

          <!-- INLINE NEW ADDRESS -->
          <div v-if="showNewAddressForm" class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 class="font-bold text-slate-900">Add Delivery Address</h3>
            <p class="mt-1 text-sm text-slate-500">This address will also be saved in My Account.</p>

            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label>
                <span class="mb-1 block text-sm font-semibold text-slate-700">Label</span>
                <input v-model="newAddress.label" type="text" placeholder="Home, Work, Office" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <label>
                <span class="mb-1 block text-sm font-semibold text-slate-700">Recipient Name *</span>
                <input v-model="newAddress.full_name" type="text" autocomplete="name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <label class="md:col-span-2">
                <span class="mb-1 block text-sm font-semibold text-slate-700">Street Address *</span>
                <input v-model="newAddress.address_line_1" type="text" autocomplete="address-line1" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <label class="md:col-span-2">
                <span class="mb-1 block text-sm font-semibold text-slate-700">Address Line 2</span>
                <input v-model="newAddress.address_line_2" type="text" autocomplete="address-line2" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <label>
                <span class="mb-1 block text-sm font-semibold text-slate-700">Suburb / Town *</span>
                <input v-model="newAddress.suburb" type="text" autocomplete="address-level2" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <label>
                <span class="mb-1 block text-sm font-semibold text-slate-700">State / Territory *</span>
                <select v-model="newAddress.state" autocomplete="address-level1" class="w-full rounded-lg border border-slate-300 px-3 py-2.5">
                  <option v-for="state in australianStates" :key="state" :value="state">{{ state }}</option>
                </select>
              </label>
              <label>
                <span class="mb-1 block text-sm font-semibold text-slate-700">Postcode *</span>
                <input v-model="newAddress.postcode" type="text" inputmode="numeric" maxlength="4" autocomplete="postal-code" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <label>
                <span class="mb-1 block text-sm font-semibold text-slate-700">Phone</span>
                <input v-model="newAddress.phone" type="tel" autocomplete="tel" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
              </label>
              <label class="md:col-span-2 flex items-center gap-3">
                <input v-model="newAddress.is_primary" type="checkbox" class="h-4 w-4" />
                <span class="text-sm font-semibold text-slate-700">Make this my primary delivery address</span>
              </label>
            </div>

            <div v-if="newAddressError" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ newAddressError }}</div>

            <div class="mt-4 flex justify-end">
              <button type="button" :disabled="savingNewAddress" class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50" @click="saveNewAddress">
                {{ savingNewAddress ? "Saving..." : "Save & Use Address" }}
              </button>
            </div>
          </div>
        </section>

        <!-- DELIVERY FREIGHT -->
        <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-bold text-slate-900">Delivery Method</h2>
          <p class="mt-1 text-sm text-slate-500">
            Delivery is calculated from the postcode of the selected address. Local postcodes use your configured flat rate; all other postcodes use Australia Post.
          </p>

          <div v-if="selectedAddress" class="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Calculating for <strong>{{ selectedAddress.postcode }}</strong> — {{ selectedAddress.suburb }}, {{ selectedAddress.state }}.
          </div>

          <div class="mt-4">
            <button
              type="button"
              :disabled="quoting || !selectedAddress"
              class="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="getFreightQuote"
            >
              {{ quoting ? "Calculating..." : "Calculate Delivery" }}
            </button>
          </div>

          <div v-if="freightError" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ freightError }}</div>

          <div v-if="freightRates.length" class="mt-5 space-y-3">
            <label
              v-for="rate in freightRates"
              :key="rate.code"
              class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3"
              :class="selectedServiceCode === rate.code ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-center gap-3">
                <input v-model="selectedServiceCode" type="radio" :value="rate.code" class="h-4 w-4" />
                <div>
                  <p class="font-semibold text-slate-800">{{ rate.name }}</p>
                  <p v-if="rate.free" class="text-xs font-semibold text-green-600">Local flat-rate delivery.</p>
                </div>
              </div>
              <span class="font-bold" :class="rate.free ? 'text-green-600' : 'text-slate-900'">{{ rate.free ? "FREE" : currency(rate.price) }}</span>
            </label>
          </div>
        </section>

        <!-- TOTALS -->
        <div class="ml-auto mt-6 max-w-sm space-y-2 text-right">
          <div class="flex items-center justify-between text-slate-600"><span>Subtotal</span><span>{{ currency(cart.total) }}</span></div>
          <div class="flex items-center justify-between text-slate-600">
            <span>Delivery</span>
            <span>{{ selectedRate ? (selectedRate.free ? "FREE" : currency(selectedRate.price)) : "Not calculated" }}</span>
          </div>
          <div class="flex items-center justify-between border-t pt-3 text-2xl font-bold"><span>Total</span><span>{{ currency(grandTotal) }}</span></div>
        </div>

        <div class="text-right mt-6">
          <button
            type="button"
            @click="checkout"
            :disabled="loading || !cart.items.length || !selectedAddress || !selectedRate"
            class="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? "Processing..." : !selectedAddress ? "Choose Delivery Address" : selectedRate ? "Checkout" : "Calculate Delivery First" }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth", "cart"] });

type FreightRate = { code: string; name: string; price: number; free: boolean };
type CustomerAddress = {
  id: string | number;
  label?: string | null;
  full_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  suburb: string;
  state: string;
  postcode: string;
  country?: string | null;
  phone?: string | null;
  is_primary: boolean;
};

const cart = useCartStore();
const supabase = useSupabaseClient();

const loading = ref(false);
const quoting = ref(false);
const freightError = ref("");
const freightRates = ref<FreightRate[]>([]);
const selectedServiceCode = ref("");

const addresses = ref<CustomerAddress[]>([]);
const addressLoading = ref(true);
const addressError = ref("");
const selectedAddressId = ref("");
const showNewAddressForm = ref(false);
const savingNewAddress = ref(false);
const newAddressError = ref("");
const australianStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const newAddress = reactive({
  label: "Home",
  full_name: "",
  address_line_1: "",
  address_line_2: "",
  suburb: "",
  state: "VIC",
  postcode: "",
  phone: "",
  is_primary: false,
});

async function authenticatedFetch<T = any>(url: string, options: any = {}) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("You must be signed in.");
  return await $fetch<T>(url, {
    ...options,
    headers: { ...(options?.headers || {}), Authorization: `Bearer ${session.access_token}` },
  });
}

const selectedAddress = computed(() => addresses.value.find((address) => String(address.id) === selectedAddressId.value) || null);
const selectedRate = computed(() => freightRates.value.find((rate) => rate.code === selectedServiceCode.value) || null);
const grandTotal = computed(() => Number(cart.total || 0) + Number(selectedRate.value?.price || 0));

const currency = (value: unknown) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));

function resetFreight() {
  freightRates.value = [];
  selectedServiceCode.value = "";
  freightError.value = "";
}

function selectAddress(address: CustomerAddress) {
  selectedAddressId.value = String(address.id);
  resetFreight();
}

async function loadAddresses(preferredId?: string) {
  addressLoading.value = true;
  addressError.value = "";
  try {
    addresses.value = await authenticatedFetch<CustomerAddress[]>("/api/account/addresses");
    const preferred = preferredId ? addresses.value.find((a) => String(a.id) === preferredId) : null;
    const primary = addresses.value.find((a) => a.is_primary);
    const choice = preferred || primary || addresses.value[0] || null;
    selectedAddressId.value = choice ? String(choice.id) : "";
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || error?.message || "Unable to load your saved delivery addresses.";
  } finally {
    addressLoading.value = false;
  }
}

function validateNewAddress() {
  if (!newAddress.full_name.trim() || !newAddress.address_line_1.trim() || !newAddress.suburb.trim()) return "Name, street address and suburb are required.";
  if (!australianStates.includes(newAddress.state)) return "Please select a valid Australian state or territory.";
  if (!/^\d{4}$/.test(newAddress.postcode.trim())) return "Postcode must contain exactly 4 numbers.";
  return "";
}

async function saveNewAddress() {
  newAddressError.value = "";
  const validation = validateNewAddress();
  if (validation) { newAddressError.value = validation; return; }

  savingNewAddress.value = true;
  try {
    const saved = await authenticatedFetch<CustomerAddress>("/api/account/addresses", {
      method: "POST",
      body: { ...newAddress, state: newAddress.state.toUpperCase(), postcode: newAddress.postcode.trim() },
    });
    await loadAddresses(String(saved.id));
    showNewAddressForm.value = false;
    resetFreight();
  } catch (error: any) {
    newAddressError.value = error?.data?.statusMessage || error?.message || "Unable to save delivery address.";
  } finally {
    savingNewAddress.value = false;
  }
}

watch(
  () => cart.items.map((item: any) => ({ id: item.id, quantity: item.quantity })),
  () => resetFreight(),
  { deep: true },
);

async function getFreightQuote() {
  if (!selectedAddress.value) return;
  quoting.value = true;
  freightError.value = "";
  freightRates.value = [];
  selectedServiceCode.value = "";

  try {
    const response = await $fetch<{ rates: FreightRate[] }>("/api/freight/quote", {
      method: "POST",
      body: {
        items: cart.items.map((item: any) => ({ id: item.id, quantity: item.quantity })),
        postcode: selectedAddress.value.postcode,
      },
    });
    freightRates.value = response.rates || [];
    selectedServiceCode.value = freightRates.value[0]?.code || "";
  } catch (error: any) {
    freightError.value = error?.data?.statusMessage || error?.message || "Unable to calculate delivery.";
  } finally {
    quoting.value = false;
  }
}

function getProductImage(image: any): string {
  if (!image) return "";
  if (Array.isArray(image)) image = image[0] || "";
  if (typeof image === "object") image = image.url || image.path || image.name || image.src || image.image || "";
  if (typeof image !== "string") return "";
  image = image.trim();
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const { data } = supabase.storage.from("products").getPublicUrl(image.replace(/^\/+/, ""));
  return data.publicUrl;
}

function imageError(item: any) { console.error("PRODUCT IMAGE FAILED:", item.name, item.image); }

async function checkout() {
  if (!cart.items.length || !selectedAddress.value || !selectedRate.value) return;
  loading.value = true;

  try {
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(userError.message);
    if (!currentUser) {
      await navigateTo("/auth/signin?redirect=/shoppingcart");
      return;
    }

    const response = await authenticatedFetch<{ url: string; sessionId: string }>("/api/stripe/create-checkout", {
      method: "POST",
      body: {
        items: cart.items.map((item: any) => ({ id: item.id, quantity: item.quantity })),
        addressId: selectedAddress.value.id,
        shippingServiceCode: selectedRate.value.code,
      },
    });

    if (!response?.url) throw new Error("Stripe did not return a checkout URL");
    window.location.href = response.url;
  } catch (error: any) {
    alert(error?.data?.statusMessage || error?.message || "Unable to start checkout");
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadAddresses());
</script>
