<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <!-- Confirmation hero -->
      <section class="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div class="bg-emerald-50 px-6 py-8 text-center sm:px-10">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-8 w-8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m5 12 4 4L19 6" />
            </svg>
          </div>

          <p class="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            Payment successful
          </p>

          <h1 class="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Thank you for your order
          </h1>

          <p class="mx-auto mt-3 max-w-2xl text-slate-600">
            Your payment has been received and your order is being prepared. A confirmation email and PDF invoice will be sent to your email address.
          </p>
        </div>

        <!-- Finalising -->
        <div v-if="loading" class="px-6 py-10 text-center sm:px-10">
          <div class="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <h2 class="mt-4 text-lg font-bold text-slate-900">Finalising your order...</h2>
          <p class="mt-1 text-sm text-slate-500">
            This normally only takes a few seconds. Please keep this page open.
          </p>
        </div>

        <!-- Order loaded -->
        <div v-else-if="order" class="px-6 py-6 sm:px-10 sm:py-8">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Order number</p>
              <p class="mt-1 text-xl font-bold text-slate-900">#{{ order.id }}</p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Order date</p>
              <p class="mt-1 font-bold text-slate-900">{{ formatDate(order.created_at) }}</p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <span class="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold capitalize text-emerald-700">
                {{ order.status || "Paid" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Could not load details -->
        <div v-else class="px-6 py-8 sm:px-10">
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h2 class="font-bold">Payment received</h2>
            <p class="mt-1 text-sm">
              {{ errorMessage || "Your payment was successful, but the order details are taking longer than expected to appear." }}
            </p>
            <p class="mt-2 text-sm">
              You can safely visit My Account to check the order once processing has completed.
            </p>
          </div>
        </div>
      </section>

      <template v-if="order">
        <div class="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <!-- Left column -->
          <div class="space-y-6">
            <!-- Items -->
            <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 px-6 py-4">
                <h2 class="text-lg font-bold text-slate-900">Order summary</h2>
              </div>

              <div v-if="order.items?.length" class="divide-y divide-slate-100">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="flex items-start justify-between gap-5 px-6 py-4"
                >
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900">{{ item.product_name }}</p>
                    <p class="mt-1 text-sm text-slate-500">
                      Qty {{ item.quantity }} × {{ currency(item.price) }}
                    </p>
                  </div>
                  <p class="shrink-0 font-bold text-slate-900">
                    {{ currency(Number(item.price || 0) * Number(item.quantity || 0)) }}
                  </p>
                </div>
              </div>

              <div v-else class="px-6 py-6 text-sm text-slate-500">
                Your purchased items are being added to the order.
              </div>
            </section>

            <!-- Delivery -->
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 7h11v10H3zM14 10h3l4 4v3h-7z" />
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-slate-900">Delivery to</h2>
                  <div class="mt-3 space-y-0.5 text-slate-600">
                    <p class="font-semibold text-slate-900">{{ order.shipping_name || order.customer_name || "Customer" }}</p>
                    <p v-if="order.shipping_address_line_1">{{ order.shipping_address_line_1 }}</p>
                    <p v-if="order.shipping_address_line_2">{{ order.shipping_address_line_2 }}</p>
                    <p>{{ locationLine }}</p>
                    <p v-if="order.shipping_country && order.shipping_country !== 'AU'">{{ order.shipping_country }}</p>
                  </div>

                  <p v-if="order.shipping_method" class="mt-3 text-sm text-slate-500">
                    Delivery service: <span class="font-semibold text-slate-700">{{ order.shipping_method }}</span>
                  </p>
                </div>
              </div>
            </section>
          </div>

          <!-- Right column -->
          <div class="space-y-6">
            <!-- Totals -->
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-900">Payment summary</h2>

              <div class="mt-5 space-y-3 text-sm">
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{{ currency(subtotal) }}</span>
                </div>

                <div class="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span>{{ deliveryCost === 0 ? "FREE" : currency(deliveryCost) }}</span>
                </div>

                <div class="flex justify-between text-slate-600">
                  <span>GST (10%)</span>
                  <span>{{ currency(gstAmount) }}</span>
                </div>

                <div class="flex items-end justify-between border-t border-slate-200 pt-4">
                  <span class="font-bold text-slate-900">Total paid</span>
                  <span class="text-2xl font-bold text-slate-900">{{ currency(order.total) }}</span>
                </div>
              </div>
            </section>

            <!-- What happens next -->
            <section class="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 class="text-lg font-bold text-slate-900">What happens next?</h2>

              <div class="mt-4 space-y-4 text-sm text-slate-700">
                <div class="flex gap-3">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                  <p>We receive and review your order.</p>
                </div>
                <div class="flex gap-3">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                  <p>Your confirmation email and PDF invoice are sent to <strong>{{ order.customer_email }}</strong>.</p>
                </div>
                <div class="flex gap-3">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                  <p>Your order will be prepared for the selected delivery service.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </template>

      <!-- Actions -->
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <NuxtLink
          to="/account"
          class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          View My Account
        </NuxtLink>

        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Continue Shopping
        </NuxtLink>
      </div>

      <p class="mt-6 text-center text-xs text-slate-500">
        Keep your order number for reference. If you have any questions, reply to your order confirmation email.
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
const cart = useCartStore();
const route = useRoute();
const supabase = useSupabaseClient();

const loading = ref(true);
const order = ref<any>(null);
const errorMessage = ref("");

const sessionId = computed(() => String(route.query.session_id || "").trim());

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

const deliveryCost = computed(() => Number(order.value?.shipping_cost || 0));
const subtotal = computed(() => Math.max(0, Number(order.value?.total || 0) - deliveryCost.value));
const gstAmount = computed(() => Number(order.value?.total || 0) / 11);
const locationLine = computed(() =>
  [order.value?.shipping_suburb, order.value?.shipping_state, order.value?.shipping_postcode]
    .filter(Boolean)
    .join(" "),
);

function formatDate(value: string) {
  if (!value) return "Today";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

async function loadOrder() {
  if (!sessionId.value) {
    loading.value = false;
    errorMessage.value = "The payment was successful, but no checkout reference was returned.";
    return;
  }

  const token = await getAccessToken();

  if (!token) {
    loading.value = false;
    errorMessage.value = "Sign in to My Account to view the completed order.";
    return;
  }

  // Stripe can redirect the browser before its webhook has finished creating
  // the Supabase order. Retry briefly so the confirmation page normally fills
  // itself in without the customer having to refresh.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      order.value = await $fetch("/api/checkout/success", {
        query: { session_id: sessionId.value },
        headers: { Authorization: `Bearer ${token}` },
      });
      errorMessage.value = "";
      loading.value = false;
      return;
    } catch (error: any) {
      const status = Number(error?.statusCode || error?.response?.status || error?.data?.statusCode || 0);

      if (status === 404 && attempt < 7) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      errorMessage.value =
        error?.data?.statusMessage ||
        error?.statusMessage ||
        error?.message ||
        "Your order details could not be loaded yet.";
      loading.value = false;
      return;
    }
  }
}

onMounted(async () => {
  cart.clearCart();
  await loadOrder();
});
</script>
