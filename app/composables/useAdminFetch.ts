export function useAdminFetch() {
  const isAdmin =
    useState<boolean>(
      "isAdmin",
      () => false,
    );

  const isSuperAdmin =
    useState<boolean>(
      "isSuperAdmin",
      () => false,
    );

  const adminRole =
    useState<
      "superadmin" | "admin" | null
    >(
      "adminRole",
      () => null,
    );

  const adminChecked =
    useState<boolean>(
      "adminChecked",
      () => false,
    );

  const checkingAdmin =
    useState<boolean>(
      "checkingAdmin",
      () => false,
    );

  const user =
    useSupabaseUser();

  const clearAdminState = () => {
    isAdmin.value = false;
    isSuperAdmin.value = false;
    adminRole.value = null;
  };

  const checkAdmin = async () => {
    if (checkingAdmin.value) {
      return isAdmin.value;
    }

    checkingAdmin.value = true;

    try {
      let attempts = 0;

      while (
        !user.value &&
        attempts < 50
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 100),
        );

        attempts++;
      }

      if (!user.value) {
        clearAdminState();
        adminChecked.value = false;

        return false;
      }

      const result =
        await $fetch<{
          authenticated: boolean;
          isAdmin: boolean;
          isSuperAdmin: boolean;
          role:
            | "superadmin"
            | "admin"
            | null;
          user?: {
            id: string;
            email: string | null;
          } | null;
        }>("/api/admin/check", {
          method: "GET",
          credentials: "include",
        });

      isAdmin.value =
        result.authenticated === true &&
        result.isAdmin === true;

      isSuperAdmin.value =
        result.authenticated === true &&
        result.isSuperAdmin === true;

      adminRole.value =
        result.role || null;

      adminChecked.value = true;

      return isAdmin.value;
    } catch (error) {
      console.error(
        "ADMIN CHECK ERROR:",
        error,
      );

      clearAdminState();
      adminChecked.value = false;

      return false;
    } finally {
      checkingAdmin.value = false;
    }
  };

  const adminFetch = async <
    T = any,
  >(
    url: string,
    options: any = {},
  ): Promise<T> => {
    try {
      return await $fetch<T>(
        url,
        {
          ...options,
          credentials: "include",
        },
      );
    } catch (error: any) {
      if (
        error?.statusCode === 401
      ) {
        clearAdminState();
        adminChecked.value = false;
      }

      throw error;
    }
  };

  return {
    adminFetch,
    checkAdmin,
    isAdmin,
    isSuperAdmin,
    adminRole,
    adminChecked,
    checkingAdmin,
    clearAdminState,
  };
}
