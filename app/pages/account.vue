<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ===================================== -->
    <!-- ACCOUNT HEADER -->
    <!-- ===================================== -->

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">My Account</h1>

      <p class="text-gray-500 mt-2">Welcome back, {{ customerName }}</p>
    </div>

    <!-- ===================================== -->
    <!-- LOADING -->
    <!-- ===================================== -->

    <div v-if="loading" class="py-12 text-center text-gray-500">
      Loading your account...
    </div>

    <div v-else>
      <!-- ===================================== -->
      <!-- ACCOUNT INFORMATION -->
      <!-- ===================================== -->

      <section class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">Account Information</h2>

          <button
            @click="logout"
            class="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Sign Out
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
          <div>
            <p class="text-sm text-gray-500 mb-1">Name</p>

            <p class="font-medium">
              {{ customerName || "Not provided" }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <p class="text-sm text-gray-500 mb-1">Email</p>

            <p class="font-medium">
              {{ user?.email || "Not available" }}
            </p>
          </div>
        </div>
      </section>

      <!-- ===================================== -->
      <!-- ORDERS -->
      <!-- ===================================== -->

      <section>
        <div class="mb-6">
          <h2 class="text-2xl font-bold">My Orders</h2>

          <p class="text-gray-500 mt-1">
            View your previous orders and purchases.
          </p>
        </div>

        <!-- ================================= -->
        <!-- ORDER ERROR -->
        <!-- ================================= -->

        <div
          v-if="ordersError"
          class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6"
        >
          <h3 class="font-semibold text-red-700 mb-2">Unable to load orders</h3>

          <p class="text-sm text-red-600">
            {{ ordersError }}
          </p>
        </div>

        <!-- ================================= -->
        <!-- NO ORDERS -->
        <!-- ================================= -->

        <div
          v-else-if="orders.length === 0"
          class="bg-gray-50 border border-gray-200 rounded-lg p-10 text-center"
        >
          <div class="text-4xl mb-4">🛒</div>

          <h3 class="text-lg font-semibold mb-2">No orders yet</h3>

          <p class="text-gray-500 mb-6">You haven't placed any orders yet.</p>

          <NuxtLink
            to="/"
            class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Start Shopping
          </NuxtLink>
        </div>

        <!-- ================================= -->
        <!-- ORDERS LIST -->
        <!-- ================================= -->

        <div v-else class="space-y-4">
          <div
            v-for="order in orders"
            :key="order.id"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- ============================= -->
            <!-- ORDER HEADER -->
            <!-- ============================= -->

            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div
                class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <!-- Order Number -->
                <div>
                  <p class="font-semibold text-lg">Order #{{ order.id }}</p>

                  <p class="text-sm text-gray-500">
                    {{ formatDate(order.created_at) }}
                  </p>
                </div>

                <!-- Status / Total -->
                <div class="flex items-center gap-4">
                  <span
                    class="px-3 py-1 rounded-full text-sm font-medium"
                    :class="statusClass(order.status)"
                  >
                    {{ order.status }}
                  </span>

                  <span class="font-bold text-lg">
                    ${{ Number(order.total).toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- ============================= -->
            <!-- ORDER CONTENT -->
            <!-- ============================= -->

            <div class="px-6 py-5">
              <!-- Products -->
              <div v-if="order.order_items?.length" class="space-y-3">
                <div
                  v-for="item in order.order_items"
                  :key="item.id"
                  class="flex items-center justify-between gap-4"
                >
                  <!-- Product -->
                  <div class="min-w-0">
                    <p class="font-medium truncate">
                      {{ item.product_name }}
                    </p>

                    <p class="text-sm text-gray-500">
                      Quantity: {{ item.quantity }}
                    </p>
                  </div>

                  <!-- Item Total -->
                  <p class="font-medium shrink-0">
                    ${{
                      (Number(item.price) * Number(item.quantity)).toFixed(2)
                    }}
                  </p>
                </div>
              </div>

              <!-- No Items -->
              <div v-else class="text-sm text-gray-500">
                No order items found.
              </div>

              <!-- =========================== -->
              <!-- VIEW ORDER -->
              <!-- =========================== -->

              <div class="mt-5 pt-4 border-t border-gray-200 flex justify-end">
                <NuxtLink
                  :to="`/account/orders/${order.id}`"
                  class="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  View Order

                  <span class="ml-2"> → </span>
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

const user = useSupabaseUser();

// ========================================
// STATE
// ========================================

const loading = ref(true);

const orders = ref<any[]>([]);

const ordersError = ref("");

const customerName = ref("");

// ========================================
// LOAD ACCOUNT
// ========================================

async function loadAccount() {
  loading.value = true;

  ordersError.value = "";

  try {
    // ====================================
    // GET AUTHENTICATED USER
    // ====================================

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("=================================");

    console.log("ACCOUNT USER:", currentUser);

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
    // CUSTOMER NAME
    // ====================================

    customerName.value =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.email ||
      "";

    // ====================================
    // USER ID
    // ====================================

    console.log("ACCOUNT USER ID:", currentUser.id);

    // ====================================
    // LOAD ORDERS
    // ====================================

    console.log("LOADING ORDERS...");

    const { data, error } = await supabase
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
        created_at,

        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price
        )
      `,
      )
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: false,
      });

    // ====================================
    // DATABASE ERROR
    // ====================================

    if (error) {
      console.error("❌ ORDERS QUERY ERROR:", error);

      ordersError.value = error.message;

      return;
    }

    // ====================================
    // ORDERS FOUND
    // ====================================

    console.log("=================================");

    console.log("✅ ORDERS FOUND:", data);

    console.log("ORDER COUNT:", data?.length || 0);

    console.log("=================================");

    orders.value = data || [];
  } catch (error: any) {
    console.error("ACCOUNT ERROR:", error);

    ordersError.value = error?.message || "Unable to load orders.";
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
// ORDER STATUS
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
// LOGOUT
// ========================================

async function logout() {
  await supabase.auth.signOut();

  await navigateTo("/");
}

// ========================================
// LOAD ACCOUNT
// ========================================

await loadAccount();
</script>
