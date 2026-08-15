<template>
  <div class="max-w-7xl mx-auto px-4 py-6 md:flex gap-6">
    <!-- Side Menu -->
    <aside class="w-full md:w-64 shrink-0 mb-6 md:mb-0">
      <SideMenu />
    </aside>

    <!-- Cart Items -->
    <main class="flex-1 min-w-0">
      <!-- Cart Products -->
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

          <!-- Image Placeholder -->
          <div
            v-else
            class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs"
          >
            No Image
          </div>
        </div>

        <!-- Product Information -->
        <div class="flex w-full h-10 items-center gap-4 min-w-0">
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

const BUCKET_NAME = "products";

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
  // IMAGE IS AN ARRAY
  // --------------------------------------

  if (Array.isArray(image)) {
    if (image.length === 0) {
      return "";
    }

    // Use the first image
    image = image[0];
  }

  // --------------------------------------
  // IMAGE IS AN OBJECT
  // --------------------------------------

  if (typeof image === "object") {
    image =
      image.url || image.path || image.name || image.src || image.image || "";
  }

  // --------------------------------------
  // MAKE SURE IMAGE IS A STRING
  // --------------------------------------

  if (typeof image !== "string") {
    console.error("❌ INVALID PRODUCT IMAGE:", image);

    return "";
  }

  // --------------------------------------
  // REMOVE WHITESPACE
  // --------------------------------------

  image = image.trim();

  if (!image) {
    return "";
  }

  // --------------------------------------
  // IMAGE IS ALREADY A FULL URL
  // --------------------------------------

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // --------------------------------------
  // REMOVE LEADING SLASHES
  // --------------------------------------

  const imagePath = image.replace(/^\/+/, "");

  // --------------------------------------
  // SUPABASE STORAGE PUBLIC URL
  // --------------------------------------

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

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

console.log("🖼️ CART IMAGES:");

cart.items.forEach((item: any) => {
  console.log({
    name: item.name,
    image: item.image,
    imageType: typeof item.image,
    imageUrl: getProductImage(item.image),
  });
});

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
  // START LOADING
  // --------------------------------------

  loading.value = true;

  try {
    console.log("=================================");

    console.log("🛒 SENDING CART TO STRIPE");

    console.log(cart.items);

    console.log("=================================");

    // ------------------------------------
    // CREATE STRIPE CHECKOUT
    // ------------------------------------

    const response = await $fetch("/api/stripe/create-checkout", {
      method: "POST",

      body: {
        items: cart.items,
      },
    });

    console.log("STRIPE RESPONSE:", response);

    // ------------------------------------
    // REDIRECT TO STRIPE
    // ------------------------------------

    if (response?.url) {
      window.location.href = response.url;

      return;
    }

    // ------------------------------------
    // NO URL RETURNED
    // ------------------------------------

    console.error("❌ STRIPE DID NOT RETURN A CHECKOUT URL");
  } catch (error: any) {
    console.error("=================================");

    console.error("❌ CHECKOUT ERROR");

    console.error(error);

    console.error("=================================");
  } finally {
    loading.value = false;
  }
}
</script>
