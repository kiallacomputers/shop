<template>
  <footer class="mt-16 border-t border-cyan-400/70 bg-[#061a33] text-slate-200">
    <!-- Main footer -->
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid gap-10 lg:grid-cols-[1.45fr_0.8fr_0.9fr_0.95fr]">
        <!-- Brand -->
        <div class="flex gap-5">
          <NuxtLink
            to="/"
            class="shrink-0 self-start"
            aria-label="Kialla Computers home"
          >
            <img
              src="/kc-footer-logo.png"
              alt="Kialla Computers KC"
              class="h-28 w-28 rounded-2xl object-cover shadow-[0_0_28px_rgba(34,211,238,0.18)] sm:h-32 sm:w-32"
            />
          </NuxtLink>

          <div class="pt-1">
            <h2 class="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Kialla Computers
            </h2>

            <p class="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-300 sm:text-sm">
              Sales <span class="mx-1 text-cyan-400">•</span>
              Service <span class="mx-1 text-cyan-400">•</span>
              Support
            </p>

            <div class="mt-5 h-px w-full max-w-sm bg-cyan-400/80"></div>

            <p class="mt-5 max-w-sm text-sm leading-6 text-slate-300">
              Local computer sales, parts &amp; support without the hassle.
            </p>
          </div>
        </div>

        <!-- Quick links -->
        <div>
          <h3 class="text-base font-black text-white">Quick Links</h3>
          <nav class="mt-4 grid gap-3 text-sm text-slate-300">
            <NuxtLink to="/" class="footer-link">Home</NuxtLink>
            <NuxtLink to="/#shop" class="footer-link">Shop</NuxtLink>
            <NuxtLink to="/#featured" class="footer-link">Featured</NuxtLink>
            <NuxtLink to="/account" class="footer-link">My Account</NuxtLink>
            <NuxtLink to="/shoppingcart" class="footer-link">Shopping Cart</NuxtLink>
          </nav>
        </div>

        <!-- Customer service -->
        <div>
          <h3 class="text-base font-black text-white">Customer Service</h3>
          <div class="mt-4 grid gap-4 text-sm text-slate-300">
            <div class="flex items-start gap-3">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 7h11v9H3zM14 10h3l4 4v2h-7M7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              <div>
                <p class="font-bold text-white">Australia-wide delivery</p>
                <p class="mt-0.5 text-xs text-slate-400">Freight calculated at checkout.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3l7 3v5c0 4.5-2.9 8.1-7 10-4.1-1.9-7-5.5-7-10V6l7-3z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4"/>
              </svg>
              <div>
                <p class="font-bold text-white">Secure checkout</p>
                <p class="mt-0.5 text-xs text-slate-400">Payments processed securely.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h8M8 14h5M5 4h14a2 2 0 012 2v10a2 2 0 01-2 2h-7l-4 3v-3H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
              </svg>
              <div>
                <p class="font-bold text-white">Local support</p>
                <p class="mt-0.5 text-xs text-slate-400">Friendly, practical help when you need it.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Business -->
        <div>
          <h3 class="text-base font-black text-white">Kialla Computers</h3>

          <div class="mt-4 space-y-4 text-sm text-slate-300">
            <div class="flex items-center gap-3">
              <svg class="h-5 w-5 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2"/>
              </svg>
              <span>Kialla, Victoria, Australia</span>
            </div>

            <div class="rounded-xl border border-cyan-400/20 bg-white/[0.04] p-4">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Australian owned &amp; operated
              </p>
              <p class="mt-2 text-xs leading-5 text-slate-400">
                Local service, straightforward advice and reliable technology.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment / trust strip -->
    <div class="border-y border-cyan-400/25 bg-[#071d38]">
      <div class="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <img
            src="/kc-footer-logo.png"
            alt=""
            aria-hidden="true"
            class="h-12 w-12 rounded-xl object-cover"
          />

          <div class="mr-2">
            <p class="text-sm font-black text-white">Secure Payments</p>
            <p class="text-xs text-slate-400">Powered by Stripe</p>
          </div>

          <span class="payment-badge text-blue-700">VISA</span>
          <span class="payment-badge text-slate-900">Mastercard</span>
          <span class="payment-badge text-blue-600">AMEX</span>
          <span class="payment-badge text-slate-900">Apple Pay</span>
          <span class="payment-badge text-slate-700">G Pay</span>
        </div>

        <div class="flex items-center gap-3 text-sm font-bold text-white">
          <span class="text-2xl" aria-hidden="true">🇦🇺</span>
          <span>Australian owned &amp; operated</span>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="bg-[#05162b]">
      <div class="max-w-7xl mx-auto px-4 py-5 text-center text-xs text-slate-400">
        © {{ year }} Kialla Computers. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear();
</script>

<style scoped>
.footer-link {
  transition: color 150ms ease, transform 150ms ease;
}

.footer-link:hover {
  color: rgb(103 232 249);
  transform: translateX(2px);
}

.payment-badge {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: white;
  padding: 0.55rem 0.8rem;
  font-size: 0.72rem;
  font-weight: 900;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
}
</style>
