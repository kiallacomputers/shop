<template>
  <main class="kc-page max-w-5xl">
    <!-- Back -->
    <NuxtLink
      to="/account"
      class="kc-link mb-6 inline-flex items-center"
    >
      ← Back to My Account
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="kc-state">
      <p>Loading your order…</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="kc-alert kc-alert-error" role="alert">
      <h1 class="font-bold">Unable to load this order</h1>
      <p class="mt-1">{{ errorMessage }}</p>
      <NuxtLink to="/account" class="kc-link mt-3 inline-flex">Return to My Account →</NuxtLink>
    </div>

    <!-- Order -->
    <div v-else-if="order">
      <!-- ================================= -->
      <!-- ORDER HEADER -->
      <!-- ================================= -->

      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
      >
        <div>
          <p class="text-sm text-slate-500">Order</p>

          <h1 class="kc-title text-3xl">#{{ order.id }}</h1>

          <button
            v-if="orderItems.length"
            type="button"
            :disabled="buyingAgain"
            class="kc-btn-secondary mt-3 !py-2.5 !px-4 text-sm"
            @click="buyAgain"
          >
            {{ buyingAgain ? "Adding…" : "Buy again" }}
          </button>

          <p v-if="order.created_at" class="text-slate-500 mt-2">
            {{ formatDate(order.created_at) }}
          </p>
        </div>

        <span
          class="px-4 py-2 rounded-full font-semibold w-fit"
          :class="statusClass(order.status)"
        >
          {{ order.status || "Pending" }}
        </span>
      </div>

      <!-- ================================= -->
      <!-- CUSTOMER -->
      <!-- ================================= -->

      <div class="kc-panel p-5 sm:p-6 mb-6">
        <h2 class="text-xl font-bold mb-5">Customer Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-slate-500">Name</p>

            <p class="font-semibold mt-1">
              {{ order.customer_name || "Not provided" }}
            </p>
          </div>

          <div>
            <p class="text-sm text-slate-500">Email</p>

            <p class="font-semibold mt-1">
              {{ order.customer_email || "Not provided" }}
            </p>
          </div>
        </div>
      </div>

      <!-- ================================= -->
      <!-- DELIVERY ADDRESS -->
      <!-- ================================= -->

      <div v-if="order.shipping_address_line_1 || order.shipping_postcode" class="kc-panel p-5 sm:p-6 mb-6">
        <h2 class="text-xl font-bold mb-5">{{ isStorePickup ? "Pickup Details" : "Delivery Details" }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-slate-500">{{ isStorePickup ? "Pickup From" : "Ship To" }}</p>
            <div class="font-semibold mt-1 space-y-0.5">
              <p>{{ order.shipping_name || order.customer_name || "Customer" }}</p>
              <p v-if="order.shipping_address_line_1">{{ order.shipping_address_line_1 }}</p>
              <p v-if="order.shipping_address_line_2">{{ order.shipping_address_line_2 }}</p>
              <p>{{ [order.shipping_suburb, order.shipping_state, order.shipping_postcode].filter(Boolean).join(" ") }}</p>
            </div>
          </div>

          <div>
            <p class="text-sm text-slate-500">{{ isStorePickup ? "Pickup Method" : "Delivery Method" }}</p>
            <p class="font-semibold mt-1">{{ order.shipping_method || "Delivery" }}</p>
            <p v-if="Number(order.shipping_cost || 0) > 0" class="text-sm text-slate-500 mt-1">
              {{ isStorePickup ? "Pickup" : "Delivery" }}: ${{ Number(order.shipping_cost || 0).toFixed(2) }}
            </p>
          </div>
        </div>
      </div>

      <!-- ================================= -->
      <!-- PARCEL TRACKING -->
      <!-- ================================= -->

      <div
        v-if="order.tracking_number"
        class="kc-panel p-5 sm:p-6 mb-6"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-xl font-bold">Parcel Tracking</h2>
            <p class="mt-1 text-sm text-slate-500">Track this parcel directly with Australia Post using the number below.</p>
          </div>
          <span
            v-if="order.tracking_status"
            class="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700"
          >
            {{ order.tracking_status }}
          </span>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p class="text-sm text-slate-500">Carrier</p>
            <p class="mt-1 font-semibold">{{ order.carrier || "Australia Post" }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500">Tracking Number</p>
            <p class="mt-1 break-all font-mono font-semibold">{{ order.tracking_number }}</p>
            <a
              :href="trackingUrl(order.tracking_number)"
              target="_blank"
              rel="noopener"
              class="kc-btn-primary mt-3 !py-2 !px-4 text-sm"
            >
              Track on Australia Post ↗
            </a>
          </div>
        </div>

        <div v-if="Array.isArray(order.tracking_events) && order.tracking_events.length" class="mt-5 border-t pt-5">
          <h3 class="font-bold">Tracking History</h3>
          <div class="mt-3 space-y-3">
            <div v-for="(event, index) in order.tracking_events" :key="`${event.date || 'event'}-${index}`" class="rounded-lg bg-slate-50 p-4">
              <p class="font-semibold">{{ event.description || "Tracking update" }}</p>
              <p class="mt-1 text-sm text-slate-500">
                {{ [event.location, event.date ? formatTrackingDate(event.date) : null].filter(Boolean).join(" • ") }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================= -->
      <!-- ORDER ITEMS -->
      <!-- ================================= -->

      <div
        class="kc-panel overflow-hidden mb-6"
      >
        <div class="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
          <h2 class="text-xl font-bold">Invoice Items</h2>
        </div>

        <div v-if="orderItems.length" class="divide-y">
          <div v-for="item in orderItems" :key="item.id" class="p-4 sm:p-6">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
              <!-- Product -->
              <div class="flex-1">
                <h3 class="font-semibold text-lg">
                  {{ item.product_name }}
                </h3>

                <p class="text-sm text-slate-500 mt-1">
                  Product ID: {{ item.product_id }}
                </p>
              </div>

              <!-- Quantity -->
              <div>
                <span class="text-slate-500"> Qty: </span>

                <span class="font-semibold ml-1">
                  {{ item.quantity }}
                </span>
              </div>

              <!-- Unit Price -->
              <div>
                <span class="text-slate-500"> Price: </span>

                <span class="font-semibold ml-1">
                  ${{ Number(item.price).toFixed(2) }}
                </span>
              </div>

              <!-- Line Total -->
              <div class="font-bold text-lg md:w-28 md:text-right">
                ${{ (Number(item.price) * Number(item.quantity)).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="p-6 text-slate-500">
          No items were found for this order.
        </div>
      </div>

      <!-- ================================= -->
      <!-- TOTAL -->
      <!-- ================================= -->

      <div class="kc-panel p-5 sm:p-6">
        <div class="ml-auto max-w-sm space-y-2">
          <div class="flex items-center justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{{ currency(Math.max(0, Number(order.total || 0) - Number(order.shipping_cost || 0) - Number(order.processing_fee || 0))) }}</span>
          </div>
          <div class="flex items-center justify-between text-slate-600">
            <span>{{ isStorePickup ? "Pickup" : "Delivery" }}</span>
            <span>{{ Number(order.shipping_cost || 0) === 0 ? "FREE" : currency(order.shipping_cost) }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
              <span>Processing Fee</span>
              <span>{{ currency(Number(order.processing_fee || 0)) }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
            <span>GST (10%)</span>
            <span>{{ currency(Number(order.total || 0) / 11) }}</span>
          </div>
          <div class="flex items-center justify-between border-t pt-3">
            <span class="text-xl font-semibold">Total</span>
            <span class="text-3xl font-bold">{{ currency(order.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
useSeoMeta({ robots: "noindex, nofollow" });
lang="ts">
// =====================================================
// CUSTOMER LOGIN ONLY
// =====================================================

definePageMeta({
  middleware: "auth",
});

// =====================================================
// SUPABASE
// =====================================================

const supabase = useSupabaseClient();

const route = useRoute();

// =====================================================
// STATE
// =====================================================

const loading = ref(true);
const buyingAgain = ref(false);
const cart = useCartStore();

const errorMessage = ref("");

const user = ref<any>(null);

const order = ref<any>(null);

const orderItems = ref<any[]>([]);
const isStorePickup = computed(() => String(order.value?.shipping_service_code || "").toUpperCase() === "STORE_PICKUP");

// =====================================================
// LOAD ORDER
// =====================================================

async function loadOrder() {
  loading.value = true;

  errorMessage.value = "";

  console.log("=================================");
  console.log("🔎 ORDER DETAIL PAGE");
  console.log("=================================");

  try {
    // -------------------------------------------------
    // USER
    // -------------------------------------------------

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("USER ERROR:", userError);

      throw userError;
    }

    if (!currentUser) {
      console.log("NO USER - REDIRECTING TO LOGIN");

      await navigateTo({ path: "/auth/signin", query: { redirect: route.fullPath } });

      return;
    }

    user.value = currentUser;

    console.log("USER ID:", currentUser.id);

    // -------------------------------------------------
    // ROUTE
    // -------------------------------------------------

    const orderId = String(route.params.id);

    console.log("ROUTE PARAMS:", route.params);

    console.log("ORDER ID FROM URL:", orderId);

    if (!orderId || orderId === "undefined") {
      throw new Error("No order ID was supplied.");
    }

    // -------------------------------------------------
    // FIRST: FIND ORDER BY ID
    // -------------------------------------------------

    console.log("QUERYING ORDER...");

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    console.log("ORDER DATA:", orderData);

    console.log("ORDER ERROR:", orderError);

    if (orderError) {
      throw orderError;
    }

    if (!orderData) {
      throw new Error("Order was not found.");
    }

    // -------------------------------------------------
    // SECURITY CHECK
    // -------------------------------------------------

    console.log("ORDER USER ID:", orderData.user_id);

    console.log("CURRENT USER ID:", currentUser.id);

    if (orderData.user_id !== currentUser.id) {
      throw new Error("You do not have permission to view this order.");
    }

    order.value = orderData;

    console.log("✅ ORDER FOUND");

    // -------------------------------------------------
    // ORDER ITEMS
    // -------------------------------------------------

    console.log("QUERYING ORDER ITEMS...");

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderData.id)
      .order("id", {
        ascending: true,
      });

    console.log("ORDER ITEMS:", itemsData);

    console.log("ORDER ITEMS ERROR:", itemsError);

    if (itemsError) {
      throw itemsError;
    }

    orderItems.value = itemsData || [];

    console.log("ORDER ITEMS COUNT:", orderItems.value.length);

    console.log("=================================");
    console.log("🎉 ORDER DETAIL COMPLETE");
    console.log("=================================");
  } catch (error: any) {
    console.error("=================================");

    console.error("❌ ORDER DETAIL ERROR:", error);

    console.error("=================================");

    errorMessage.value = error?.message || "Unable to load order.";
  } finally {
    loading.value = false;
  }
}

async function buyAgain() {
  if (!orderItems.value.length) return;
  buyingAgain.value = true;
  try {
    const ids = [...new Set(orderItems.value.map((item: any) => Number(item.product_id)).filter(Number.isInteger))];
    const { data: products, error } = await supabase
      .from("products")
      .select("id,name,slug,product_code,price,images,active,product_variants(id,name,product_code,price,active)")
      .in("id", ids);
    if (error) throw error;

    const productMap = new Map((products || []).map((product: any) => [Number(product.id), product]));
    let added = 0;

    for (const item of orderItems.value) {
      const product: any = productMap.get(Number(item.product_id));
      if (!product || product.active === false) continue;

      const variant = item.variant_id
        ? (product.product_variants || []).find((row: any) => Number(row.id) === Number(item.variant_id) && row.active !== false)
        : null;

      for (let i = 0; i < Math.max(1, Number(item.quantity || 1)); i++) {
        cart.addToCart({
          ...product,
          selectedVariant: variant || null,
          price: Number(variant?.price || product.price || item.price || 0),
        });
        added++;
      }
    }

    if (!added) throw new Error("None of the products from this order are currently available.");
    await navigateTo("/shoppingcart");
  } catch (error: any) {
    alert(error?.message || "Unable to add this order to your cart.");
  } finally {
    buyingAgain.value = false;
  }
}

// =====================================================
// DATE
// =====================================================

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function trackingUrl(tracking: string) {
  return `https://auspost.com.au/mypost/track/#/details/${encodeURIComponent(tracking)}`;
}

function formatTrackingDate(date: string) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// =====================================================
// STATUS
// =====================================================

function statusClass(status: string) {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700";

    case "processing":
      return "bg-blue-100 text-blue-700";

    case "shipping":
      return "bg-purple-100 text-purple-700";

    case "delivered":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "refunded":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

// =====================================================
// LOAD
// =====================================================

await loadOrder();
</script>
