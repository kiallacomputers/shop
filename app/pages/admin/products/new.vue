<template>
  <ProductAdminForm mode="create" />
</template>

<script setup lang="ts">
import ProductAdminForm from "~/components/ProductAdminForm.vue";

definePageMeta({ layout: "admin",
  middleware: "admin",
});
</script>
