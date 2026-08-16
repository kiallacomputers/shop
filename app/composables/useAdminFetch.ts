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
      console.log("=================================");

      // ============================================================
      // WAIT FOR SUPABASE SESSION
      // ============================================================

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("SUPABASE SESSION:", session?.user?.email || "NONE");

      if (!session) {
        console.log("❌ NO SUPABASE SESSION");

        isAdmin.value = false;
        adminChecked.value = true;

        return false;
      }

      // ============================================================
      // CHECK ADMIN
      // ============================================================

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

      isAdmin.value = result.isAdmin === true;
      adminChecked.value = true;

      console.log("IS ADMIN:", isAdmin.value);

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
    console.log("=================================");
    console.log("ADMIN FETCH:", url);

    try {
      const result = await $fetch<T>(url, {
        ...options,
        credentials: "include",
      });

      console.log("ADMIN FETCH SUCCESS:", url);
      console.log("=================================");

      return result;
    } catch (error: any) {
      console.error("=================================");
      console.error("ADMIN FETCH ERROR:", url);
      console.error(error);
      console.error("=================================");

      if (error?.statusCode === 401) {
        isAdmin.value = false;
        adminChecked.value = true;
      }

      if (error?.statusCode === 403) {
        isAdmin.value = false;
        adminChecked.value = true;
      }

      throw error;
    }
  };

  // ============================================================
  // RETURN
  // ============================================================

  return {
    adminFetch,
    checkAdmin,
    isAdmin,
    adminChecked,
    checkingAdmin,
  };
}
