<template>
  <section class="admin-section-card">
    <div v-if="title || $slots.header" class="admin-section-card-header">
      <slot name="header"><div><h2>{{ title }}</h2><p v-if="description">{{ description }}</p></div></slot>
      <div v-if="$slots.actions"><slot name="actions" /></div>
    </div>
    <div :class="padded ? 'admin-section-card-body' : ''"><slot /></div>
  </section>
</template>
<script setup lang="ts">
withDefaults(defineProps<{title?:string;description?:string;padded?:boolean}>(),{padded:true});
</script>
