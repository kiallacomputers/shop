<template>
  <div class="min-h-screen bg-[#f5f8fc] grid lg:grid-cols-[.9fr_1.1fr]">
    <aside class="hidden lg:flex flex-col justify-between bg-[#0b1f3a] p-12 text-white relative overflow-hidden">
      <div class="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_15%,rgba(39,182,214,.55),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(35,103,209,.5),transparent_35%)]"></div>
      <div class="relative">
        <NuxtLink to="/" class="inline-flex rounded-2xl bg-white p-3"><img class="h-16 w-auto" src="~/assets/images/logos/kc_logo.png" alt="Kialla Computers" /></NuxtLink>
        <h1 class="mt-10 text-4xl font-black tracking-tight">Your account, orders and delivery details in one place.</h1>
        <p class="mt-5 max-w-md text-slate-300 leading-7">Secure access to your Kialla Computers account, saved addresses and order history.</p>
      </div>
      <p class="relative text-sm text-slate-400">Kialla Computers · Local service · Reliable technology</p>
    </aside>
    <main class="flex min-h-screen items-center justify-center p-5 sm:p-10">
      <div class="w-full max-w-lg">
        <NuxtLink to="/" class="mb-8 flex justify-center lg:hidden"><img class="h-20 w-auto" src="~/assets/images/logos/kc_logo.png" alt="Kialla Computers" /></NuxtLink>
        <slot />
      </div>
    </main>
  </div>
</template>
