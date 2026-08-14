<template>
  <aside class="w-64 bg-slate-900 text-white min-h-screen p-5">
    <h2 class="text-xl font-bold mb-8">Kialla Computers</h2>

    <nav class="space-y-2">
      <NuxtLink
        to="/admin"
        class="block px-4 py-3 rounded-lg hover:bg-slate-800"
      >
        📊 Dashboard
      </NuxtLink>

      <NuxtLink
        to="/admin/products"
        class="block px-4 py-3 rounded-lg hover:bg-slate-800"
      >
        📦 Products
      </NuxtLink>

      <NuxtLink
        to="/admin/orders"
        class="block px-4 py-3 rounded-lg hover:bg-slate-800"
      >
        🛒 Orders
      </NuxtLink>

      <NuxtLink
        to="/admin/categories"
        class="block px-4 py-3 rounded-lg hover:bg-slate-800"
      >
        📁 Categories
      </NuxtLink>
    </nav>

    <div class="border-t border-slate-700 mt-8 pt-5">
      <NuxtLink to="/" class="block px-4 py-3 rounded-lg hover:bg-slate-800">
        ← Back to Shop
      </NuxtLink>
    </div>
  </aside>
</template>
