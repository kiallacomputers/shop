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
            v-for="product in products"
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
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      // .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    console.log(featuredProducts.value);

    return data;
  }
);
  
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

// const products = [
//   {
//     id: 1,
//     slug: "intel-core-i7-14700k",
//     name: "Intel Core i7-14700K Desktop Processor",
//     category: "Processors",
//     description:
//       "20-core desktop processor delivering exceptional gaming and multitasking performance.",
//     image: images["/assets/images/products/intel-i7-14700k.png"],
//     price: 699.0,
//     oldPrice: 749.0,
//     reviews: 126,
//     stock: 18,
//     featured: true,
//   },
//   {
//     id: 2,
//     slug: "asus-rt-ax88u-pro",
//     name: "ASUS RT-AX88U Pro WiFi 6 Router",
//     category: "Networking",
//     description:
//       "High-speed dual-band WiFi 6 router with advanced security and gaming features.",
//     image: images["/assets/images/products/asus-rt-ax88u-pro.png"],
//     price: 499.0,
//     oldPrice: 549.0,
//     reviews: 87,
//     stock: 9,
//     featured: false,
//   },
//   {
//     id: 3,
//     slug: "samsung-990-pro-2tb",
//     name: "Samsung 990 PRO 2TB NVMe SSD",
//     category: "Storage",
//     description:
//       "Ultra-fast PCIe 4.0 NVMe SSD designed for gaming, content creation, and demanding workloads.",
//     image: images["/assets/images/products/samsung-990-pro-2tb.png"],
//     price: 279.0,
//     oldPrice: 319.0,
//     reviews: 214,
//     stock: 32,
//     featured: true,
//   },
// ];
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
