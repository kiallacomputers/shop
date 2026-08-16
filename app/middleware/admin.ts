export default defineNuxtRouteMiddleware(async () => {
  // ============================================================
  // SERVER
  // ============================================================

  if (import.meta.server) {
    return;
  }

  // ============================================================
  // ADMIN
  // ============================================================

  const { checkAdmin, isAdmin, adminChecked, checkingAdmin } = useAdminFetch();

  // ============================================================
  // WAIT FOR EXISTING CHECK
  // ============================================================

  if (checkingAdmin.value) {
    let attempts = 0;

    while (checkingAdmin.value && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));

      attempts++;
    }
  }

  // ============================================================
  // CHECK ADMIN
  // ============================================================

  if (!adminChecked.value) {
    await checkAdmin();
  }

  // ============================================================
  // WAIT FOR CHECK TO FINISH
  // ============================================================

  if (checkingAdmin.value) {
    let attempts = 0;

    while (checkingAdmin.value && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));

      attempts++;
    }
  }

  // ============================================================
  // ADMIN VERIFIED
  // ============================================================

  if (isAdmin.value === true) {
    console.log("ADMIN MIDDLEWARE: Administrator verified");

    return;
  }

  // ============================================================
  // ACCESS DENIED
  // ============================================================

  console.log("ADMIN MIDDLEWARE: Access denied");

  return navigateTo("/");
});
