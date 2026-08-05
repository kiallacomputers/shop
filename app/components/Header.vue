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

          <button
            v-if="user"
            @click="logout"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-red-700 transition"
          >
            <!-- Sign out icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
              />
            </svg>
          </button>
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
const supabase = useSupabaseClient();

const isLoggedIn = computed(() => !!user.value);

console.log("Logged in:", isLoggedIn);

const logout = async () => {
  await supabase.auth.signOut();
  navigateTo("/");
};
</script>
