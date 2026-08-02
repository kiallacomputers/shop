<template>
  <aside class="w-64 bg-white rounded-lg p-5">
    <h2 class="text-xl font-bold mb-4 text-slate-800">Categories</h2>

    <ul class="space-y-2">
      <li v-for="category in categories" :key="category.name">
        <!-- Main Category -->
        <button
          @click="toggle(category.name)"
          class="w-full flex items-center py-2 text-left hover:text-blue-600"
        >
          <!-- Plus / Minus -->
          <span
            class="w-6 h-6 flex items-center justify-center rounded text-slate-600 font-bold text-sm"
          >
            {{ openMenu === category.name ? "−" : "+" }}
          </span>

          <span class="font-medium text-slate-700">
            {{ category.name }}
          </span>
        </button>

        <!-- Sub Categories -->
        <Transition name="submenu">
          <ul
            v-if="openMenu === category.name"
            class="ml-7 mt-2 space-y-2 pl-2"
          >
            <li v-for="item in category.items" :key="item.name">
              <NuxtLink
                :to="item.link"
                class="block text-sm text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </Transition>
      </li>
    </ul>
  </aside>
</template>

<script setup>
const openMenu = ref(null);

const toggle = (name) => {
  openMenu.value = openMenu.value === name ? null : name;
};

const categories = [
  {
    name: "Computers",
    items: [
      { name: "Gaming PCs", link: "#" },
      { name: "Business PCs", link: "#" },
      { name: "Mini PCs", link: "#" },
    ],
  },
  {
    name: "Laptops",
    items: [
      { name: "Gaming Laptops", link: "#" },
      { name: "Business Laptops", link: "#" },
      { name: "Student Laptops", link: "#" },
    ],
  },
  {
    name: "Accessories",
    items: [
      { name: "Keyboards", link: "#" },
      { name: "Mice", link: "#" },
      { name: "Headsets", link: "#" },
    ],
  },
  {
    name: "Gaming",
    items: [
      { name: "Gaming Chairs", link: "#" },
      { name: "Controllers", link: "#" },
      { name: "Streaming Gear", link: "#" },
    ],
  },
];
</script>

<style scoped>
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>
