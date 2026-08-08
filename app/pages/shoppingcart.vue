<template>
  <div
    v-for="item in cart.items"
    :key="item.id"
    class="flex items-center gap-4 border-b py-4"
  >
    <img :src="item.image" class="w-20 h-20 object-contain" />

    <div class="flex w-full h-10 items-center gap-4">
      <div class="w-[70%] min-w-0">
        <h3 class="truncate">
          {{ item.name }}
        </h3>
      </div>

      <div class="w-[30%] text-right shrink-0">
        <p class="font-semibold">${{ item.price }}</p>
      </div>
    </div>

    <button @click="cart.decrease(item.id)">−</button>

    {{ item.quantity }}

    <button @click="cart.increase(item.id)">+</button>
  </div>

  <div class="text-right text-2xl font-bold mt-6">
    Total: ${{ cart.total.toFixed(2) }}
  </div>

  <div class="text-right text-2xl font-bold mt-6">
    <button
      @click="checkout"
      :disabled="loading || !cart.items.length"
      class="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
    >
      {{ loading ? "Processing..." : "Checkout" }}
    </button>
  </div>
</template>

<script setup lang="ts">
const cart = useCartStore();

const loading = ref(false);

console.log("cart :", cart.items);

async function checkout() {
  if (!cart.items.length) {
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch("/api/stripe/create-checkout", {
      method: "POST",
      body: {
        items: cart.items,
      },
    });

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
