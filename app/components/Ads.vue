<template>
  <section class="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="relative aspect-[16/5] min-h-[140px] overflow-hidden">
      <Transition name="slide">
        <NuxtLink :to="displayAds[currentAd].link" :key="`${currentAd}-${displayAds[currentAd].image}`" class="absolute inset-0">
          <img :src="displayAds[currentAd].image" :alt="displayAds[currentAd].title" class="h-full w-full object-cover" />
        </NuxtLink>
      </Transition>
    </div>
  </section>
</template>

<script setup>
const loadads = import.meta.glob("~/assets/images/ads/*", { eager: true, import: "default" });
const fallbackAds = [
  { title: "Computer Builds", image: loadads["/assets/images/ads/computers.png"], link: "/#shop" },
  { title: "Avast Antivirus", image: loadads["/assets/images/ads/avast.png"], link: "/#shop" },
];

const { data: databaseAds } = await useFetch("/api/ads", { default: () => [] });
const displayAds = computed(() => {
  const rows = Array.isArray(databaseAds.value) ? databaseAds.value : [];
  if (!rows.length) return fallbackAds;
  return rows.map((ad) => ({
    title: ad.title || "Kialla Computers",
    image: ad.image_url,
    link: ad.link_url || "/#shop",
  }));
});

const currentAd = ref(0);
let timer;

watch(displayAds, () => {
  if (currentAd.value >= displayAds.value.length) currentAd.value = 0;
});

onMounted(() => {
  timer = window.setInterval(() => {
    if (displayAds.value.length > 1) currentAd.value = (currentAd.value + 1) % displayAds.value.length;
  }, 10000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped>
.slide-enter-active,.slide-leave-active{transition:opacity .45s ease,transform .45s ease}.slide-enter-from{opacity:0;transform:translateX(18px)}.slide-leave-to{opacity:0;transform:translateX(-18px)}
</style>
