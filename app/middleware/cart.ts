export default defineNuxtRouteMiddleware(() => {
  const cart = useCartStore();

  if (!cart.items.length) {
    return navigateTo("/");
  }
});
