<template>
  <main>
    <section class="relative overflow-hidden bg-[#0b1f3a] text-white">
      <div class="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_85%_20%,rgba(39,182,214,.45),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(35,103,209,.45),transparent_35%)]"></div>
      <div class="relative max-w-7xl mx-auto px-4 py-14 md:py-20 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div>
          <p class="text-cyan-300 text-xs font-black uppercase tracking-[.2em]">Kialla Computers</p>
          <h1 class="mt-4 max-w-3xl text-4xl md:text-6xl font-black tracking-tight leading-[1.03]">Computers without the hassle.</h1>
          <p class="mt-5 max-w-2xl text-base md:text-lg leading-8 text-slate-300">Quality computers, components, upgrades and practical support from a local independent business. Straightforward advice, secure checkout and Australian delivery.</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a href="#shop" class="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-6 py-3.5 font-black text-[#0b1f3a] hover:bg-cyan-300 transition">Shop products</a>
            <a href="#categories" class="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 font-black text-white hover:bg-white/15 transition">Browse categories</a>
          </div>
        </div>

        <div class="relative">
          <div class="rounded-[1.5rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <div class="overflow-hidden rounded-[1.1rem] bg-white">
              <Transition name="slide">
                <NuxtLink :to="ads[currentAd].link" :key="currentAd" class="block aspect-[16/9]">
                  <img :src="ads[currentAd].image" :alt="ads[currentAd].title" class="h-full w-full object-cover" />
                </NuxtLink>
              </Transition>
            </div>
          </div>
          <div class="absolute -bottom-5 -left-4 rounded-xl bg-white px-4 py-3 text-[#0b1f3a] shadow-xl hidden sm:block">
            <p class="text-xs font-black uppercase tracking-wide text-cyan-600">Local support</p>
            <p class="mt-1 text-sm font-bold">Real help when you need it.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-slate-200 bg-white">
      <div class="max-w-7xl mx-auto px-4 py-5 grid gap-4 sm:grid-cols-3">
        <div v-for="item in benefits" :key="item.title" class="flex items-center gap-3 sm:justify-center">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600" v-html="item.icon"></div>
          <div><p class="text-sm font-black text-[#0b1f3a]">{{ item.title }}</p><p class="text-xs text-slate-500">{{ item.text }}</p></div>
        </div>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <section id="categories" class="mb-12">
        <div class="flex items-end justify-between gap-4 mb-5">
          <div><p class="kc-eyebrow">Find what you need</p><h2 class="kc-title mt-1 text-2xl md:text-3xl">Shop by category</h2></div>
        </div>
        <div v-if="shopCategories.length" class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <NuxtLink v-for="category in shopCategories" :key="category.id" :to="`/category/${category.slug}`" class="group kc-panel p-4 min-h-[110px] flex flex-col justify-between hover:-translate-y-1 hover:border-cyan-300 transition duration-200">
            <div class="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-[#2367d1] group-hover:bg-blue-50">⌁</div>
            <p class="mt-4 font-extrabold text-[#0b1f3a] group-hover:text-blue-600 transition">{{ category.name }}</p>
          </NuxtLink>
        </div>
      </section>

      <section id="shop" class="grid gap-7 lg:grid-cols-[240px_1fr] items-start">
        <aside class="lg:sticky lg:top-28"><Sidemenu /></aside>
        <div id="featured">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5">
            <div><p class="kc-eyebrow">Recommended</p><h2 class="kc-title mt-1 text-2xl md:text-3xl">Featured products</h2></div>
            <p class="text-sm text-slate-500">Carefully selected products from our current range.</p>
          </div>
          <div v-if="featuredProducts?.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
          </div>
          <div v-else class="kc-panel p-10 text-center text-slate-500">No featured products are available right now.</div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
const supabase = useSupabaseClient();

const { data: featuredProducts } = await useAsyncData("featured-products", async () => {
  const { data, error } = await supabase.from("products").select(`*, categories (name)`).eq("featured", true).eq("active", true);
  if (error) throw error;
  return data;
});

const { data: categoryData } = await useAsyncData("homepage-categories", async () => {
  const { data, error } = await supabase.from("categories").select("id,name,slug,parent_id,active,sort_order").eq("active", true).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (error) throw error;
  return data || [];
});

const shopCategories = computed(() => (categoryData.value || []).filter((c) => c.slug).slice(0, 6));
const currentAd = ref(0);
let timer;
onMounted(() => { timer = window.setInterval(() => { currentAd.value = (currentAd.value + 1) % ads.length; }, 10000); });
onBeforeUnmount(() => { if (timer) window.clearInterval(timer); });

const loadads = import.meta.glob("~/assets/images/ads/*", { eager: true, import: "default" });
const ads = [
  { title: "Computer Builds", image: loadads["/assets/images/ads/computers.png"], link: "#shop" },
  { title: "Avast Antivirus", image: loadads["/assets/images/ads/avast.png"], link: "#shop" },
];

const benefits = [
  { title: "Local support", text: "Friendly, practical help", icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2"/></svg>' },
  { title: "Secure checkout", text: "Safe online payment", icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="5" y="10" width="14" height="10" rx="2"/></svg>' },
  { title: "Australian delivery", text: "Clear freight options", icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>' },
];
</script>

<style scoped>
.slide-enter-active,.slide-leave-active { transition:opacity .45s ease,transform .45s ease; }
.slide-enter-from { opacity:0; transform:translateX(20px); }
.slide-leave-to { opacity:0; transform:translateX(-20px); }
</style>
