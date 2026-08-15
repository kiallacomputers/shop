export function useAdminFetch() {
  const isAdmin = useState<boolean>("isAdmin", () => false);
  const adminChecked = useState<boolean>("adminChecked", () => false);
  const checkingAdmin = useState<boolean>("checkingAdmin", () => false);

  // ============================================================
  // CHECK ADMIN STATUS
  // ============================================================

  const checkAdmin = async () => {
    if (checkingAdmin.value) {
      return isAdmin.value;
    }

    checkingAdmin.value = true;

    try {
      console.log("=================================");
      console.log("CHECKING ADMIN STATUS...");

      const result = await $fetch<{
        authenticated: boolean;
        isAdmin: boolean;
        user?: {
          id: string;
          email: string;
        };
      }>("/api/admin/check", {
        method: "GET",
        credentials: "include",
      });

      console.log("ADMIN CHECK RESULT:", result);

      isAdmin.value = !!result.isAdmin;
      adminChecked.value = true;

      console.log("IS ADMIN:", isAdmin.value);
      console.log("=================================");

      return isAdmin.value;
    } catch (error: any) {
      console.error("ADMIN CHECK ERROR:", error);

      isAdmin.value = false;
      adminChecked.value = true;

      return false;
    } finally {
      checkingAdmin.value = false;
    }
  };

  // ============================================================
  // ADMIN FETCH
  // ============================================================

  const adminFetch = async <T = any>(
    url: string,
    options: any = {},
  ): Promise<T> => {
    try {
      console.log("=================================");
      console.log("ADMIN FETCH:", url);

      const result = await $fetch<T>(url, {
        ...options,
        credentials: "include",
      });

      console.log("ADMIN FETCH SUCCESS:", url);
      console.log("=================================");

      return result;
    } catch (error: any) {
      console.error("ADMIN FETCH ERROR:", url);
      console.error(error);

      // If authentication has expired
      if (error?.statusCode === 401) {
        isAdmin.value = false;
        adminChecked.value = true;
      }

      // If user is authenticated but not an admin
      if (error?.statusCode === 403) {
        isAdmin.value = false;
        adminChecked.value = true;
      }

      throw error;
    }
  };

  return {
    isAdmin,
    adminChecked,
    checkingAdmin,
    checkAdmin,
    adminFetch,
  };
}
