<template>
  <footer class="mt-14 bg-[#0b1f3a] text-slate-200">
    <div class="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
      <div>
        <NuxtLink to="/" class="inline-flex items-center rounded-xl bg-white p-2.5">
          <img src="~/assets/images/logos/kc_logo.png" alt="Kialla Computers" class="h-14 w-auto" />
        </NuxtLink>
        <p class="mt-5 max-w-md text-sm leading-6 text-slate-300">Computers, parts, upgrades and practical local support without the hassle. Secure online ordering with Australian delivery options.</p>
      </div>
      <div>
        <h3 class="text-sm font-black uppercase tracking-[0.14em] text-white">Shop</h3>
        <div class="mt-4 grid gap-3 text-sm text-slate-300">
          <NuxtLink to="/#featured" class="hover:text-cyan-300">Featured Products</NuxtLink>
          <NuxtLink to="/#shop" class="hover:text-cyan-300">Browse Products</NuxtLink>
          <NuxtLink to="/shoppingcart" class="hover:text-cyan-300">Shopping Cart</NuxtLink>
        </div>
      </div>
      <div>
        <h3 class="text-sm font-black uppercase tracking-[0.14em] text-white">Customer</h3>
        <div class="mt-4 grid gap-3 text-sm text-slate-300">
          <NuxtLink to="/account" class="hover:text-cyan-300">My Account</NuxtLink>
          <NuxtLink to="/auth/signin" class="hover:text-cyan-300">Sign In</NuxtLink>
          <span>Prices shown in AUD and GST inclusive.</span>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10">
      <div class="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
        <p>© {{ year }} Kialla Computers. All rights reserved.</p>
        <p>Local service. Straightforward advice. Reliable technology.</p>
      </div>
    </div>
  </footer>
</template>
<script setup>const year = new Date().getFullYear();</script>
