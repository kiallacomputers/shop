<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Cart Items -->
    <main class="w-full">
      <!-- Empty Cart -->
      <div v-if="!cart.items.length" class="text-center py-16">
        <h1 class="text-3xl font-bold mb-4">Your Cart is Empty</h1>

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

      <!-- Cart -->
      <div v-else>
        <!-- Heading -->
        <h1 class="text-3xl font-bold mb-6">Shopping Cart</h1>

        <!-- Products -->
        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex items-center gap-4 border-b py-4"
        >
          <!-- Product Image -->
          <div class="w-20 h-20 shrink-0 flex items-center justify-center">
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

          <!-- Product Information -->
          <div class="flex flex-1 items-center gap-4 min-w-0">
            <!-- Product Name -->
            <div class="flex-1 min-w-0">
              <h3 class="truncate font-medium">
                {{ item.name }}
              </h3>
            </div>

            <!-- Price -->
            <div class="w-24 text-right shrink-0">
              <p class="font-semibold">${{ Number(item.price).toFixed(2) }}</p>
            </div>
          </div>

          <!-- Quantity Controls -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Decrease -->
            <button
              @click="cart.decrease(item.id)"
              class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              −
            </button>

            <!-- Quantity -->
            <span class="w-6 text-center">
              {{ item.quantity }}
            </span>

            <!-- Increase -->
            <button
              @click="cart.increase(item.id)"
              class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              +
            </button>
          </div>
        </div>

        <!-- Total -->
        <div class="text-right text-2xl font-bold mt-6">
          Total: ${{ cart.total.toFixed(2) }}
        </div>

        <!-- Checkout -->
        <div class="text-right mt-6">
          <button
            @click="checkout"
            :disabled="loading || !cart.items.length"
            class="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? "Processing..." : "Checkout" }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// ========================================
// PAGE MIDDLEWARE
// ========================================

definePageMeta({
  middleware: ["auth", "cart"],
});

// ========================================
// CART STORE
// ========================================

const cart = useCartStore();

// ========================================
// SUPABASE
// ========================================

const supabase = useSupabaseClient();

// ========================================
// LOADING
// ========================================

const loading = ref(false);

// ========================================
// GET PRODUCT IMAGE
// ========================================

function getProductImage(image: any): string {
  // --------------------------------------
  // NO IMAGE
  // --------------------------------------

  if (!image) {
    return "";
  }

  // --------------------------------------
  // IMAGE ARRAY
  // --------------------------------------

  if (Array.isArray(image)) {
    if (image.length === 0) {
      return "";
    }

    // Your products table contains
    // an array of complete Supabase URLs.
    image = image[0];
  }

  // --------------------------------------
  // IMAGE OBJECT
  // --------------------------------------

  if (typeof image === "object") {
    image =
      image.url || image.path || image.name || image.src || image.image || "";
  }

  // --------------------------------------
  // MAKE SURE STRING
  // --------------------------------------

  if (typeof image !== "string") {
    console.error("❌ INVALID PRODUCT IMAGE:", image);

    return "";
  }

  // --------------------------------------
  // CLEAN IMAGE URL
  // --------------------------------------

  image = image.trim();

  if (!image) {
    return "";
  }

  // --------------------------------------
  // COMPLETE URL
  // --------------------------------------

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // --------------------------------------
  // SUPABASE STORAGE URL
  // --------------------------------------

  const imagePath = image.replace(/^\/+/, "");

  const { data } = supabase.storage.from("products").getPublicUrl(imagePath);

  return data.publicUrl;
}

// ========================================
// IMAGE ERROR
// ========================================

function imageError(item: any) {
  console.error("=================================");

  console.error("❌ PRODUCT IMAGE FAILED");

  console.error("Product:", item.name);

  console.error("Stored image:", item.image);

  console.error("Image type:", typeof item.image);

  console.error("Generated URL:", getProductImage(item.image));

  console.error("=================================");
}

// ========================================
// DEBUG CART
// ========================================

console.log("=================================");

console.log("🛒 CART ITEMS:", cart.items);

console.log("=================================");

// ========================================
// CHECKOUT
// ========================================

async function checkout() {
  // --------------------------------------
  // CHECK EMPTY CART
  // --------------------------------------

  if (!cart.items.length) {
    console.log("Cart is empty");

    return;
  }

  // --------------------------------------
  // START PROCESSING
  // --------------------------------------

  loading.value = true;

  try {
    // ------------------------------------
    // GET AUTHENTICATED USER
    // ------------------------------------

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("CURRENT USER:", currentUser);

    console.log("USER ERROR:", userError);

    // ------------------------------------
    // USER ERROR
    // ------------------------------------

    if (userError) {
      throw new Error(userError.message);
    }

    // ------------------------------------
    // NO USER
    // ------------------------------------

    if (!currentUser) {
      console.error("❌ NO AUTHENTICATED USER");

      await navigateTo("/login");

      return;
    }

    // ------------------------------------
    // CHECKOUT DEBUG
    // ------------------------------------

    console.log("=================================");

    console.log("🛒 STARTING CHECKOUT");

    console.log("USER ID:", currentUser.id);

    console.log("EMAIL:", currentUser.email);

    console.log("CART ITEMS:", cart.items);

    console.log("=================================");

    // ------------------------------------
    // CREATE STRIPE CHECKOUT
    // ------------------------------------

    const response = await $fetch<{
      url: string;
      sessionId: string;
    }>("/api/stripe/create-checkout", {
      method: "POST",

      body: {
        items: cart.items,

        userId: currentUser.id,
      },
    });

    // ------------------------------------
    // STRIPE RESPONSE
    // ------------------------------------

    console.log("=================================");

    console.log("✅ STRIPE RESPONSE");

    console.log(response);

    console.log("=================================");

    // ------------------------------------
    // CHECK STRIPE URL
    // ------------------------------------

    if (!response?.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    // ------------------------------------
    // REDIRECT TO STRIPE
    // ------------------------------------

    window.location.href = response.url;
  } catch (error: any) {
    // ------------------------------------
    // CHECKOUT ERROR
    // ------------------------------------

    console.error("=================================");

    console.error("❌ CHECKOUT ERROR");

    console.error(error);

    console.error("=================================");

    // ------------------------------------
    // SHOW ERROR
    // ------------------------------------

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
