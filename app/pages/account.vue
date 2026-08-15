<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">My Account</h1>

      <p class="text-gray-500 mt-2">Welcome back, {{ customerName }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="text-gray-500">Loading your account...</div>
    </div>

    <div v-else>
      <!-- Account Information -->
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

            <p class="font-medium text-gray-900">
              {{ customerName || "Not provided" }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <p class="text-sm text-gray-500 mb-1">Email</p>

            <p class="font-medium text-gray-900">
              {{ user?.email }}
            </p>
          </div>
        </div>
      </section>

      <!-- Orders -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold">My Orders</h2>

            <p class="text-gray-500 mt-1">
              View your previous orders and purchases.
            </p>
          </div>

          <div class="text-sm text-gray-500">
            {{ orders.length }}
            {{ orders.length === 1 ? "order" : "orders" }}
          </div>
        </div>

        <!-- No Orders -->
        <div
          v-if="orders.length === 0"
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

        <!-- Orders -->
        <div v-else class="space-y-4">
          <div
            v-for="order in orders"
            :key="order.id"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- Order Header -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div
                class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p class="font-semibold text-gray-900">
                    Order #{{ order.id }}
                  </p>

                  <p class="text-sm text-gray-500">
                    {{ formatDate(order.created_at) }}
                  </p>
                </div>

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

            <!-- Order Items -->
            <div class="px-6 py-4">
              <div v-if="order.order_items?.length" class="divide-y">
                <div
                  v-for="item in order.order_items"
                  :key="item.id"
                  class="py-4 flex items-center justify-between gap-4"
                >
                  <!-- Product -->
                  <div class="min-w-0">
                    <p class="font-medium truncate">
                      {{ item.product_name }}
                    </p>

                    <p class="text-sm text-gray-500">
                      Quantity:
                      {{ item.quantity }}
                    </p>
                  </div>

                  <!-- Price -->
                  <div class="text-right shrink-0">
                    <p class="font-medium">
                      ${{
                        (Number(item.price) * Number(item.quantity)).toFixed(2)
                      }}
                    </p>

                    <p class="text-xs text-gray-500">
                      ${{ Number(item.price).toFixed(2) }}
                      each
                    </p>
                  </div>
                </div>
              </div>

              <div v-else class="text-sm text-gray-500">
                No order items found.
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
// PAGE
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

const customerName = ref("");

// ========================================
// LOAD ACCOUNT
// ========================================

async function loadAccount() {
  loading.value = true;

  try {
    // ------------------------------------
    // GET USER
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

    // ------------------------------------
    // CUSTOMER NAME
    // ------------------------------------

    customerName.value =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.email ||
      "";

    // ------------------------------------
    // GET ORDERS
    // ------------------------------------

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

    if (error) {
      console.error("Orders error:", error);

      throw error;
    }

    orders.value = data || [];

    console.log("ACCOUNT ORDERS:", orders.value);
  } catch (error) {
    console.error("Account loading error:", error);
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
// ORDER STATUS CLASS
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
  try {
    await supabase.auth.signOut();

    await navigateTo("/");
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// ========================================
// LOAD
// ========================================

await loadAccount();
</script>
