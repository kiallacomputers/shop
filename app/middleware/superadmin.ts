export default defineNuxtRouteMiddleware(
  async () => {
    if (import.meta.server) {
      return;
    }

    const {
      checkAdmin,
      isSuperAdmin,
      adminChecked,
      checkingAdmin,
    } = useAdminFetch();

    if (checkingAdmin.value) {
      let attempts = 0;

      while (
        checkingAdmin.value &&
        attempts < 50
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 100),
        );

        attempts++;
      }
    }

    if (!adminChecked.value) {
      await checkAdmin();
    }

    if (isSuperAdmin.value) {
      return;
    }

    console.log(
      "SUPERADMIN MIDDLEWARE: Access denied",
    );

    return navigateTo("/admin");
  },
);
