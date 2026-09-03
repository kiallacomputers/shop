<template>
  <div>
    <div class="bg-[#0b1f3a] text-slate-200">
      <div class="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 text-xs sm:text-sm">
        <p class="font-semibold">Local computer sales, parts & support</p>
        <p class="hidden sm:block text-slate-400">Australian owned & operated</p>
      </div>
    </div>

    <header class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div class="max-w-7xl mx-auto px-4 h-[102px] flex items-center gap-5">
        <NuxtLink to="/" class="flex items-center shrink-0" aria-label="Kialla Computers home">
          <img src="/kialla-computers-logo.png" alt="Kialla Computers" class="h-[88px] w-[210px] object-contain object-left sm:w-[230px]" />
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1 ml-5">
          <NuxtLink to="/" class="desktop-nav">Home</NuxtLink>
          <NuxtLink to="/#shop" class="desktop-nav">Shop</NuxtLink>
          <NuxtLink to="/#featured" class="desktop-nav">Featured</NuxtLink>
        </nav>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <div v-if="user" class="hidden lg:block text-right mr-2">
            <p class="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Signed in as</p>
            <p class="text-sm font-bold text-[#0b1f3a]">{{ firstName }}</p>
          </div>

          <NuxtLink v-if="!user" to="/auth/signin" class="hidden md:inline-flex kc-btn-secondary !py-2.5 !px-4">Sign in</NuxtLink>
          <NuxtLink v-if="user" to="/account" class="hidden md:inline-flex kc-btn-secondary !py-2.5 !px-4">My Account</NuxtLink>
          <NuxtLink v-if="user && isAdmin" to="/admin" class="hidden md:inline-flex rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#132b4f] transition">Admin</NuxtLink>

          <NuxtLink to="/shoppingcart" class="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0b1f3a] hover:border-cyan-300 hover:text-cyan-600 transition" aria-label="Shopping cart">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 3h1.386c.51 0 .955.343 1.087.835L5.61 6.75m0 0h14.64c.66 0 1.155.604.996 1.245l-1.5 6A1.125 1.125 0 0118.65 14.85H8.13a1.125 1.125 0 01-1.087-.835L5.61 6.75zm2.52 11.1a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0zm9 0a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0z" /></svg>
            <span v-if="cart.count > 0" class="absolute -top-2 -right-2 bg-cyan-500 text-white text-[11px] font-black rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">{{ cart.count }}</span>
          </NuxtLink>

          <button v-if="user" type="button" @click="logout" class="hidden md:flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition" title="Sign Out" aria-label="Sign Out">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
          </button>

          <button type="button" class="md:hidden flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-[#0b1f3a]" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0 -translate-y-2">
        <div v-if="mobileMenuOpen" class="md:hidden border-t border-slate-200 bg-white shadow-xl">
          <nav class="max-w-7xl mx-auto px-4 py-3 grid gap-1">
            <NuxtLink to="/" class="mobile-menu-item" @click="closeMobileMenu">Home</NuxtLink>
            <NuxtLink to="/#shop" class="mobile-menu-item" @click="closeMobileMenu">Shop</NuxtLink>
            <NuxtLink to="/#featured" class="mobile-menu-item" @click="closeMobileMenu">Featured</NuxtLink>
            <NuxtLink v-if="!user" to="/auth/signin" class="mobile-menu-item" @click="closeMobileMenu">Signup / Login</NuxtLink>
            <NuxtLink v-if="user" to="/account" class="mobile-menu-item" @click="closeMobileMenu">My Account</NuxtLink>
            <NuxtLink v-if="user && isAdmin" to="/admin" class="mobile-menu-item" @click="closeMobileMenu">Admin</NuxtLink>
            <button v-if="user" type="button" class="mobile-menu-item text-left text-red-600" @click="logout">Sign Out</button>
          </nav>
        </div>
      </Transition>
    </header>

    <Transition name="toast">
      <div v-if="cart.notification" class="fixed top-28 right-5 z-[9999] rounded-xl bg-emerald-600 px-5 py-4 text-white shadow-xl flex items-center gap-3">
        <span class="text-xl">✓</span><span class="font-semibold">{{ cart.notification }}</span>
      </div>
    </Transition>
  </div>
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
      console.log("ADMIN CHECK: No session");
      return;
    }

    console.log("ADMIN CHECK: Checking", user.value.email);

    const result = await $fetch("/api/admin/check", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log("ADMIN CHECK RESULT:", result);

    isAdmin.value = result.isAdmin === true;

    if (isAdmin.value) {
      console.log("ADMIN USER:", user.value.email);
    } else {
      console.log("USER IS NOT ADMIN");
    }
  } catch (error) {
    isAdmin.value = false;

    console.error("ADMIN CHECK FAILED:", error);
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
// ALSO CHECK AUTH STATE CHANGES
// ========================================

supabase.auth.onAuthStateChange(async () => {
  await checkAdmin();
});

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
.desktop-nav { padding:.7rem .85rem; border-radius:.65rem; color:#334155; font-weight:800; font-size:.9rem; transition:.18s ease; }
.desktop-nav:hover { color:#2367d1; background:#f1f5f9; }
.mobile-menu-item { display:flex; align-items:center; width:100%; padding:.85rem 1rem; border-radius:.7rem; color:#0b1f3a; font-weight:800; transition:.18s ease; }
.mobile-menu-item:hover { background:#f1f5f9; color:#2367d1; }
</style>
