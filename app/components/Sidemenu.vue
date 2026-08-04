<template>
  <div>
    <!-- Mobile Category Button -->
    <button
      @click="mobileOpen = !mobileOpen"
      class="md:hidden w-full flex items-center justify-between bg-white rounded-lg shadow md:shadow-none px-4 py-3 mb-4 text-slate-800 font-semibold"
    >
      <span>Categories</span>

      <svg
        class="w-5 h-5 transition-transform"
        :class="{ 'rotate-180': mobileOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Desktop + Mobile Menu -->
    <aside
      class="w-full md:w-64 bg-white rounded-lg p-5 shadow md:shadow-none"
      :class="[mobileOpen ? 'block' : 'hidden', 'md:block']"
    >
      <h2 class="hidden md:block text-xl font-bold mb-4 text-slate-800">
        Categories
      </h2>

      <ul class="space-y-1">
        <li v-for="category in categories" :key="category.name">
          <!-- Category -->
          <button
            @click="toggle(category.name)"
            class="flex items-center gap-1 w-full py-1 text-left text-slate-700 hover:text-blue-600"
          >
            <span
              class="w-5 h-5 flex items-center justify-center border rounded text-sm"
            >
              {{ openMenu === category.name ? "−" : "+" }}
            </span>

            <span class="font-medium">
              {{ category.name }}
            </span>
          </button>

          <!-- Sub Categories -->
          <Transition name="submenu">
            <ul
              v-if="openMenu === category.name"
              class="ml-8 mt-2 space-y-2 border-l pl-3"
            >
              <li v-for="item in category.items" :key="item.name">
                <NuxtLink
                  :to="item.link"
                  class="block text-sm text-slate-600 hover:text-blue-600"
                >
                  {{ item.name }}
                </NuxtLink>
              </li>
            </ul>
          </Transition>
        </li>
      </ul>
    </aside>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

const mobileOpen = ref(false);
const openMenu = ref(null);

const toggle = (name) => {
  openMenu.value = openMenu.value === name ? null : name;
};

const { data } = await useAsyncData("categories", async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;

  return data;
});

const categories = computed(() => {
  if (!data.value) return [];

  const parents = data.value
    .filter((c) => c.parent_id === null)
    .map((parent) => ({
      ...parent,
      items: data.value.filter((child) => child.parent_id === parent.id),
    }));

  console.log("Parent Categories:", parents);

  return parents;
});
</script>

<style scoped>
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
