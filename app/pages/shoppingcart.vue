<template>
  <div class="max-w-7xl mx-auto px-4 py-6 md:flex gap-6">
    <!-- Side Menu -->
    <aside class="w-full md:w-64 shrink-0 mb-6 md:mb-0">
      <SideMenu />
    </aside>

    <!-- Cart Items -->
    <main class="flex-1 min-w-0">
      <!-- Products -->
      <div
        v-for="item in cart.items"
        :key="item.id"
        class="flex items-center gap-4 border-b py-4"
      >
        <!-- Product Image -->
        <img
          :src="getProductImage(item.image)"
          :alt="item.name"
          class="w-20 h-20 object-contain"
          @error="imageError(item)"
        />

        <!-- Product Information -->
        <div class="flex w-full h-10 items-center gap-4">
          <!-- Product Name -->
          <div class="w-[70%] min-w-0">
            <h3 class="truncate">
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
          class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
        >
          −
        </button>

        <!-- Quantity -->
        <span class="w-6 text-center">
          {{ item.quantity }}
        </span>

        <!-- Increase Quantity -->
        <button
          @click="cart.increase(item.id)"
          class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
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
          class="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? "Processing..." : "Checkout" }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// ----------------------------------------
// PAGE MIDDLEWARE
// ----------------------------------------

definePageMeta({
  middleware: ["auth", "cart"],
});

// ----------------------------------------
// CART
// ----------------------------------------

const cart = useCartStore();

// ----------------------------------------
// SUPABASE
// ----------------------------------------

const supabase = useSupabaseClient();

const BUCKET_NAME = "products";

// ----------------------------------------
// LOADING
// ----------------------------------------

const loading = ref(false);

// ----------------------------------------
// GET PRODUCT IMAGE
// ----------------------------------------

function getProductImage(image: string) {
  if (!image) {
    return "";
  }

  // --------------------------------------
  // IMAGE IS ALREADY A URL
  // --------------------------------------

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // --------------------------------------
  // REMOVE LEADING SLASH
  // --------------------------------------

  const imagePath = image.replace(/^\/+/, "");

  // --------------------------------------
  // GET SUPABASE PUBLIC URL
  // --------------------------------------

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

  return data.publicUrl;
}

// ----------------------------------------
// IMAGE ERROR
// ----------------------------------------

function imageError(item: any) {
  console.error("❌ PRODUCT IMAGE FAILED");

  console.error("Product:", item.name);

  console.error("Stored image:", item.image);

  console.error("Generated URL:", getProductImage(item.image));
}

// ----------------------------------------
// DEBUG CART
// ----------------------------------------

console.log("=================================");

console.log("🛒 CART:", cart.items);

console.log(
  "🖼️ CART IMAGES:",
  cart.items.map((item: any) => ({
    name: item.name,
    image: item.image,
    url: getProductImage(item.image),
  })),
);

console.log("=================================");

// ----------------------------------------
// CHECKOUT
// ----------------------------------------

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
    // NO STRIPE URL
    // ------------------------------------

    console.error("❌ STRIPE DID NOT RETURN A URL");
  } catch (error) {
    console.error("=================================");

    console.error("❌ CHECKOUT ERROR");

    console.error(error);

    console.error("=================================");
  } finally {
    loading.value = false;
  }
}
</script>
