<template>
  <section class="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="ad-frame relative overflow-hidden">
      <div class="absolute inset-0">
        <NuxtLink
          v-for="(ad, index) in displayAds"
          :key="`${index}-${ad.image}`"
          :to="ad.link"
          class="ad-slide absolute inset-0 block h-full w-full"
          :class="slideClass(index)"
          :aria-hidden="index !== currentAd"
          :tabindex="index === currentAd ? 0 : -1"
        >
          <img
            :src="ad.image"
            :alt="ad.title"
            class="block h-full w-full object-cover"
            draggable="false"
          />
        </NuxtLink>
      </div>
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
const previousAd = ref(0);
const isAnimating = ref(false);
let timer;
let animationTimer;

const slideClass = (index) => {
  if (!isAnimating.value) {
    return index === currentAd.value
      ? "ad-slide-current"
      : "ad-slide-hidden-right";
  }

  if (index === currentAd.value) return "ad-slide-entering";
  if (index === previousAd.value) return "ad-slide-leaving";
  return "ad-slide-hidden-right";
};

const nextAd = () => {
  if (displayAds.value.length <= 1 || isAnimating.value) return;

  previousAd.value = currentAd.value;
  currentAd.value = (currentAd.value + 1) % displayAds.value.length;
  isAnimating.value = true;

  if (animationTimer) window.clearTimeout(animationTimer);
  animationTimer = window.setTimeout(() => {
    isAnimating.value = false;
  }, 900);
};

watch(displayAds, () => {
  if (currentAd.value >= displayAds.value.length) currentAd.value = 0;
  previousAd.value = currentAd.value;
  isAnimating.value = false;
});

onMounted(() => {
  timer = window.setInterval(nextAd, 10000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
  if (animationTimer) window.clearTimeout(animationTimer);
});
</script>

<style scoped>
.ad-frame {
  width: 100%;
  aspect-ratio: 16 / 5;
  min-height: 140px;
  max-height: 500px;
  contain: layout paint;
}

@media (max-width: 640px) {
  .ad-frame {
    aspect-ratio: 16 / 9;
    min-height: 0;
  }
}


.ad-slide {
  transform: translate3d(100%, 0, 0);
  transition: transform 850ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
  backface-visibility: hidden;
}

.ad-slide-current {
  z-index: 2;
  transform: translate3d(0, 0, 0);
}

.ad-slide-entering {
  z-index: 3;
  transform: translate3d(0, 0, 0);
}

.ad-slide-leaving {
  z-index: 2;
  transform: translate3d(-100%, 0, 0);
}

.ad-slide-hidden-right {
  z-index: 1;
  transform: translate3d(100%, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
  .ad-slide {
    transition-duration: 1ms;
  }
}
</style>
