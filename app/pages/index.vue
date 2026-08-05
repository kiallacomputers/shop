<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
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

    <!-- Sidebar + Products -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 shrink-0">
        <Sidemenu />
      </aside>

      <!-- Products -->
      <main class="flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
// const { isLoggedIn } = defineProps({
//   isLoggedIn: Boolean,
// });
const supabase = useSupabaseClient();

const { data: featuredProducts, error } = await useAsyncData(
  "featured-products",
  async () => {
    console.log("Fetching featured products...");

    const result = await supabase
      .from("products")
      .select("*")
      .eq("featured", true);

    console.log("Result:", result);

    if (result.error) {
      console.error("Supabase Error:", result.error);
      throw result.error;
    }

    return result.data;
  }
);

  const { data: categories } = await supabase
  .from("categories")
  .select("id, name");

const categoryMap = Object.fromEntries(
  categories.map(c => [c.id, c.name])
);

return data.map(product => ({
  ...product,
  categoryName: categoryMap[product.category] || "",
}));
  
watchEffect(() => {
  console.log("featuredProducts:", featuredProducts.value);
});
  
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
