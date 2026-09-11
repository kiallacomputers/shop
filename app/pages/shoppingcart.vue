<template>
  <div class="kc-page">
    <main class="w-full">
      <div v-if="!cart.items.length" class="text-center py-16">
        <h1 class="kc-title text-3xl mb-4">Your Cart is Empty</h1>
        <p class="text-gray-500 mb-2">There are no items in your shopping cart.</p>
        <p class="text-sm text-gray-500 mb-6">Add the products you would like quoted, then return here and choose <strong>Request a Quote</strong>.</p>
        <NuxtLink to="/" class="kc-btn-primary">
          Browse Products
        </NuxtLink>
      </div>

      <div v-else>
        <div class="mb-5 sm:mb-6">
          <p class="kc-eyebrow">Checkout</p>
          <h1 class="kc-title mt-1 text-2xl sm:text-3xl">Shopping Cart</h1>
          <div class="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold sm:max-w-md sm:text-xs">
            <div class="rounded-lg bg-blue-600 px-2 py-2 text-white">1. Cart</div>
            <div class="rounded-lg bg-blue-50 px-2 py-2 text-blue-700">2. Delivery</div>
            <div class="rounded-lg bg-slate-100 px-2 py-2 text-slate-500">3. Payment</div>
          </div>
        </div>

        <div class="space-y-3">
          <article v-for="item in cart.items" :key="item.cartKey || item.id" class="kc-panel p-3 sm:p-4">
            <div class="grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <div class="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-slate-50 sm:h-[88px] sm:w-[88px]">
                <img
                  v-if="getProductImage(item.image)"
                  :src="getProductImage(item.image)"
                  :alt="item.name"
                  class="h-full w-full object-contain p-2"
                  @error="imageError(item)"
                />
                <div v-else class="text-center text-[11px] text-slate-400">No Image</div>
              </div>

              <div class="min-w-0">
                <h3 class="font-bold leading-5 text-slate-900 sm:text-base">{{ item.name }}</h3>
                <p v-if="item.variantName" class="mt-1 text-xs font-semibold text-blue-600">{{ item.variantName }}</p>
                <p v-if="item.productCode" class="mt-0.5 text-xs text-slate-400">Code: {{ item.productCode }}</p>
                <p class="mt-2 text-sm font-black text-[#0b1f3a] sm:hidden">{{ currency(Number(item.price) * item.quantity) }}</p>
              </div>

              <div class="col-span-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                <div class="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button type="button" @click="cart.decrease(item.cartKey || item.id)" class="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-slate-700 hover:bg-white" aria-label="Decrease quantity">−</button>
                  <span class="w-9 text-center text-sm font-black text-slate-900">{{ item.quantity }}</span>
                  <button type="button" @click="cart.increase(item.cartKey || item.id)" class="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-slate-700 hover:bg-white" aria-label="Increase quantity">+</button>
                </div>
                <div class="text-right">
                  <p class="hidden font-black text-slate-900 sm:block">{{ currency(Number(item.price) * item.quantity) }}</p>
                  <button type="button" class="mt-1 text-xs font-bold text-red-600 hover:text-red-700" @click="cart.removeFromCart(item.cartKey || item.id)">Remove</button>
                </div>
              </div>
            </div>
          </article>
        </div>


        <!-- FULFILMENT METHOD -->
        <section class="mt-6 sm:mt-8 kc-panel p-4 sm:p-6">
          <h2 class="text-lg font-bold text-slate-900">How would you like to receive your order?</h2>
          <p class="mt-1 text-sm text-slate-500">Choose delivery or collect your order from Kialla Computers.</p>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              class="cursor-pointer rounded-xl border p-4 transition"
              :class="fulfilmentMethod === 'delivery' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-start gap-3">
                <input v-model="fulfilmentMethod" type="radio" value="delivery" class="mt-1 h-4 w-4" />
                <div>
                  <p class="font-bold text-slate-900">Delivery</p>
                  <p class="mt-1 text-sm text-slate-500">Local delivery or Australia Post, calculated from your address.</p>
                </div>
              </div>
            </label>

            <label
              v-if="pickupOption?.enabled"
              class="cursor-pointer rounded-xl border p-4 transition"
              :class="fulfilmentMethod === 'pickup' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-start gap-3">
                <input v-model="fulfilmentMethod" type="radio" value="pickup" class="mt-1 h-4 w-4" />
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-bold text-slate-900">{{ pickupOption.name }}</p>
                    <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">FREE</span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">Collect your order from our store when it is ready.</p>
                </div>
              </div>
            </label>
          </div>
        </section>

        <!-- DELIVERY ADDRESS -->
        <section v-if="fulfilmentMethod === 'delivery'" class="mt-6 kc-panel p-4 sm:p-6">
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
          <div v-if="showNewAddressForm" class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
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
              <button type="button" :disabled="savingNewAddress" class="min-h-[48px] w-full rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white sm:w-auto hover:bg-blue-700 disabled:opacity-50" @click="saveNewAddress">
                {{ savingNewAddress ? "Saving..." : "Save & Use Address" }}
              </button>
            </div>
          </div>
        </section>


        <section v-if="fulfilmentMethod === 'pickup' && pickupOption?.enabled" class="mt-4 kc-panel border-emerald-200 bg-emerald-50/30 p-4 sm:p-6">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M5 10V7l2-3h10l2 3v3M5 10v10h14V10M9 20v-6h6v6" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900">Pickup Location</h2>
              <p class="mt-2 font-bold text-slate-900">{{ pickupOption.name }}</p>
              <p v-if="pickupOption.addressLine1" class="text-sm text-slate-600">{{ pickupOption.addressLine1 }}</p>
              <p v-if="pickupOption.addressLine2" class="text-sm text-slate-600">{{ pickupOption.addressLine2 }}</p>
              <p class="text-sm text-slate-600">{{ [pickupOption.suburb, pickupOption.state, pickupOption.postcode].filter(Boolean).join(' ') }}</p>
              <p v-if="pickupOption.instructions" class="mt-3 rounded-lg bg-white/80 px-3 py-2 text-sm text-slate-700">{{ pickupOption.instructions }}</p>
            </div>
          </div>
        </section>

        <!-- Freight is calculated automatically from the selected delivery address. -->
        <div v-if="freightError" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ freightError }}
        </div>

        <!-- TOTALS -->
        <div class="ml-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 class="mb-3 text-left text-base font-black text-slate-900">Order Summary</h2>
          <div class="space-y-2 text-right">
          <div class="flex items-center justify-between text-slate-600"><span>Pricing Level</span><span class="font-semibold text-blue-700">{{ pricingLevelName }}</span></div>
          <div class="flex items-center justify-between text-slate-600"><span>Subtotal</span><span>{{ currency(cart.total) }}</span></div>
          <div class="flex items-center justify-between text-slate-600">
            <span>{{ fulfilmentMethod === "pickup" ? "Pickup" : "Delivery" }}</span>
            <span>{{ fulfilmentMethod === "pickup" ? "FREE" : quoting ? "Calculating..." : selectedRate ? (selectedRate.free ? "FREE" : currency(selectedRate.price)) : "Not calculated" }}</span>
          </div>
          <div class="flex items-center justify-between text-slate-600">
            <span>GST (10%)</span>
            <span>{{ currency(gstIncluded) }}</span>
          </div>
          <div class="flex items-center justify-between border-t pt-3 text-xl font-black sm:text-2xl"><span>Total</span><span>{{ currency(grandTotal) }}</span></div>
          </div>
        </div>

        <div v-if="quoteSuccess" class="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {{ quoteSuccess }}
        </div>
        <div v-if="quoteError" class="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ quoteError }}
        </div>

        <div class="mt-6 grid grid-cols-1 gap-3 sm:flex sm:justify-end">
          <button
            type="button"
            :disabled="requestingQuote || !cart.items.length"
            class="min-h-[50px] w-full rounded-xl border border-blue-300 bg-white px-6 py-3 font-semibold sm:w-auto text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            @click="requestQuote"
          >
            {{ requestingQuote ? "Requesting..." : "Request a Quote" }}
          </button>
          <button
            type="button"
            @click="checkout"
            :disabled="loading || !cart.items.length || (fulfilmentMethod === 'delivery' && (!selectedAddress || !selectedRate)) || (fulfilmentMethod === 'pickup' && !pickupOption?.enabled)"
            class="min-h-[50px] w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white sm:w-auto hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? "Processing..." : fulfilmentMethod === "pickup" ? "Checkout - Store Pickup" : !selectedAddress ? "Choose Delivery Address" : quoting ? "Calculating Delivery..." : selectedRate ? "Checkout" : "Delivery Unavailable" }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });

type FreightRate = { code: string; name: string; price: number; free: boolean };
type PickupOption = {
  enabled: boolean;
  code: "STORE_PICKUP";
  name: string;
  price: 0;
  free: true;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  instructions: string;
};
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
const { quote, pricingLevelName } = useCustomerPricing();

const loading = ref(false);
const quoting = ref(false);
const requestingQuote = ref(false);
const quoteSuccess = ref("");
const quoteError = ref("");
const freightError = ref("");
const freightRates = ref<FreightRate[]>([]);
const selectedServiceCode = ref("");
const fulfilmentMethod = ref<"delivery" | "pickup">("delivery");
const pickupOption = ref<PickupOption | null>(null);

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
const selectedRate = computed<FreightRate | null>(() => {
  if (fulfilmentMethod.value === "pickup" && pickupOption.value?.enabled) {
    return { code: pickupOption.value.code, name: pickupOption.value.name, price: 0, free: true };
  }
  return freightRates.value.find((rate) => rate.code === selectedServiceCode.value) || null;
});
const grandTotal = computed(() => Number(cart.total || 0) + Number(selectedRate.value?.price || 0));
const gstIncluded = computed(() => grandTotal.value / 11);

const currency = (value: unknown) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));

function resetFreight() {
  freightRates.value = [];
  selectedServiceCode.value = "";
  freightError.value = "";
}

function selectAddress(address: CustomerAddress) {
  selectedAddressId.value = String(address.id);
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
  } catch (error: any) {
    newAddressError.value = error?.data?.statusMessage || error?.message || "Unable to save delivery address.";
  } finally {
    savingNewAddress.value = false;
  }
}

watch(
  fulfilmentMethod,
  async (method) => {
    freightError.value = "";
    if (method === "pickup") {
      freightRates.value = [];
      selectedServiceCode.value = "STORE_PICKUP";
      return;
    }
    resetFreight();
    if (selectedAddress.value && cart.items.length) await getFreightQuote();
  },
);

watch(
  selectedAddressId,
  async () => {
    resetFreight();
    if (fulfilmentMethod.value === "delivery" && selectedAddress.value && cart.items.length) {
      await getFreightQuote();
    }
  },
);

watch(
  () => cart.items.map((item: any) => ({ id: item.id, variantId: item.variantId || null, quantity: item.quantity })),
  async () => {
    resetFreight();
    if (fulfilmentMethod.value === "delivery" && selectedAddress.value && cart.items.length) {
      await getFreightQuote();
    }
  },
  { deep: true },
);

async function refreshCustomerPrices() {
  if (!cart.items.length) return;
  try {
    const result = await quote(
      cart.items.map((item: any) => ({
        productId: item.id,
        variantId: item.variantId || null,
      })),
    );

    for (const item of cart.items) {
      const price = item.variantId
        ? result.variants[String(item.variantId)] ?? result.products[String(item.id)]
        : result.products[String(item.id)];
      if (Number.isFinite(Number(price)) && Number(price) > 0) {
        cart.setPrice(item.cartKey || item.id, Number(price));
      }
    }
  } catch (error) {
    console.error("CUSTOMER PRICING REFRESH ERROR:", error);
  }
}

async function getFreightQuote() {
  if (fulfilmentMethod.value !== "delivery" || !selectedAddress.value) return;
  quoting.value = true;
  freightError.value = "";
  freightRates.value = [];
  selectedServiceCode.value = "";

  try {
    const response = await $fetch<{ rates: FreightRate[] }>("/api/freight/quote", {
      method: "POST",
      body: {
        items: cart.items.map((item: any) => ({ id: item.id, variantId: item.variantId || null, quantity: item.quantity })),
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

async function requestQuote() {
  if (!cart.items.length) return;
  requestingQuote.value = true;
  quoteSuccess.value = "";
  quoteError.value = "";
  try {
    const result = await authenticatedFetch<any>("/api/account/quotes", {
      method: "POST",
      body: {
        items: cart.items.map((item: any) => ({
          id: item.id,
          variantId: item.variantId || null,
          quantity: item.quantity,
        })),
      },
    });
    quoteSuccess.value = `Quote request #${result.id} has been sent. You can follow it from My Account.`;
  } catch (error: any) {
    quoteError.value = error?.data?.statusMessage || error?.message || "Unable to request a quote.";
  } finally {
    requestingQuote.value = false;
  }
}

async function checkout() {
  if (!cart.items.length || !selectedRate.value) return;
  if (fulfilmentMethod.value === "delivery" && !selectedAddress.value) return;
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
        items: cart.items.map((item: any) => ({ id: item.id, variantId: item.variantId || null, quantity: item.quantity })),
        fulfilmentMethod: fulfilmentMethod.value,
        addressId: fulfilmentMethod.value === "delivery" ? selectedAddress.value?.id : null,
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

onMounted(async () => {
  await refreshCustomerPrices();
  try {
    pickupOption.value = await authenticatedFetch<PickupOption>("/api/freight/pickup");
  } catch {
    pickupOption.value = null;
  }
  await loadAddresses();
});
</script>
