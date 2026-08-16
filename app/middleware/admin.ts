export default defineNuxtRouteMiddleware(async () => {
  // ============================================================
  // SERVER
  // ============================================================
  //
  // Do not perform the admin API check during SSR.
  // The client-side Supabase session will be checked after
  // hydration.
  //
  // ============================================================

  if (import.meta.server) {
    return;
  }

  // ============================================================
  // ADMIN COMPOSABLE
  // ============================================================

  const { checkAdmin, isAdmin, adminChecked, checkingAdmin } = useAdminFetch();

  // ============================================================
  // CHECK ADMIN STATUS
  // ============================================================

  if (!adminChecked.value && !checkingAdmin.value) {
    const result = await checkAdmin();

    if (!result) {
      return navigateTo("/");
    }
  }

  // ============================================================
  // ADMIN CHECK FAILED
  // ============================================================

  if (adminChecked.value && !isAdmin.value) {
    return navigateTo("/");
  }
});
