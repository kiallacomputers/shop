<template><NuxtLink v-if="summary.count" :to="`${link}#reviews`" class="inline-flex items-center gap-1.5 text-sm" @click.stop><span class="tracking-tight text-amber-400">{{ stars }}</span><span class="font-bold text-slate-700">{{ summary.average }}</span><span class="text-slate-400">({{ summary.count }})</span></NuxtLink><span v-else-if="showEmpty" class="text-xs text-slate-400">No reviews yet</span></template>
<script setup lang="ts">
const props=defineProps<{productId:number|string,slug?:string,showEmpty?:boolean}>();
const summary=ref({average:0,count:0}); const link=computed(()=>props.slug?`/product/${props.slug}`:""); const stars=computed(()=>{const n=Math.round(summary.value.average);return "★".repeat(n)+"☆".repeat(5-n)});
onMounted(async()=>{try{const r:any=await $fetch(`/api/reviews/${props.productId}`);summary.value={average:Number(r.average||0),count:Number(r.count||0)}}catch{}});
</script>
