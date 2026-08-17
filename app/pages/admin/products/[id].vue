<template>
  <ProductAdminForm mode="edit" :product-id="String(route.params.id)" />
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });
const route = useRoute();
</script>
