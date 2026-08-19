
<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <main class="w-full">
      <div v-if="!cart.items.length" class="text-center py-16">
        <h1 class="text-3xl font-bold mb-4">
          Your Cart is Empty
        </h1>

        <p class="text-gray-500 mb-6">
          There are no items in your shopping cart.
        </p>

        <NuxtLink
          to="/"
          class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Continue Shopping
        </NuxtLink>
      </div>

      <div v-else>
        <h1 class="text-3xl font-bold mb-6">
          Shopping Cart
        </h1>

        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex items-center gap-4 border-b py-4"
        >
          <div
            class="w-20 h-20 shrink-0 flex items-center justify-center"
          >
            <img
              v-if="getProductImage(item.image)"
              :src="getProductImage(item.image)"
              :alt="item.name"
              class="w-20 h-20 object-contain"
              @error="imageError(item)"
            />

            <div
              v-else
              class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs"
            >
              No Image
            </div>
          </div>

          <div
            class="flex flex-1 items-center gap-4 min-w-0"
          >
            <div class="flex-1 min-w-0">
              <h3 class="truncate font-medium">
                {{ item.name }}
              </h3>
            </div>

            <div
              class="w-24 text-right shrink-0"
            >
              <p class="font-semibold">
                ${{ Number(item.price).toFixed(2) }}
              </p>
            </div>
          </div>

          <div
            class="flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              @click="cart.decrease(item.id)"
              class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              −
            </button>

            <span class="w-6 text-center">
              {{ item.quantity }}
            </span>

            <button
              type="button"
              @click="cart.increase(item.id)"
              class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              +
            </button>
          </div>
        </div>

        <!-- ===================================== -->
        <!-- DELIVERY -->
        <!-- ===================================== -->

        <section
          class="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 class="text-lg font-bold text-slate-900">
            Delivery
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            Enter your delivery postcode to calculate freight. Local postcodes use your configured $10 or $15 flat rate automatically; all other postcodes use Australia Post.
          </p>

          <div
            class="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              v-model="postcode"
              type="text"
              inputmode="numeric"
              maxlength="4"
              placeholder="Delivery postcode"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 sm:max-w-xs"
              @input="resetFreight"
            />

            <button
              type="button"
              :disabled="quoting || postcode.length !== 4"
              class="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="getFreightQuote"
            >
              {{
                quoting
                  ? "Calculating..."
                  : "Calculate Delivery"
              }}
            </button>
          </div>

          <div
            v-if="freightError"
            class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ freightError }}
          </div>

          <div
            v-if="freightRates.length"
            class="mt-5 space-y-3"
          >
            <label
              v-for="rate in freightRates"
              :key="rate.code"
              class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3"
              :class="
                selectedServiceCode === rate.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              "
            >
              <div class="flex items-center gap-3">
                <input
                  v-model="selectedServiceCode"
                  type="radio"
                  :value="rate.code"
                  class="h-4 w-4"
                />

                <div>
                  <p class="font-semibold text-slate-800">
                    {{ rate.name }}
                  </p>

                  <p
                    v-if="rate.free"
                    class="text-xs font-semibold text-green-600"
                  >
                    Local flat-rate delivery.
                  </p>
                </div>
              </div>

              <span
                class="font-bold"
                :class="
                  rate.free
                    ? 'text-green-600'
                    : 'text-slate-900'
                "
              >
                {{
                  rate.free
                    ? "FREE"
                    : currency(rate.price)
                }}
              </span>
            </label>
          </div>
        </section>

        <!-- ===================================== -->
        <!-- TOTALS -->
        <!-- ===================================== -->

        <div
          class="ml-auto mt-6 max-w-sm space-y-2 text-right"
        >
          <div
            class="flex items-center justify-between text-slate-600"
          >
            <span>Subtotal</span>
            <span>{{ currency(cart.total) }}</span>
          </div>

          <div
            class="flex items-center justify-between text-slate-600"
          >
            <span>Delivery</span>
            <span>
              {{
                selectedRate
                  ? selectedRate.free
                    ? "FREE"
                    : currency(selectedRate.price)
                  : "Not calculated"
              }}
            </span>
          </div>

          <div
            class="flex items-center justify-between border-t pt-3 text-2xl font-bold"
          >
            <span>Total</span>
            <span>
              {{ currency(grandTotal) }}
            </span>
          </div>
        </div>

        <div class="text-right mt-6">
          <button
            type="button"
            @click="checkout"
            :disabled="
              loading ||
              !cart.items.length ||
              !selectedRate
            "
            class="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{
              loading
                ? "Processing..."
                : selectedRate
                  ? "Checkout"
                  : "Calculate Delivery First"
            }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["auth", "cart"],
});

type FreightRate = {
  code: string;
  name: string;
  price: number;
  free: boolean;
};

const cart = useCartStore();
const supabase = useSupabaseClient();

const loading = ref(false);
const quoting = ref(false);
const postcode = ref("");
const freightError = ref("");
const freightRates = ref<FreightRate[]>([]);
const selectedServiceCode = ref("");

const selectedRate = computed(
  () =>
    freightRates.value.find(
      (rate) =>
        rate.code ===
        selectedServiceCode.value,
    ) || null,
);

const grandTotal = computed(
  () =>
    Number(cart.total || 0) +
    Number(selectedRate.value?.price || 0),
);

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

function resetFreight() {
  postcode.value = postcode.value
    .replace(/\D/g, "")
    .slice(0, 4);

  freightRates.value = [];
  selectedServiceCode.value = "";
  freightError.value = "";
}

watch(
  () =>
    cart.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
    })),
  () => {
    freightRates.value = [];
    selectedServiceCode.value = "";
  },
  {
    deep: true,
  },
);

async function getFreightQuote() {
  quoting.value = true;
  freightError.value = "";
  freightRates.value = [];
  selectedServiceCode.value = "";

  try {
    const response = await $fetch<{
      rates: FreightRate[];
    }>("/api/freight/quote", {
      method: "POST",
      body: {
        items: cart.items.map(
          (item: any) => ({
            id: item.id,
            quantity: item.quantity,
          }),
        ),
        postcode: postcode.value,
      },
    });

    freightRates.value =
      response.rates || [];

    selectedServiceCode.value =
      freightRates.value[0]?.code || "";
  } catch (error: any) {
    freightError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to calculate delivery.";
  } finally {
    quoting.value = false;
  }
}

function getProductImage(image: any): string {
  if (!image) return "";

  if (Array.isArray(image)) {
    image = image[0] || "";
  }

  if (typeof image === "object") {
    image =
      image.url ||
      image.path ||
      image.name ||
      image.src ||
      image.image ||
      "";
  }

  if (typeof image !== "string") {
    return "";
  }

  image = image.trim();

  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  const imagePath =
    image.replace(/^\/+/, "");

  const { data } = supabase.storage
    .from("products")
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

function imageError(item: any) {
  console.error(
    "PRODUCT IMAGE FAILED:",
    item.name,
    item.image,
  );
}

async function checkout() {
  if (
    !cart.items.length ||
    !selectedRate.value
  ) {
    return;
  }

  loading.value = true;

  try {
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(
        userError.message,
      );
    }

    if (!currentUser) {
      await navigateTo(
        "/auth/signin?redirect=/shoppingcart",
      );
      return;
    }

    const response = await $fetch<{
      url: string;
      sessionId: string;
    }>("/api/stripe/create-checkout", {
      method: "POST",
      body: {
        items: cart.items.map(
          (item: any) => ({
            id: item.id,
            quantity: item.quantity,
          }),
        ),
        postcode: postcode.value,
        shippingServiceCode:
          selectedRate.value.code,
      },
    });

    if (!response?.url) {
      throw new Error(
        "Stripe did not return a checkout URL",
      );
    }

    window.location.href =
      response.url;
  } catch (error: any) {
    alert(
      error?.data?.statusMessage ||
        error?.message ||
        "Unable to start checkout",
    );
  } finally {
    loading.value = false;
  }
}
</script>
