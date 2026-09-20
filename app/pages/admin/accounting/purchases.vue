<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const route=useRoute()
const target = route.path.endsWith('/new') ? { path:'/admin/purchasing/purchase-orders/new', query:route.query } : { path:'/admin/purchasing/purchase-orders', query:route.query }
await navigateTo(target,{replace:true})
</script>
<template><div /></template>
