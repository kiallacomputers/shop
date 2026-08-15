export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser();

  if (!user.value) {
    return navigateTo({
      path: "/auth/signin",
      query: {
        redirect: "/shoppingcart",
      },
    });
  }
});
