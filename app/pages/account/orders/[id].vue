<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Back -->
    <div class="mb-6">
      <NuxtLink
        to="/account"
        class="text-blue-600 hover:text-blue-800 font-medium"
      >
        ← Back to My Account
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-gray-500">
      Loading order...
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 rounded-lg p-6"
    >
      <h1 class="text-xl font-bold text-red-700 mb-2">Unable to load order</h1>

      <p class="text-red-600">
        {{ errorMessage }}
      </p>

      <NuxtLink
        to="/account"
        class="inline-block mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700"
      >
        Back to My Account
      </NuxtLink>
    </div>

    <!-- Order -->
    <div v-else-if="order">
      <!-- ================================= -->
      <!-- ORDER HEADER -->
      <!-- ================================= -->

      <div class="mb-8">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 class="text-3xl font-bold">Order #{{ order.id }}</h1>

            <p class="text-gray-500 mt-2">
              Placed on {{ formatDate(order.created_at) }}
            </p>
          </div>

          <span
            class="inline-flex w-fit px-4 py-2 rounded-full font-semibold"
            :class="statusClass(order.status)"
          >
            {{ order.status }}
          </span>
        </div>
      </div>

      <!-- ================================= -->
      <!-- CUSTOMER INFORMATION -->
      <!-- ================================= -->

      <section class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 class="text-xl font-bold mb-5">Customer Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-gray-500 mb-1">Name</p>

            <p class="font-medium">
              {{ order.customer_name || "Not provided" }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 mb-1">Email</p>

            <p class="font-medium">
              {{ order.customer_email || "Not provided" }}
            </p>
          </div>
        </div>
      </section>

      <!-- ================================= -->
      <!-- ORDER ITEMS -->
      <!-- ================================= -->

      <section
        class="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6"
      >
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 class="text-xl font-bold">Order Items</h2>
        </div>

        <div v-if="orderItems.length" class="divide-y">
          <div v-for="item in orderItems" :key="item.id" class="px-6 py-5">
            <div
              class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <!-- Product -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-lg">
                  {{ item.product_name }}
                </h3>

                <p class="text-sm text-gray-500 mt-1">
                  Product ID: {{ item.product_id }}
                </p>
              </div>

              <!-- Quantity -->
              <div class="text-sm text-gray-600">
                Quantity:

                <span class="font-semibold">
                  {{ item.quantity }}
                </span>
              </div>

              <!-- Unit Price -->
              <div class="text-sm text-gray-600">
                Unit Price:

                <span class="font-semibold">
                  ${{ Number(item.price).toFixed(2) }}
                </span>
              </div>

              <!-- Item Total -->
              <div class="text-right font-bold min-w-[100px]">
                ${{ (Number(item.price) * Number(item.quantity)).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- No items -->
        <div v-else class="p-6 text-gray-500">
          No items found for this order.
        </div>
      </section>

      <!-- ================================= -->
      <!-- ORDER TOTAL -->
      <!-- ================================= -->

      <section class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div class="flex justify-between items-center">
          <span class="text-xl font-semibold"> Order Total </span>

          <span class="text-3xl font-bold">
            ${{ Number(order.total).toFixed(2) }}
          </span>
        </div>
      </section>

      <!-- ================================= -->
      <!-- PAYMENT -->
      <!-- ================================= -->

      <section class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p class="text-sm text-gray-500">Payment Status</p>

        <p class="font-semibold mt-1 capitalize">
          {{ order.status }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// ========================================
// PAGE MIDDLEWARE
// ========================================

definePageMeta({
  middleware: "auth",
});

// ========================================
// SUPABASE
// ========================================

const supabase = useSupabaseClient();

// ========================================
// ROUTE
// ========================================

const route = useRoute();

// ========================================
// STATE
// ========================================

const loading = ref(true);

const errorMessage = ref("");

const order = ref<any>(null);

const orderItems = ref<any[]>([]);

// ========================================
// LOAD ORDER
// ========================================

async function loadOrder() {
  loading.value = true;

  errorMessage.value = "";

  try {
    // ====================================
    // GET CURRENT USER
    // ====================================

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("=================================");

    console.log("ORDER PAGE");

    console.log("USER:", currentUser);

    console.log("ROUTE ID:", route.params.id);

    console.log("=================================");

    // ====================================
    // USER ERROR
    // ====================================

    if (userError) {
      console.error("USER ERROR:", userError);

      throw userError;
    }

    // ====================================
    // NO USER
    // ====================================

    if (!currentUser) {
      await navigateTo("/login");

      return;
    }

    // ====================================
    // GET ROUTE ID
    // ====================================

    const orderId = String(route.params.id);

    if (!orderId) {
      throw new Error("No order ID supplied.");
    }

    console.log("LOOKING FOR ORDER:", orderId);

    // ====================================
    // GET ORDER
    // ====================================

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

    // ====================================
    // ORDER ERROR
    // ====================================

    if (orderError) {
      console.error("ORDER QUERY ERROR:", orderError);

      throw orderError;
    }

    // ====================================
    // ORDER NOT FOUND
    // ====================================

    if (!orderData) {
      console.error("ORDER NOT FOUND");

      throw new Error(
        "Order not found or you do not have permission to view it.",
      );
    }

    // ====================================
    // SAVE ORDER
    // ====================================

    order.value = orderData;

    console.log("ORDER FOUND:", orderData);

    // ====================================
    // GET ORDER ITEMS
    // ====================================

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
      .eq("order_id", orderData.id);

    // ====================================
    // ITEMS ERROR
    // ====================================

    if (itemsError) {
      console.error("ORDER ITEMS ERROR:", itemsError);

      throw itemsError;
    }

    // ====================================
    // SAVE ITEMS
    // ====================================

    orderItems.value = itemsData || [];

    console.log("ORDER ITEMS:", orderItems.value);

    console.log("=================================");

    console.log("✅ ORDER LOADED SUCCESSFULLY");

    console.log("=================================");
  } catch (error: any) {
    console.error("=================================");

    console.error("❌ ORDER LOAD ERROR:", error);

    console.error("=================================");

    errorMessage.value = error?.message || "Unable to load order.";
  } finally {
    loading.value = false;
  }
}

// ========================================
// FORMAT DATE
// ========================================

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

// ========================================
// STATUS COLOUR
// ========================================

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

// ========================================
// LOAD PAGE
// ========================================

await loadOrder();
</script>
