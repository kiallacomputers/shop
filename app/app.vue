<template>
  <NuxtLayout>
    <Transition name="toast">
      <div
        v-if="cart.notification"
        class="fixed top-20 right-5 z-[9999] bg-green-600 text-white px-5 py-4 rounded-lg shadow-lg flex items-center gap-3"
      >
        <span class="text-xl">✓</span>

        <span>{{ cart.notification }}</span>
      </div>
    </Transition>
    <NuxtPage />
  </NuxtLayout>
</template>
<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
