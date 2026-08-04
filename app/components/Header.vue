<template>
  <header class="bg-white" :isLoggedIn="isLoggedIn">
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <!-- Logo Left -->
      <NuxtLink to="/" class="flex items-center">
        <img src="~/assets/images/logos/kc_logo.png" alt="Logo" class="w-20" />
      </NuxtLink>

      <!-- Menu Right. -->
      <div class="flex items-center gap-8">
        <nav class="md:flex items-center gap-8">
          <!-- <NuxtLink to="/" class="text-slate-700 hover:text-blue-600">
            Home
          </NuxtLink>

          <NuxtLink to="/shop" class="text-slate-700 hover:text-blue-600">
            Shop
          </NuxtLink> -->

          <NuxtLink
            v-if="!user"
            to="/auth/signin"
            class="text-slate-700 hover:text-blue-600"
          >
            Signup/Login
          </NuxtLink>

          <NuxtLink
            v-if="user"
            to="/admin/dashboard"
            class="text-slate-700 hover:text-blue-600"
          >
            My Account
          </NuxtLink>

          <NuxtLink
            v-if="user"
            to="#"
            class="text-slate-700 hover:text-blue-600"
          >
            Sign Out
          </NuxtLink>
        </nav>

        <!-- Shopping Cart -->
        <NuxtLink to="#" class="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-7 h-7 text-slate-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 7h13"
            />
          </svg>

          <span
            class="absolute -top-2 -right-2 bg-red-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            0
          </span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
const user = useSupabaseUser();

const isLoggedIn = computed(() => !!user.value);

console.log("Logged in:", isLoggedIn.value);
</script>
