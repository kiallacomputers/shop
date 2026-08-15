<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-20">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center flex-shrink-0">
          <img
            src="/assests/images/logos/kc_logo.png"
            alt="Kialla Computers"
            class="h-14 w-auto"
          />
        </NuxtLink>

        <!-- Desktop Navigation + Cart -->
        <div class="hidden md:flex items-center ml-auto">
          <!-- Navigation -->
          <nav class="flex items-center gap-8 mr-8">
            <NuxtLink
              to="/"
              class="text-gray-700 hover:text-sky-600 font-medium transition"
            >
              Home
            </NuxtLink>

            <!-- <NuxtLink
              to="/contact"
              class="text-gray-700 hover:text-sky-600 font-medium transition"
            >
              Contact
            </NuxtLink> -->

            <!-- Account -->
            <NuxtLink
              v-if="user"
              to="/account"
              class="text-gray-700 hover:text-sky-600 font-medium transition"
            >
              Account
            </NuxtLink>

            <NuxtLink
              v-else
              to="/signin"
              class="text-gray-700 hover:text-sky-600 font-medium transition"
            >
              Sign In
            </NuxtLink>

            <!-- Admin -->
            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="text-red-600 hover:text-red-700 font-semibold transition"
            >
              Admin
            </NuxtLink>
          </nav>

          <!-- Shopping Cart -->
          <NuxtLink
            to="/cart"
            class="relative flex items-center justify-center text-gray-700 hover:text-sky-600 transition"
            aria-label="Shopping Cart"
          >
            <!-- Cart Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-7 h-7"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437m0 0
                   L6.75 15.75A2.25 2.25 0 0 0 8.93 17.5h8.14a2.25
                   2.25 0 0 0 2.18-1.75l1.44-5.75H5.106m0 0L4.5
                   6.75h15.75M9 20.25h.008v.008H9v-.008Zm7.5
                   0h.008v.008h-.008v-.008Z"
              />
            </svg>

            <!-- Cart Count -->
            <span
              v-if="cart.count > 0"
              class="absolute -top-2 -right-2 bg-sky-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center"
            >
              {{ cart.count }}
            </span>
          </NuxtLink>
        </div>

        <!-- Mobile Controls -->
        <div class="md:hidden flex items-center gap-4">
          <!-- Mobile Cart -->
          <NuxtLink
            to="/cart"
            class="relative text-gray-700 hover:text-sky-600 transition"
            aria-label="Shopping Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-7 h-7"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437m0 0
                   L6.75 15.75A2.25 2.25 0 0 0 8.93 17.5h8.14a2.25
                   2.25 0 0 0 2.18-1.75l1.44-5.75H5.106m0 0L4.5
                   6.75h15.75M9 20.25h.008v.008H9v-.008Zm7.5
                   0h.008v.008h-.008v-.008Z"
              />
            </svg>

            <span
              v-if="cart.count > 0"
              class="absolute -top-2 -right-2 bg-sky-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center"
            >
              {{ cart.count }}
            </span>
          </NuxtLink>

          <!-- Mobile Menu Button -->
          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="text-gray-700 hover:text-sky-600 focus:outline-none"
            aria-label="Toggle menu"
          >
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
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>

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

      <!-- Mobile Navigation -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-gray-200 py-4"
      >
        <nav class="flex flex-col space-y-3">
          <NuxtLink
            to="/"
            @click="mobileMenuOpen = false"
            class="text-gray-700 hover:text-sky-600 font-medium py-2"
          >
            Home
          </NuxtLink>

          <!-- <NuxtLink
            to="/contact"
            @click="mobileMenuOpen = false"
            class="text-gray-700 hover:text-sky-600 font-medium py-2"
          >
            Contact
          </NuxtLink>
 -->
          <NuxtLink
            v-if="user"
            to="/account"
            @click="mobileMenuOpen = false"
            class="text-gray-700 hover:text-sky-600 font-medium py-2"
          >
            Account
          </NuxtLink>

          <NuxtLink
            v-else
            to="/signin"
            @click="mobileMenuOpen = false"
            class="text-gray-700 hover:text-sky-600 font-medium py-2"
          >
            Sign In
          </NuxtLink>

          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            @click="mobileMenuOpen = false"
            class="text-red-600 hover:text-red-700 font-semibold py-2"
          >
            Admin
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useSupabaseUser } from "#imports";
import { useCartStore } from "~/stores/cart";

const user = useSupabaseUser();
const cart = useCartStore();

const mobileMenuOpen = ref(false);

const isAdmin = ref(false);
const checkingAdmin = ref(false);

const checkAdmin = async () => {
  if (!user.value) {
    isAdmin.value = false;
    return;
  }

  checkingAdmin.value = true;

  try {
    const result = await $fetch("/api/admin/check");

    isAdmin.value = result?.isAdmin === true;
  } catch (error) {
    console.error("ADMIN CHECK ERROR:", error);
    isAdmin.value = false;
  } finally {
    checkingAdmin.value = false;
  }
};

watch(
  () => user.value,
  async (newUser) => {
    if (newUser) {
      await checkAdmin();
    } else {
      isAdmin.value = false;
    }
  },
  {
    immediate: true,
  },
);
</script>
