<template>
  <section class="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="relative aspect-[16/5] min-h-[140px] overflow-hidden">
      <Transition :name="transitionName">
        <NuxtLink
          :to="displayAds[currentAd].link"
          :key="`${currentAd}-${displayAds[currentAd].image}`"
          class="absolute inset-0 block will-change-transform"
        >
          <img
            :src="displayAds[currentAd].image"
            :alt="displayAds[currentAd].title"
            class="h-full w-full object-cover"
            draggable="false"
          />
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
const transitionName = ref("slide-left");
let timer;

const nextAd = () => {
  if (displayAds.value.length <= 1) return;
  transitionName.value = "slide-left";
  currentAd.value = (currentAd.value + 1) % displayAds.value.length;
};

watch(displayAds, () => {
  if (currentAd.value >= displayAds.value.length) currentAd.value = 0;
});

onMounted(() => {
  timer = window.setInterval(nextAd, 10000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 850ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.slide-left-enter-from {
  transform: translate3d(100%, 0, 0);
}

.slide-left-enter-to,
.slide-left-leave-from {
  transform: translate3d(0, 0, 0);
}

.slide-left-leave-to {
  transform: translate3d(-100%, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active {
    transition-duration: 1ms;
  }
}
</style>
