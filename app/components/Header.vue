<template>
  <header class="bg-white">
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <!-- Logo Left -->
      <NuxtLink to="/" class="flex items-center">
        <img src="~/assets/images/logos/kc_logo.png" alt="Logo" class="w-20" />
      </NuxtLink>

      <!-- Menu Right -->
      <div class="flex items-center gap-8">
        <nav class="md:flex items-center gap-8">
          <!-- Signup / Login -->
          <NuxtLink
            v-if="!user"
            to="/auth/signin"
            class="text-[#566C9D] hover:text-[#2CB6D5] font-bold"
          >
            Signup/Login
          </NuxtLink>

          <!-- Welcome -->
          <p v-if="user" class="mr-5 text-[#566C9D] font-bold">
            Welcome {{ firstName }}
          </p>

          <!-- My Account -->
          <NuxtLink
            v-if="user"
            to="/admin/dashboard"
            class="text-[#404E71] hover:text-[#2CB6D5] font-bold"
          >
            My Account
          </NuxtLink>

          <!-- ADMIN -->
          <NuxtLink
            v-if="user && isAdmin"
            to="/admin"
            class="text-[#404E71] hover:text-[#2CB6D5] font-bold"
          >
            Admin
          </NuxtLink>

          <!-- Logout -->
          <button
            v-if="user"
            @click="logout"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-red-700 transition"
            title="Sign Out"
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
        <NuxtLink to="/shoppingcart" class="relative">
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
            {{ cart.count }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </header>

  <!-- Cart Notification -->
  <Transition name="toast">
    <div
      v-if="cart.notification"
      class="fixed top-20 right-5 z-[9999] bg-green-600 text-white px-5 py-4 rounded-lg shadow-lg flex items-center gap-3"
    >
      <span class="text-xl">✓</span>

      <span>{{ cart.notification }}</span>
    </div>
  </Transition>
</template>

<script setup>
const user = useSupabaseUser();

const supabase = useSupabaseClient();

const cart = useCartStore();

// ----------------------------------------
// FIRST NAME
// ----------------------------------------

const firstName = computed(() => {
  return user.value?.user_metadata?.display_name?.trim().split(/\s+/)[0] ?? "";
});

// ----------------------------------------
// ADMIN STATUS
// ----------------------------------------

const isAdmin = ref(false);

// ----------------------------------------
// CHECK ADMIN
// ----------------------------------------

const checkAdmin = async () => {
  isAdmin.value = false;

  if (!user.value) {
    return;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return;
    }

    await $fetch("/api/admin/check", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    // If the API didn't throw an error,
    // the user is an admin.

    isAdmin.value = true;

    console.log("ADMIN USER:", user.value.email);
  } catch (error) {
    isAdmin.value = false;

    console.log("USER IS NOT ADMIN");
  }
};

// ----------------------------------------
// WATCH USER
// ----------------------------------------

watch(
  user,
  async () => {
    await checkAdmin();
  },
  {
    immediate: true,
  },
);

// ----------------------------------------
// LOGOUT
// ----------------------------------------

const logout = async () => {
  await supabase.auth.signOut();

  isAdmin.value = false;

  await navigateTo("/");
};
</script>
