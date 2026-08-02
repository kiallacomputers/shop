<template>
  <div class="max-w-[1200px] mx-auto px-4">
    <Header />
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
});
</script>
