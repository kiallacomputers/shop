<template>
  <div class="admin-page-header">
    <div class="min-w-0">
      <p v-if="eyebrow" class="admin-eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="admin-page-description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="admin-page-actions"><slot name="actions" /></div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ title:string; description?:string; eyebrow?:string }>();
</script>
