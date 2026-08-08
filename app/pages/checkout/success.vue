<template>
  <div class="max-w-3xl mx-auto px-4 py-16 text-center">
    <h1 class="text-3xl font-bold mb-4">Payment Successful</h1>

    <p class="text-gray-600 mb-8">Thank you for your order!</p>

    <NuxtLink
      to="/"
      class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg"
    >
      Continue Shopping
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const cart = useCartStore();

onMounted(() => {
  cart.clearCart();
});
</script>
