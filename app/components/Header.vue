<template>
  <div>
    <div class="bg-[#0b1f3a] text-slate-200">
      <div class="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 text-xs sm:text-sm">
        <p class="font-semibold">Local computer sales, parts & support</p>
        <p class="hidden sm:block text-slate-400">Australian owned & operated</p>
      </div>
    </div>

    <header class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div class="max-w-7xl mx-auto px-3 sm:px-4 h-[72px] sm:h-[88px] flex items-center gap-3 sm:gap-5">
        <NuxtLink to="/" class="flex items-center shrink-0" aria-label="Kialla Computers home">
          <img src="/kialla-computers-logo.png" alt="Kialla Computers" class="h-[58px] w-[150px] object-contain object-left sm:h-[74px] sm:w-[215px]" />
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1 ml-5">
          <NuxtLink to="/" class="desktop-nav">Home</NuxtLink>
          <NuxtLink to="/#categories" class="desktop-nav">Categories</NuxtLink>
          <NuxtLink to="/#shop" class="desktop-nav">Shop</NuxtLink>
          <NuxtLink to="/#featured" class="desktop-nav">Featured</NuxtLink>
          <NuxtLink to="/search" class="desktop-nav xl:hidden">Search</NuxtLink>
        </nav>

        <div class="relative ml-auto hidden xl:block w-[280px] 2xl:w-[340px]">
          <form @submit.prevent="submitSearch" class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
            <input
              v-model="searchText"
              type="search"
              autocomplete="off"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              placeholder="Search products or codes..."
              aria-label="Search products"
              @focus="searchOpen = true"
              @blur="closeSearchSoon"
              @keydown.escape="searchOpen = false"
            />
          </form>

          <div v-if="searchOpen && searchText.trim().length >= 2" class="absolute left-0 right-0 top-[calc(100%+.5rem)] z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div v-if="searchLoading" class="px-4 py-4 text-sm font-semibold text-slate-500">Searching…</div>
            <template v-else-if="searchSuggestions.length">
              <NuxtLink
                v-for="item in searchSuggestions"
                :key="item.id"
                :to="`/product/${item.slug}`"
                class="flex items-center gap-3 border-b border-slate-100 px-3 py-3 transition last:border-b-0 hover:bg-slate-50"
                @mousedown.prevent
                @click="searchOpen = false"
              >
                <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img v-if="firstImage(item)" :src="firstImage(item)" :alt="item.name" class="h-full w-full object-contain p-1" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black text-[#0b1f3a]">{{ item.name }}</p>
                  <p class="truncate text-xs font-semibold text-slate-400">{{ item.product_code || item.categories?.name || 'Product' }}</p>
                </div>
                <p class="shrink-0 text-sm font-black text-[#0b1f3a]">${{ suggestionPrice(item).toFixed(2) }}</p>
              </NuxtLink>
              <button type="button" class="flex w-full items-center justify-center bg-slate-50 px-4 py-3 text-sm font-black text-blue-600 hover:bg-blue-50" @mousedown.prevent @click="submitSearch">View all results</button>
            </template>
            <div v-else class="px-4 py-4 text-sm font-semibold text-slate-500">No products found. Press Enter for full search.</div>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <NuxtLink v-if="!user" to="/auth/signin" class="hidden md:inline-flex kc-btn-secondary !py-2.5 !px-4">Sign in</NuxtLink>

          <NuxtLink to="/shoppingcart" class="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0b1f3a] hover:border-cyan-300 hover:text-cyan-600 transition" aria-label="Shopping cart">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 3h1.386c.51 0 .955.343 1.087.835L5.61 6.75m0 0h14.64c.66 0 1.155.604.996 1.245l-1.5 6A1.125 1.125 0 0118.65 14.85H8.13a1.125 1.125 0 01-1.087-.835L5.61 6.75zm2.52 11.1a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0zm9 0a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0z" /></svg>
            <span v-if="cart.count > 0" class="absolute -top-2 -right-2 bg-cyan-500 text-white text-[11px] font-black rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">{{ cart.count }}</span>
          </NuxtLink>

          <div v-if="user" ref="desktopAccountMenuRef" class="relative hidden md:block">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0b1f3a] transition hover:border-cyan-300 hover:bg-slate-50 hover:text-cyan-600"
              :aria-expanded="desktopAccountMenuOpen"
              aria-label="Open account menu"
              title="Account menu"
              @click="desktopAccountMenuOpen = !desktopAccountMenuOpen"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Transition enter-active-class="transition duration-150" enter-from-class="opacity-0 translate-y-1 scale-95" leave-active-class="transition duration-100" leave-to-class="opacity-0 translate-y-1 scale-95">
              <div
                v-if="desktopAccountMenuOpen"
                class="absolute right-0 top-[calc(100%+.65rem)] z-[90] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              >
                <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p class="text-[11px] font-black uppercase tracking-wide text-slate-400">Signed in as</p>
                  <p class="mt-0.5 truncate font-extrabold text-[#0b1f3a]">{{ firstName || user.email }}</p>
                  <p v-if="firstName && user.email" class="mt-0.5 truncate text-xs font-semibold text-slate-400">{{ user.email }}</p>
                </div>

                <div class="p-2">
                  <NuxtLink to="/account" class="desktop-account-item" @click="closeDesktopAccountMenu">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" /></svg>
                    <span>My Account</span>
                  </NuxtLink>

                  <NuxtLink v-if="isAdmin" to="/admin" class="desktop-account-item" @click="closeDesktopAccountMenu">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Admin</span>
                  </NuxtLink>

                  <button type="button" class="desktop-account-item w-full text-red-600 hover:!bg-red-50 hover:!text-red-700" @click="logout">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <button type="button" class="md:hidden flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-slate-200 text-[#0b1f3a]" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0 -translate-y-2">
        <div v-if="mobileMenuOpen" class="md:hidden border-t border-slate-200 bg-white shadow-xl max-h-[calc(100vh-104px)] overflow-y-auto">
          <nav class="max-w-7xl mx-auto px-3 py-3 grid gap-1">
            <form class="relative mb-2" @submit.prevent="submitMobileSearch">
              <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
              <input v-model="mobileSearchText" type="search" autocomplete="off" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-cyan-300 focus:bg-white" placeholder="Search products or codes..." aria-label="Search products" />
            </form>
            <div v-if="mobileSearchText.trim().length >= 2" class="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div v-if="searchLoading" class="px-3 py-3 text-sm font-semibold text-slate-500">Searching…</div>
              <template v-else-if="searchSuggestions.length">
                <NuxtLink v-for="item in searchSuggestions" :key="`mobile-search-${item.id}`" :to="`/product/${item.slug}`" class="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0" @click="closeMobileMenu">
                  <div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img v-if="firstImage(item)" :src="firstImage(item)" :alt="item.name" class="h-full w-full object-contain p-1" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-black text-[#0b1f3a]">{{ item.name }}</p>
                    <p class="truncate text-xs font-semibold text-slate-400">{{ item.product_code || item.categories?.name || 'Product' }}</p>
                  </div>
                  <p class="shrink-0 text-xs font-black text-[#0b1f3a]">${{ suggestionPrice(item).toFixed(2) }}</p>
                </NuxtLink>
                <button type="button" class="w-full bg-slate-50 px-3 py-2.5 text-sm font-black text-blue-600" @click="submitMobileSearch">View all results</button>
              </template>
              <p v-else class="px-3 py-3 text-sm font-semibold text-slate-500">No products found.</p>
            </div>
            <div v-if="user" class="mb-2 rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-slate-400">Signed in as</p>
              <p class="mt-0.5 font-extrabold text-[#0b1f3a]">{{ firstName || user.email }}</p>
            </div>
            <NuxtLink to="/" class="mobile-menu-item" @click="closeMobileMenu">Home</NuxtLink>
            <NuxtLink to="/#categories" class="mobile-menu-item" @click="closeMobileMenu">Categories</NuxtLink>
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
      <div v-if="cart.notification" class="fixed left-3 right-3 top-24 sm:left-auto sm:right-5 sm:top-28 z-[9999] rounded-xl bg-emerald-600 px-5 py-4 text-white shadow-xl flex items-center gap-3">
        <span class="text-xl">✓</span><span class="font-semibold">{{ cart.notification }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const user = useSupabaseUser();

const supabase = useSupabaseClient();

const cart = useCartStore();
const { applyToProducts } = useCustomerPricing();

// ========================================
// PRODUCT SEARCH
// ========================================
const searchText = ref("");
const mobileSearchText = ref("");
const searchOpen = ref(false);
const searchLoading = ref(false);
const searchSuggestions = ref([]);
let searchTimer;
let searchController;

const firstImage = (product) => {
  const value = product?.images;
  if (Array.isArray(value)) return value.find(Boolean) || "";
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.find(Boolean) || "" : ""; } catch { return ""; }
  }
  return "";
};

const suggestionPrice = (product) => {
  const variants = Array.isArray(product?.product_variants) ? product.product_variants.filter((variant) => variant?.active !== false) : [];
  const base = Number(product?.customer_price ?? product?.price ?? 0);
  if (!product?.has_variants || !variants.length) return base;
  const prices = variants.map((variant) => Number(variant.customer_price ?? variant.price ?? base)).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : base;
};

const loadSearchSuggestions = async (value) => {
  const query = value.trim();
  if (query.length < 2) {
    searchSuggestions.value = [];
    searchLoading.value = false;
    return;
  }
  searchController?.abort();
  searchController = new AbortController();
  const controller = searchController;
  searchLoading.value = true;
  try {
    const rows = await $fetch("/api/products/search", {
      query: { q: query, limit: 5 },
      signal: controller.signal,
    });
    if (controller !== searchController) return;
    searchSuggestions.value = Array.isArray(rows) ? rows : [];
    if (import.meta.client && searchSuggestions.value.length) await applyToProducts(searchSuggestions.value);
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error("PRODUCT SEARCH FAILED:", error);
    searchSuggestions.value = [];
  } finally {
    if (controller === searchController) searchLoading.value = false;
  }
};

watch(searchText, (value) => {
  searchOpen.value = value.trim().length >= 2;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadSearchSuggestions(value), 220);
});

watch(mobileSearchText, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadSearchSuggestions(value), 220);
});

const submitSearch = async () => {
  const query = searchText.value.trim();
  if (query.length < 2) return;
  searchOpen.value = false;
  await navigateTo({ path: "/search", query: { q: query } });
};

const submitMobileSearch = async () => {
  const query = mobileSearchText.value.trim();
  if (query.length < 2) return;
  closeMobileMenu();
  await navigateTo({ path: "/search", query: { q: query } });
};

const closeSearchSoon = () => {
  setTimeout(() => { searchOpen.value = false; }, 140);
};

// ========================================
// MOBILE MENU
// ========================================

const mobileMenuOpen = ref(false);
const desktopAccountMenuOpen = ref(false);
const desktopAccountMenuRef = ref(null);

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const closeDesktopAccountMenu = () => {
  desktopAccountMenuOpen.value = false;
};

const handleDesktopAccountOutsideClick = (event) => {
  if (!desktopAccountMenuOpen.value) return;
  const menu = desktopAccountMenuRef.value;
  if (menu && !menu.contains(event.target)) {
    closeDesktopAccountMenu();
  }
};

onMounted(() => {
  document.addEventListener("pointerdown", handleDesktopAccountOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDesktopAccountOutsideClick);
  clearTimeout(searchTimer);
  searchController?.abort();
});

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
  closeDesktopAccountMenu();

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
.desktop-account-item { display:flex; align-items:center; gap:.7rem; width:100%; padding:.75rem .85rem; border-radius:.75rem; color:#0b1f3a; font-weight:800; font-size:.9rem; transition:.16s ease; }
.desktop-account-item:hover { background:#f1f5f9; color:#2367d1; }
</style>
