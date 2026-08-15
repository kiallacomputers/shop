<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- LOGO -->
        <NuxtLink to="/" class="flex items-center shrink-0">
          <img src="/kc_logo.png" alt="Kialla Computers" class="h-14 w-auto" />
        </NuxtLink>

        <!-- DESKTOP NAV -->
        <nav class="hidden md:flex items-center gap-8">
          <NuxtLink to="/" class="text-gray-700 hover:text-sky-600 font-medium">
            Home
          </NuxtLink>

          <NuxtLink
            to="/products"
            class="text-gray-700 hover:text-sky-600 font-medium"
          >
            Products
          </NuxtLink>

          <NuxtLink
            to="/about"
            class="text-gray-700 hover:text-sky-600 font-medium"
          >
            About
          </NuxtLink>

          <!-- ADMIN -->
          <NuxtLink
            v-if="showAdmin"
            to="/admin"
            class="text-red-600 hover:text-red-700 font-semibold"
          >
            Admin
          </NuxtLink>

          <!-- ACCOUNT -->
          <NuxtLink
            v-if="user"
            to="/account"
            class="text-gray-700 hover:text-sky-600 font-medium"
          >
            Account
          </NuxtLink>

          <!-- SIGN IN -->
          <NuxtLink
            v-else
            to="/signin"
            class="text-gray-700 hover:text-sky-600 font-medium"
          >
            Sign In
          </NuxtLink>
        </nav>

        <!-- RIGHT SIDE -->
        <div class="flex items-center gap-4">
          <!-- SHOPPING CART -->
          <NuxtLink
            to="/cart"
            class="relative text-gray-700 hover:text-sky-600"
            aria-label="Shopping Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 2h12m-9 4a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>

            <span
              v-if="cart.count > 0"
              class="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center"
            >
              {{ cart.count }}
            </span>
          </NuxtLink>

          <!-- MOBILE MENU -->
          <button
            type="button"
            class="md:hidden text-gray-700"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- MOBILE MENU -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-gray-200 py-4"
      >
        <nav class="flex flex-col gap-3">
          <NuxtLink
            to="/"
            class="px-2 py-2 text-gray-700 hover:text-sky-600"
            @click="mobileMenuOpen = false"
          >
            Home
          </NuxtLink>

          <NuxtLink
            to="/products"
            class="px-2 py-2 text-gray-700 hover:text-sky-600"
            @click="mobileMenuOpen = false"
          >
            Products
          </NuxtLink>

          <NuxtLink
            to="/about"
            class="px-2 py-2 text-gray-700 hover:text-sky-600"
            @click="mobileMenuOpen = false"
          >
            About
          </NuxtLink>

          <!-- MOBILE ADMIN -->
          <NuxtLink
            v-if="showAdmin"
            to="/admin"
            class="px-2 py-2 text-red-600 font-semibold"
            @click="mobileMenuOpen = false"
          >
            Admin
          </NuxtLink>

          <NuxtLink
            v-if="user"
            to="/account"
            class="px-2 py-2 text-gray-700 hover:text-sky-600"
            @click="mobileMenuOpen = false"
          >
            Account
          </NuxtLink>

          <NuxtLink
            v-else
            to="/signin"
            class="px-2 py-2 text-gray-700 hover:text-sky-600"
            @click="mobileMenuOpen = false"
          >
            Sign In
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();

const user = useSupabaseUser();

const cart = useCartStore();

const mobileMenuOpen = ref(false);

const { isAdmin, adminChecked, checkAdmin } = useAdminFetch();

const showAdmin = computed(() => {
  return !!user.value && adminChecked.value && isAdmin.value;
});

/*
 * Check administrator status whenever
 * the authenticated user changes.
 */
watch(
  user,
  async (currentUser) => {
    if (!currentUser) {
      isAdmin.value = false;
      adminChecked.value = true;
      return;
    }

    adminChecked.value = false;

    await nextTick();

    await checkAdmin();
  },
  {
    immediate: true,
  },
);
</script>
