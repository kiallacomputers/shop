<template>
  <ProductAdminForm
    mode="edit"
    :product-id="productId"
  />
</template>

<script setup lang="ts">
import ProductAdminForm from "~/components/ProductAdminForm.vue";

definePageMeta({
  middleware: "admin",
});

const route = useRoute();

const productId = computed(() => String(route.params.id ?? ""));
</script>
