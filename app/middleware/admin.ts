export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser();

  /*
   * User must be logged in.
   */
  if (!user.value) {
    return navigateTo("/signin");
  }

  try {
    const result = await $fetch<{
      authenticated: boolean;
      isAdmin: boolean;
      user?: {
        id: string;
        email?: string;
      };
    }>("/api/admin/check");

    console.log("ADMIN MIDDLEWARE:", result);

    if (!result.isAdmin) {
      return navigateTo("/");
    }
  } catch (error) {
    console.error("ADMIN MIDDLEWARE ERROR:", error);

    return navigateTo("/");
  }
});
