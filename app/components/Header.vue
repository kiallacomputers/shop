<template>
  <header class="bg-white relative z-50">
    <!-- ========================================= -->
    <!-- HEADER -->
    <!-- ========================================= -->

    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <!-- ======================================= -->
      <!-- LOGO -->
      <!-- ======================================= -->

      <NuxtLink to="/" class="flex items-center shrink-0">
        <img
          src="~/assets/images/logos/kc_logo.png"
          alt="Kialla Computers"
          class="w-20"
        />
      </NuxtLink>

      <!-- ======================================= -->
      <!-- RIGHT SIDE -->
      <!-- DESKTOP MENU + CART + MOBILE BUTTON -->
      <!-- ======================================= -->

      <div class="flex items-center gap-6">
        <!-- ===================================== -->
        <!-- DESKTOP MENU -->
        <!-- ===================================== -->

        <nav class="hidden md:flex items-center gap-6">
          <!-- Signup / Login -->
          <NuxtLink
            v-if="!user"
            to="/auth/signin"
            class="text-[#566C9D] hover:text-[#2CB6D5] font-bold transition"
          >
            Signup/Login
          </NuxtLink>

          <!-- Welcome -->
          <p v-if="user" class="text-[#566C9D] font-bold">
            Welcome {{ firstName }}
          </p>

          <!-- My Account -->
          <NuxtLink
            v-if="user"
            to="/admin/account/"
            class="text-[#404E71] hover:text-[#2CB6D5] font-bold transition"
          >
            My Account
          </NuxtLink>

          <!-- ADMIN -->
          <NuxtLink
            v-if="user && isAdmin"
            to="/admin"
            class="text-[#404E71] hover:text-[#2CB6D5] font-bold transition"
          >
            Admin
          </NuxtLink>

          <!-- Logout -->
          <button
            v-if="user"
            type="button"
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

            <span>Logout</span>
          </button>
        </nav>

        <!-- ===================================== -->
        <!-- SHOPPING CART -->
        <!-- ===================================== -->

        <NuxtLink
          to="/shoppingcart"
          class="relative p-1"
          aria-label="Shopping Cart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-7 h-7 text-slate-700 hover:text-[#2CB6D5] transition"
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

          <!-- Cart Count -->
          <span
            v-if="cart.count > 0"
            class="absolute -top-2 -right-2 bg-red-800 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center"
          >
            {{ cart.count }}
          </span>
        </NuxtLink>

        <!-- ===================================== -->
        <!-- MOBILE MENU BUTTON -->
        <!-- ===================================== -->

        <button
          type="button"
          class="md:hidden p-2 text-slate-700 hover:text-[#2CB6D5] transition"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle navigation menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <!-- Hamburger -->
          <svg
            v-if="!mobileMenuOpen"
            xmlns="http://www.w3.org/2000/svg"
            class="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>

          <!-- Close -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- ========================================= -->
    <!-- MOBILE MENU -->
    <!-- ========================================= -->

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileMenuOpen"
        class="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-xl"
      >
        <nav class="max-w-7xl mx-auto px-4 py-3">
          <!-- =================================== -->
          <!-- SIGNUP / LOGIN -->
          <!-- =================================== -->

          <NuxtLink
            v-if="!user"
            to="/auth/signin"
            class="mobile-menu-item"
            @click="closeMobileMenu"
          >
            <span>Signup / Login</span>

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
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
              />
            </svg>
          </NuxtLink>

          <!-- =================================== -->
          <!-- WELCOME -->
          <!-- =================================== -->

          <div v-if="user" class="px-4 py-4 border-b border-gray-200">
            <p class="text-[#566C9D] font-bold">Welcome {{ firstName }}</p>
          </div>

          <!-- =================================== -->
          <!-- MY ACCOUNT -->
          <!-- =================================== -->

          <NuxtLink
            v-if="user"
            to="/admin/dashboard"
            class="mobile-menu-item"
            @click="closeMobileMenu"
          >
            <span>My Account</span>

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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003a6.375 6.375 0 00-12.75 0v.003m15.75-6.376a4.125 4.125 0 01-8.25 0 4.125 4.125 0 018.25 0z"
              />
            </svg>
          </NuxtLink>

          <!-- =================================== -->
          <!-- ADMIN -->
          <!-- =================================== -->

          <NuxtLink
            v-if="user && isAdmin"
            to="/admin"
            class="mobile-menu-item"
            @click="closeMobileMenu"
          >
            <span>Admin</span>

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
                d="M10.5 6h3m-6 12h9m-10.5-6h12M6.75 3h10.5A2.25 2.25 0 0119.5 5.25v13.5A2.25 2.25 0 0117.25 21H6.75a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 016.75 3z"
              />
            </svg>
          </NuxtLink>

          <!-- =================================== -->
          <!-- LOGOUT -->
          <!-- =================================== -->

          <button
            v-if="user"
            type="button"
            class="mobile-menu-item w-full text-left text-red-600 hover:text-red-700"
            @click="logout"
          >
            <span>Sign Out</span>

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
      </div>
    </Transition>
  </header>

  <!-- ========================================= -->
  <!-- CART NOTIFICATION -->
  <!-- ========================================= -->

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

// ========================================
// MOBILE MENU
// ========================================

const mobileMenuOpen = ref(false);

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

// ========================================
// FIRST NAME
// ========================================

const firstName = computed(() => {
  return user.value?.user_metadata?.display_name?.trim().split(/\s+/)[0] ?? "";
});

// ========================================
// ADMIN STATUS
// ========================================

const isAdmin = ref(false);

// ========================================
// CHECK ADMIN
// ========================================

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

    isAdmin.value = true;

    console.log("ADMIN USER:", user.value.email);
  } catch (error) {
    isAdmin.value = false;

    console.log("USER IS NOT ADMIN");
  }
};

// ========================================
// WATCH USER
// ========================================

watch(
  user,
  async () => {
    await checkAdmin();
  },
  {
    immediate: true,
  },
);

// ========================================
// LOGOUT
// ========================================

const logout = async () => {
  closeMobileMenu();

  await supabase.auth.signOut();

  isAdmin.value = false;

  await navigateTo("/");
};
</script>

<style scoped>
.mobile-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #404e71;
  font-weight: 700;
  transition: all 0.2s ease;
}

.mobile-menu-item:hover {
  background-color: #f8fafc;
  color: #2cb6d5;
}

.mobile-menu-item:last-child {
  border-bottom: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
