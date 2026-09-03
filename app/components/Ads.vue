<template>
  <section class="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="relative aspect-[16/5] min-h-[140px] overflow-hidden">
      <Transition name="slide">
        <NuxtLink :to="ads[currentAd].link" :key="currentAd" class="absolute inset-0">
          <img :src="ads[currentAd].image" :alt="ads[currentAd].title" class="w-full h-full object-cover" />
        </NuxtLink>
      </Transition>
    </div>
  </section>
</template>
<script setup>
const currentAd = ref(0); let timer;
onMounted(() => { timer = window.setInterval(() => { currentAd.value=(currentAd.value+1)%ads.length; },10000); });
onBeforeUnmount(() => { if (timer) window.clearInterval(timer); });
const loadads=import.meta.glob("~/assets/images/ads/*",{eager:true,import:"default"});
const ads=[
  {title:"Computer Builds",image:loadads["/assets/images/ads/computers.png"],link:"/#shop"},
  {title:"Avast Antivirus",image:loadads["/assets/images/ads/avast.png"],link:"/#shop"},
];
</script>
<style scoped>
.slide-enter-active,.slide-leave-active{transition:opacity .45s ease,transform .45s ease}.slide-enter-from{opacity:0;transform:translateX(18px)}.slide-leave-to{opacity:0;transform:translateX(-18px)}
</style>
