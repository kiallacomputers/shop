<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const route = useRoute()
await navigateTo(`/admin/purchasing/suppliers/${route.params.id}/purchase-order-preview`, { replace: true })
</script>

<template>
  <div class="p-6 text-sm text-slate-500">Opening Purchase Order Preview…</div>
</template>
