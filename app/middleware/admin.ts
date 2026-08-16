export default defineNuxtRouteMiddleware(async () => {
  // ============================================================
  // IMPORTANT
  // ============================================================
  // Do not perform the Supabase admin check during SSR.
  //
  // The browser session/access token is available once the
  // application has hydrated on the client.
  // ============================================================

  if (import.meta.server) {
    return;
  }

  const { checkAdmin, isAdmin, adminChecked } = useAdminFetch();

  // ============================================================
  // CHECK ADMIN
  // ============================================================

  if (!adminChecked.value) {
    const result = await checkAdmin();

    if (!result) {
      return navigateTo("/");
    }
  }

  // ============================================================
  // ADMIN CHECKED
  // ============================================================

  if (!isAdmin.value) {
    return navigateTo("/");
  }
});
