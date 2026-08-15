<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Back -->
    <NuxtLink
      to="/account"
      class="inline-block mb-6 text-blue-600 hover:text-blue-800 font-medium"
    >
      ← Back to My Account
    </NuxtLink>

    <!-- Loading -->
    <div
      v-if="loading"
      class="bg-white border border-gray-200 rounded-lg p-8 text-center"
    >
      <div class="text-xl font-semibold">Loading order...</div>

      <p class="text-gray-500 mt-2">Please wait.</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 rounded-lg p-6"
    >
      <h1 class="text-2xl font-bold text-red-700 mb-4">Unable to load order</h1>

      <p class="text-red-600 mb-4">
        {{ errorMessage }}
      </p>

      <div class="bg-white border rounded p-4 text-sm">
        <p>
          <strong>URL Order ID:</strong>
          {{ route.params.id }}
        </p>

        <p class="mt-2">
          <strong>User ID:</strong>
          {{ user?.id }}
        </p>
      </div>

      <NuxtLink
        to="/account"
        class="inline-block mt-6 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700"
      >
        Back to My Account
      </NuxtLink>
    </div>

    <!-- Order -->
    <div v-else-if="order">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
      >
        <div>
          <p class="text-sm text-gray-500">Order</p>

          <h1 class="text-3xl font-bold">#{{ order.id }}</h1>

          <p v-if="order.created_at" class="text-gray-500 mt-2">
            {{ formatDate(order.created_at) }}
          </p>
        </div>

        <span
          class="inline-block px-4 py-2 rounded-full font-semibold w-fit"
          :class="statusClass(order.status)"
        >
          {{ order.status || "Pending" }}
        </span>
      </div>

      <!-- Customer -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 class="text-xl font-bold mb-5">Customer Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-gray-500">Name</p>

            <p class="font-semibold mt-1">
              {{ order.customer_name || "Not provided" }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500">Email</p>

            <p class="font-semibold mt-1">
              {{ order.customer_email || "Not provided" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Stripe -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <p class="text-sm text-gray-500">Stripe Session</p>

        <p class="font-mono text-sm break-all mt-1">
          {{ order.stripe_session_id }}
        </p>
      </div>

      <!-- Items -->
      <div
        class="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6"
      >
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h2 class="text-xl font-bold">Order Items</h2>
        </div>

        <div v-if="orderItems.length > 0" class="divide-y">
          <div v-for="item in orderItems" :key="item.id" class="p-6">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
              <!-- Name -->
              <div class="flex-1">
                <h3 class="font-semibold text-lg">
                  {{ item.product_name }}
                </h3>

                <p class="text-sm text-gray-500 mt-1">
                  Product ID:
                  {{ item.product_id }}
                </p>
              </div>

              <!-- Quantity -->
              <div class="text-sm">
                <span class="text-gray-500"> Quantity: </span>

                <span class="font-semibold ml-1">
                  {{ item.quantity }}
                </span>
              </div>

              <!-- Price -->
              <div class="text-sm">
                <span class="text-gray-500"> Price: </span>

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

        <div v-else class="p-6 text-gray-500">No order items were found.</div>
      </div>

      <!-- Total -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex justify-between items-center">
          <span class="text-xl font-semibold"> Total </span>

          <span class="text-3xl font-bold">
            ${{ Number(order.total || 0).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// =====================================================
// AUTH ONLY
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

const errorMessage = ref("");

const user = ref<any>(null);

const order = ref<any>(null);

const orderItems = ref<any[]>([]);

// =====================================================
// LOAD ORDER
// =====================================================

async function loadOrder() {
  loading.value = true;

  errorMessage.value = "";

  order.value = null;

  orderItems.value = [];

  try {
    console.log("=================================");

    console.log("🔎 LOADING ORDER DETAIL");

    console.log("=================================");

    // =================================================
    // USER
    // =================================================

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

      await navigateTo("/login");

      return;
    }

    user.value = currentUser;

    console.log("USER ID:", currentUser.id);

    // =================================================
    // URL ORDER ID
    // =================================================

    const orderId = String(route.params.id);

    console.log("URL ORDER ID:", orderId);

    if (!orderId || orderId === "undefined" || orderId === "null") {
      throw new Error("No order ID was supplied in the URL.");
    }

    // =================================================
    // GET ORDER
    // =================================================

    console.log("QUERYING ORDERS TABLE...");

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        stripe_session_id,
        customer_email,
        customer_name,
        total,
        status,
        created_at
      `,
      )
      .eq("id", orderId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    console.log("ORDER RESULT:", orderData);

    console.log("ORDER QUERY ERROR:", orderError);

    if (orderError) {
      throw orderError;
    }

    if (!orderData) {
      throw new Error("The order could not be found for this customer.");
    }

    order.value = orderData;

    console.log("✅ ORDER FOUND:", orderData);

    // =================================================
    // GET ORDER ITEMS
    // =================================================

    console.log("QUERYING ORDER ITEMS...");

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        order_id,
        product_id,
        product_name,
        quantity,
        price
      `,
      )
      .eq("order_id", orderData.id)
      .order("id", {
        ascending: true,
      });

    console.log("ORDER ITEMS RESULT:", itemsData);

    console.log("ORDER ITEMS ERROR:", itemsError);

    if (itemsError) {
      throw itemsError;
    }

    orderItems.value = itemsData || [];

    console.log("✅ ORDER ITEMS FOUND:", orderItems.value.length);

    console.log("=================================");

    console.log("🎉 ORDER DETAIL LOADED");

    console.log("=================================");
  } catch (error: any) {
    console.error("=================================");

    console.error("❌ ORDER DETAIL ERROR");

    console.error(error);

    console.error("=================================");

    errorMessage.value = error?.message || "Unable to load order.";
  } finally {
    loading.value = false;
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

// =====================================================
// STATUS
// =====================================================

function statusClass(status: string) {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700";

    case "processing":
      return "bg-blue-100 text-blue-700";

    case "shipped":
      return "bg-purple-100 text-purple-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "refunded":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

// =====================================================
// INITIAL LOAD
// =====================================================

await loadOrder();
</script>
