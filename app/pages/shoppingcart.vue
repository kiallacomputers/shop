<template>
  <div class="max-w-7xl mx-auto px-4 py-6 MD:flex gap-6">

    <!-- Side Menu -->
    <aside class="w-full md:w-64 shrink-0 mb-6 md:mb-0">
      <SideMenu />
    </aside>

    <!-- Cart -->
    <main class="flex-1 min-w-0">

      <div
        v-for="item in cart.items"
        :key="item.id"
        class="flex items-center gap-4 border-b py-4"
      >
        <img
          :src="item.image"
          :alt="item.name"
          class="w-20 h-20 object-contain"
        />

        <div class="flex w-full h-10 items-center gap-4">
          <div class="w-[70%] min-w-0">
            <h3 class="truncate">
              {{ item.name }}
            </h3>
          </div>

          <div class="w-[30%] text-right shrink-0">
            <p class="font-semibold">
              ${{ item.price }}
            </p>
          </div>
        </div>

        <button
          @click="cart.decrease(item.id)"
          class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
        >
          −
        </button>

        <span class="w-6 text-center">
          {{ item.quantity }}
        </span>

        <button
          @click="cart.increase(item.id)"
          class="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
        >
          +
        </button>
      </div>

      <div class="text-right text-2xl font-bold mt-6">
        Total: ${{ cart.total.toFixed(2) }}
      </div>

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
const cart = useCartStore();

const loading = ref(false);

console.log("cart :", cart.items);

async function checkout() {
  if (!cart.items.length) {
    console.log("cart is empty");
    return;
  }

  loading.value = true;

  try {
    console.log("Sending cart to stripe : ", cart.items);

    const response = await $fetch("/api/stripe/create-checkout", {
      method: "POST",
      body: {
        items: cart.items,
      },
    });

    console.log("Stripe Response : ", response);

    if (response.url) {
      window.location.href = response.url;
    }
  } catch (error) {
    console.error("Checkout error:", error);
  } finally {
    loading.value = false;
  }
}
</script>
