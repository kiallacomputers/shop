<template>
    <!-- Advertisement -->
    <section class="w-full flex justify-center overflow-hidden">
      <div
        class="relative w-[310px] md:w-full md:max-w-[800px] h-[116px] md:h-[240px] overflow-hidden rounded-lg"
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

</script>


