<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Cart Items -->
    <main class="w-full">
      <!-- Products -->
      <div
        v-for="item in cart.items"
        :key="item.id"
        class="flex items-center gap-4 border-b py-4"
      >
        <!-- Product Image -->
        <div class="w-20 h-20 shrink-0 flex items-center justify-center">
          <img
            v-if="item.image"
            :src="Array.isArray(item.image) ? item.image[0] : item.image"
            :alt="item.name"
            class="w-20 h-20 object-contain"
          />

          <div
            v-else
            class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs"
          >
            No Image
          </div>
        </div>

        <!-- Product Information -->
        <div class="flex flex-1 h-10 items-center gap-4 min-w-0">
          <!-- Product Name -->
          <div class="w-[70%] min-w-0">
            <h3 class="truncate font-medium">
              {{ item.name }}
            </h3>
          </div>

          <!-- Product Price -->
          <div class="w-[30%] text-right shrink-0">
            <p class="font-semibold">${{ Number(item.price).toFixed(2) }}</p>
          </div>
        </div>

        <!-- Decrease Quantity -->
        <button
          @click="cart.decrease(item.id)"
          class="w-8 h-8 shrink-0 rounded bg-gray-200 hover:bg-gray-300"
        >
          −
        </button>

        <!-- Quantity -->
        <span class="w-6 text-center shrink-0">
          {{ item.quantity }}
        </span>

        <!-- Increase Quantity -->
        <button
          @click="cart.increase(item.id)"
          class="w-8 h-8 shrink-0 rounded bg-gray-200 hover:bg-gray-300"
        >
          +
        </button>
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
const user = useSupabaseUser();

const BUCKET_NAME = "products";

// ========================================
// LOADING
// ========================================

const loading = ref(false);

// ========================================
// GET PRODUCT IMAGE
// ========================================

function getProductImage(image: any): string {
  if (!image) {
    return "";
  }

  // Image is an array
  if (Array.isArray(image)) {
    if (image.length === 0) {
      return "";
    }

    image = image[0];
  }

  // Image is an object
  if (typeof image === "object") {
    image =
      image.url || image.path || image.name || image.src || image.image || "";
  }

  // Make sure it is a string
  if (typeof image !== "string") {
    console.error("Invalid product image:", image);

    return "";
  }

  image = image.trim();

  if (!image) {
    return "";
  }

  // Already a URL
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Remove leading slash
  const imagePath = image.replace(/^\/+/, "");

  // Supabase Storage
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

  return data.publicUrl;
}

// ========================================
// IMAGE ERROR
// ========================================

function imageError(item: any) {
  console.error("❌ PRODUCT IMAGE FAILED");

  console.error("Product:", item.name);

  console.error("Stored image:", item.image);

  console.error("Image type:", typeof item.image);

  console.error("Generated URL:", getProductImage(item.image));
}

// ========================================
// DEBUG
// ========================================

console.log("CART ITEMS:", cart.items);

// ========================================
// CHECKOUT
// ========================================

async function checkout() {
  if (!cart.items.length) {
    console.log("Cart is empty");
    return;
  }

  loading.value = true;

  try {
    // ----------------------------------------
    // GET CURRENT USER
    // ----------------------------------------

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("CURRENT USER:", currentUser);
    console.log("USER ERROR:", userError);

    if (userError) {
      throw new Error(userError.message);
    }

    if (!currentUser) {
      console.error("❌ NO AUTHENTICATED USER");

      await navigateTo("/login");

      return;
    }

    // ----------------------------------------
    // CHECKOUT DEBUG
    // ----------------------------------------

    console.log("=================================");
    console.log("🛒 STARTING CHECKOUT");
    console.log("USER ID:", currentUser.id);
    console.log("EMAIL:", currentUser.email);
    console.log("CART ITEMS:", cart.items);
    console.log("=================================");

    // ----------------------------------------
    // SEND TO SERVER
    // ----------------------------------------

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

    // ----------------------------------------
    // STRIPE RESPONSE
    // ----------------------------------------

    console.log("=================================");
    console.log("✅ STRIPE RESPONSE");
    console.log(response);
    console.log("=================================");

    if (!response?.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    // ----------------------------------------
    // REDIRECT TO STRIPE
    // ----------------------------------------

    window.location.href = response.url;
  } catch (error: any) {
    console.error("=================================");
    console.error("❌ CHECKOUT ERROR");
    console.error(error);
    console.error("=================================");

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
