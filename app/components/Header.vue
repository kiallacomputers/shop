<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4">
      <!-- ================================================= -->
      <!-- DESKTOP HEADER -->
      <!-- ================================================= -->

      <div class="h-20 flex items-center justify-between">
        <!-- LOGO -->
        <NuxtLink to="/" class="flex items-center shrink-0">
          <img src="/kc_logo.png" alt="Kialla Computers" class="h-14 w-auto" />
        </NuxtLink>

        <!-- ================================================= -->
        <!-- DESKTOP NAVIGATION -->
        <!-- ================================================= -->

        <nav class="hidden md:flex items-center gap-8 ml-auto">
          <NuxtLink
            to="/"
            class="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Home
          </NuxtLink>

          <NuxtLink
            to="/products"
            class="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Products
          </NuxtLink>

          <!-- ACCOUNT -->
          <NuxtLink
            v-if="user"
            to="/account"
            class="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Account
          </NuxtLink>

          <!-- ADMIN -->
          <NuxtLink
            v-if="user && isAdmin"
            to="/admin"
            class="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Admin
          </NuxtLink>

          <!-- LOGIN -->
          <NuxtLink
            v-if="!user"
            to="/login"
            class="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Sign In
          </NuxtLink>

          <!-- LOGOUT -->
          <button
            v-if="user"
            @click="logout"
            class="text-gray-700 hover:text-red-600 font-medium transition"
          >
            Sign Out
          </button>
        </nav>

        <!-- ================================================= -->
        <!-- RIGHT SIDE -->
        <!-- ================================================= -->

        <div class="flex items-center gap-4 ml-6">
          <!-- CART -->
          <NuxtLink
            to="/cart"
            class="relative flex items-center justify-center"
            aria-label="Shopping Cart"
          >
            <!-- Cart Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-7 h-7 text-gray-700 hover:text-blue-600 transition"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h10.125c.51 0 .96-.344 1.09-.836l1.38-5.52a1.125 1.125 0 0 0-1.09-1.394H5.106m2.394 7.75L5.106 6.75M7.5 14.25l-1.125 2.25a1.125 1.125 0 0 0 1.006 1.625h10.244M9 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>

            <!-- CART COUNT -->
            <span
              v-if="cart.count > 0"
              class="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center"
            >
              {{ cart.count }}
            </span>
          </NuxtLink>

          <!-- ================================================= -->
          <!-- MOBILE MENU BUTTON -->
          <!-- ================================================= -->

          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100"
            aria-label="Open Menu"
          >
            <!-- Hamburger -->
            <svg
              v-if="!mobileMenuOpen"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-7 h-7"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>

            <!-- Close -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-7 h-7"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- MOBILE MENU -->
      <!-- ================================================= -->

      <div
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-gray-200 py-4"
      >
        <nav class="flex flex-col gap-1">
          <NuxtLink
            to="/"
            @click="mobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Home
          </NuxtLink>

          <NuxtLink
            to="/products"
            @click="mobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Products
          </NuxtLink>

          <!-- ACCOUNT -->
          <NuxtLink
            v-if="user"
            to="/account"
            @click="mobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Account
          </NuxtLink>

          <!-- ADMIN -->
          <NuxtLink
            v-if="user && isAdmin"
            to="/admin"
            @click="mobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Admin
          </NuxtLink>

          <!-- LOGIN -->
          <NuxtLink
            v-if="!user"
            to="/login"
            @click="mobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Sign In
          </NuxtLink>

          <!-- LOGOUT -->
          <button
            v-if="user"
            @click="logout"
            class="text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// =====================================================
// SUPABASE
// =====================================================

const supabase = useSupabaseClient();

const user = useSupabaseUser();

// =====================================================
// CART
// =====================================================

const cart = useCartStore();

// =====================================================
// MOBILE MENU
// =====================================================

const mobileMenuOpen = ref(false);

// =====================================================
// ADMIN STATUS
// =====================================================

const isAdmin = ref(false);

const checkingAdmin = ref(false);

// =====================================================
// CHECK ADMIN
// =====================================================

async function checkAdmin() {
  // Always start as NOT admin
  isAdmin.value = false;

  if (!user.value) {
    return;
  }

  checkingAdmin.value = true;

  console.log("Checking admin status for:", user.value.email);

  try {
    const response = await $fetch<{
      isAdmin: boolean;
    }>("/api/admin/check");

    // Only true is allowed to display Admin
    isAdmin.value = response?.isAdmin === true;

    if (isAdmin.value) {
      console.log("ADMIN USER:", user.value.email);
    } else {
      console.log("USER IS NOT ADMIN");
    }
  } catch (error: any) {
    // A 403 means the user isn't an admin.
    // This is NOT a reason to show the Admin menu.

    isAdmin.value = false;

    if (error?.statusCode === 403) {
      console.log("USER IS NOT ADMIN");
    } else {
      console.error("ADMIN CHECK ERROR:", error);
    }
  } finally {
    checkingAdmin.value = false;
  }
}

// =====================================================
// WATCH LOGIN STATE
// =====================================================

watch(
  user,
  async (newUser) => {
    // Reset admin status immediately
    isAdmin.value = false;

    if (newUser) {
      await checkAdmin();
    }
  },
  {
    immediate: true,
  },
);

// =====================================================
// LOGOUT
// =====================================================

async function logout() {
  isAdmin.value = false;

  mobileMenuOpen.value = false;

  await supabase.auth.signOut();

  await navigateTo("/");
}
</script>
