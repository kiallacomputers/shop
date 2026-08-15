<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold">My Account</h1>

      <p v-if="user" class="text-gray-600 mt-2">Welcome, {{ user.email }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white border rounded-lg p-8 text-center">
      <p class="text-gray-500">Loading your orders...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 rounded-lg p-6"
    >
      <h2 class="text-xl font-bold text-red-700 mb-2">
        Unable to load your orders
      </h2>

      <p class="text-red-600">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Account -->
    <div v-else>
      <!-- ================================= -->
      <!-- ACCOUNT INFORMATION -->
      <!-- ================================= -->

      <section class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 class="text-xl font-bold mb-4">Account Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-gray-500">Email</p>

            <p class="font-semibold mt-1">
              {{ user?.email }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500">Customer ID</p>

            <p class="font-mono text-sm mt-1 break-all">
              {{ user?.id }}
            </p>
          </div>
        </div>
      </section>

      <!-- ================================= -->
      <!-- ORDERS -->
      <!-- ================================= -->

      <section>
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
        >
          <div>
            <h2 class="text-2xl font-bold">My Orders</h2>

            <p class="text-gray-500">
              {{ orders.length }}
              {{ orders.length === 1 ? "order" : "orders" }}
            </p>
          </div>
        </div>

        <!-- NO ORDERS -->

        <div
          v-if="orders.length === 0"
          class="bg-white border border-gray-200 rounded-lg p-8 text-center"
        >
          <h3 class="text-xl font-semibold mb-2">No orders yet</h3>

          <p class="text-gray-500 mb-6">You haven't placed any orders yet.</p>

          <NuxtLink
            to="/"
            class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Start Shopping
          </NuxtLink>
        </div>

        <!-- ORDERS LIST -->

        <div v-else class="space-y-4">
          <div
            v-for="order in orders"
            :key="order.id"
            class="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:justify-between gap-5"
            >
              <!-- ORDER DETAILS -->

              <div>
                <p class="text-sm text-gray-500">Order</p>

                <p class="font-bold text-lg">#{{ order.id }}</p>

                <p v-if="order.created_at" class="text-sm text-gray-500 mt-1">
                  {{ formatDate(order.created_at) }}
                </p>
              </div>

              <!-- STATUS -->

              <div>
                <span
                  class="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                  :class="statusClass(order.status)"
                >
                  {{ order.status || "Pending" }}
                </span>
              </div>

              <!-- TOTAL -->

              <div class="md:text-right">
                <p class="text-sm text-gray-500">Total</p>

                <p class="text-xl font-bold">
                  ${{ Number(order.total || 0).toFixed(2) }}
                </p>
              </div>

              <!-- VIEW ORDER -->

              <div>
                <NuxtLink
                  v-for="order in orders"
                  :key="order.id"
                  :to="`/account/orders/${order.id}`"
                  title="View Invoice"
                  aria-label="View Invoice"
                  class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.8"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 14.25h6M9 10.5h6M9 6.75h6M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z"
                    />
                  </svg>
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
// AUTH
// ========================================

definePageMeta({
  middleware: "auth",
});

// ========================================
// SUPABASE
// ========================================

const supabase = useSupabaseClient();

// ========================================
// STATE
// ========================================

const user = ref<any>(null);

const orders = ref<any[]>([]);

const loading = ref(true);

const errorMessage = ref("");

// ========================================
// LOAD ACCOUNT
// ========================================

async function loadAccount() {
  loading.value = true;

  errorMessage.value = "";

  try {
    // ------------------------------------
    // GET CURRENT USER
    // ------------------------------------

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!currentUser) {
      await navigateTo("/login");

      return;
    }

    user.value = currentUser;

    console.log("=================================");

    console.log("ACCOUNT USER:", currentUser);

    console.log("=================================");

    console.log("ACCOUNT USER ID:", currentUser.id);

    // ------------------------------------
    // LOAD ORDERS
    // ------------------------------------

    console.log("LOADING ORDERS...");

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
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: false,
      });

    if (orderError) {
      console.error("ORDER ERROR:", orderError);

      throw orderError;
    }

    orders.value = orderData || [];

    console.log("=================================");

    console.log("✅ ORDERS FOUND:", orders.value);

    console.log("ORDER COUNT:", orders.value.length);

    console.log("=================================");
  } catch (error: any) {
    console.error("ACCOUNT ERROR:", error);

    errorMessage.value = error?.message || "Unable to load your account.";
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
// STATUS STYLE
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
// LOAD
// ========================================

await loadAccount();
</script>
