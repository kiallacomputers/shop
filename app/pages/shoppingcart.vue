<template>
  <div
    v-for="item in cart.items"
    :key="item.id"
    class="flex items-center gap-4 border-b py-4"
  >
    <img :src="item.image" class="w-20 h-20 object-contain" />

    <div class="flex-1">
      <h3>{{ item.name }}</h3>
      <p>${{ item.price }}</p>
    </div>

    <button @click="cart.decrease(item.id)">−</button>

    {{ item.quantity }}

    <button @click="cart.increase(item.id)">+</button>
  </div>

  <div class="text-right text-2xl font-bold mt-6">
    Total: ${{ cart.total.toFixed(2) }}
  </div>
  {{ cart.items }}
</template>

<script setup>
const cart = useCartStore();
</script>
