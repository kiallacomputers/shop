export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  // ----------------------------------------
  // CHECK LOGIN
  // ----------------------------------------

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return navigateTo("/auth/signin");
  }

  // ----------------------------------------
  // CHECK ADMIN
  // ----------------------------------------

  try {
    await $fetch("/api/admin/check", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch (error: any) {
    console.error("ADMIN CHECK FAILED:", error);

    return navigateTo("/");
  }
});
