<template>
  <!-- Advertisement -->
  <section class="w-full flex justify-center overflow-hidden">
    <div
      class="relative w-[400px] md:w-full md:max-w-[800px] h-[116px] md:h-[240px] overflow-hidden rounded-lg"
    >
      <Transition name="slide">
        <NuxtLink
          :to="ads[currentAd].link"
          :key="currentAd"
          class="absolute inset-0"
        >
          <img
            :src="ads[currentAd].image"
            :alt="ads[currentAd].title"
            class="w-full h-full object-cover"
          />
        </NuxtLink>
      </Transition>
    </div>
  </section>
</template>

<script setup>
const currentAd = ref(0);

onMounted(() => {
  setInterval(() => {
    currentAd.value++;

    if (currentAd.value >= ads.length) {
      currentAd.value = 0;
    }
  }, 10000);
});

const images = import.meta.glob("~/assets/images/products/*", {
  eager: true,
  import: "default",
});

const loadads = import.meta.glob("~/assets/images/ads/*", {
  eager: true,
  import: "default",
});

const ads = [
  {
    title: "Computer Builds",
    image: loadads["/assets/images/ads/computers.png"],
    link: "#",
  },
  {
    title: "Avast Antivirus",
    image: loadads["/assets/images/ads/avast.png"],
    link: "#",
  },
];
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.8s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>
