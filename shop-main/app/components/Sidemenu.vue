<template>
  <div>
    <button @click="mobileOpen = !mobileOpen" class="md:hidden w-full flex items-center justify-between kc-panel px-4 py-3 mb-4 text-[#0b1f3a] font-extrabold">
      <span>Browse Categories</span><span class="text-lg">{{ mobileOpen ? '−' : '+' }}</span>
    </button>
    <aside class="w-full kc-panel overflow-hidden" :class="[mobileOpen ? 'block' : 'hidden', 'md:block']">
      <div class="bg-[#0b1f3a] px-5 py-4">
        <p class="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Browse</p>
        <h2 class="mt-1 text-lg font-black text-white">Categories</h2>
      </div>
      <div class="p-3">
        <div v-if="categories.length === 0" class="p-3 text-sm text-slate-500">No categories found.</div>
        <ul v-else class="space-y-1">
          <li v-for="category in categories" :key="category.id">
            <div class="flex items-center gap-1">
              <NuxtLink :to="`/category/${category.slug}`" class="flex-1 rounded-lg px-3 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition">{{ category.name }}</NuxtLink>
              <button v-if="category.items.length" @click="toggle(category.id)" class="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" :aria-label="`Toggle ${category.name}`">{{ openMenu === category.id ? '−' : '+' }}</button>
            </div>
            <Transition name="submenu">
              <ul v-if="openMenu === category.id" class="ml-3 pl-3 pb-2">
                <li v-for="(item, itemIndex) in category.items" :key="item.id" class="relative">
                  <span
                    class="absolute -left-3 top-0 w-px bg-slate-200"
                    :class="itemIndex === category.items.length - 1 ? 'h-1/2' : 'h-full'"
                    aria-hidden="true"
                  ></span>
                  <span class="absolute -left-3 top-1/2 h-px w-3 bg-slate-200" aria-hidden="true"></span>
                  <NuxtLink :to="`/category/${item.slug}`" class="block rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-blue-600">{{ item.name }}</NuxtLink>
                </li>
              </ul>
            </Transition>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>
<script setup>
const supabase = useSupabaseClient();
const mobileOpen = ref(false); const openMenu = ref(null);
const toggle = (id) => { openMenu.value = openMenu.value === id ? null : id; };
const { data, error: categoriesError } = await useAsyncData("categories", async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,parent_id,active")
    .order("name", { ascending: true });

  if (error) {
    console.error("CATEGORY LOAD ERROR:", error);
    throw error;
  }

  return data || [];
});

const visibleCategoryData = computed(() =>
  (data.value || []).filter((category) => category.active !== false),
);

const isTopLevel = (category) =>
  category.parent_id === null ||
  category.parent_id === undefined ||
  category.parent_id === "";

const categories = computed(() =>
  visibleCategoryData.value
    .filter(isTopLevel)
    .map((parent) => ({
      ...parent,
      items: visibleCategoryData.value
        .filter((child) => String(child.parent_id ?? "") === String(parent.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })),
);
</script>
<style scoped>
.submenu-enter-active,.submenu-leave-active { transition:all .22s ease; overflow:hidden; }
.submenu-enter-from,.submenu-leave-to { opacity:0; max-height:0; }
.submenu-enter-to,.submenu-leave-from { opacity:1; max-height:400px; }
</style>
