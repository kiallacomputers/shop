<template>
  <div>
    <!-- Mobile Category Button -->
    <button
      @click="mobileOpen = !mobileOpen"
      class="md:hidden w-full flex items-center justify-between bg-white rounded-lg shadow px-4 py-3 mb-4 text-[#404E71] font-semibold"
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

    <!-- Sidebar -->
    <aside
      class="w-full md:w-64 bg-white rounded-lg p-5"
      :class="[mobileOpen ? 'block' : 'hidden', 'md:block']"
    >
      <h2 class="hidden md:block text-xl font-bold mb-4 text-[#404E71]">
        Categories
      </h2>

      <!-- If no categories -->
      <div v-if="categories.length === 0" class="text-sm text-[#404E71]">
        No categories found.
      </div>

      <ul v-else class="space-y-2">
        <li v-for="category in categories" :key="category.id">
          <!-- Parent -->
          <button
            @click="category.items.length ? toggle(category.id) : null"
            class="flex items-center gap-1 text-[#404E71] w-full text-left py-1 hover:text-[#2CB6D5]"
          >
            <span
              v-if="category.items.length"
              class="w-5 h-5 flex items-center justify-center border rounded text-sm"
            >
              {{ openMenu === category.id ? "−" : "+" }}
            </span>

            <span v-else class="w-5"></span>

            <span class="font-medium">
              {{ category.name }}
            </span>
          </button>

          <!-- Children -->
          <Transition name="submenu">
            <ul
              v-if="openMenu === category.id"
              class="ml-8 mt-2 space-y-2 pl-4"
            >
              <li v-for="item in category.items" :key="item.id">
                <NuxtLink
                  :to="`/category/${item.slug}`"
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

const toggle = (id) => {
  openMenu.value = openMenu.value === id ? null : id;
};

// Fetch categories
const { data, error } = await useAsyncData("categories", async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase Error:", error);
    throw error;
  }

  console.log("Supabase returned:", data);

  return data;
});

// Build parent/child structure
const categories = computed(() => {
  if (!data.value) return [];

  const parents = data.value
    .filter((c) => c.parent_id === null)
    .map((parent) => ({
      ...parent,
      items: data.value
        .filter((child) => child.parent_id === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));

  return parents;
});

// Debug output
watchEffect(() => {
  // console.log("Computed categories:", categories.value);
  console.log("Data:", data.value);
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
