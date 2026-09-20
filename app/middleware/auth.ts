export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();

  if (!user.value) {
    return navigateTo({
      path: "/auth/signin",
      query: {
        redirect: to.fullPath || "/account",
      },
    });
  }
});
