<template>
  <div class="min-h-screen bg-[#f5f8fc] flex flex-col">
    <Header v-if="!isAdminPreview" />
    <div class="flex-1"><slot /></div>
    <Footer v-if="!isAdminPreview" />
    <ChatWidget v-if="!isAdminPreview" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const isAdminPreview = computed(() => route.query.adminPreview === "1");
</script>
