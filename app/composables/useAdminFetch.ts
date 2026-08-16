export function useAdminFetch() {
  const isAdmin = useState<boolean>("isAdmin", () => false);

  const adminChecked = useState<boolean>("adminChecked", () => false);

  const checkingAdmin = useState<boolean>("checkingAdmin", () => false);

  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  // ============================================================
  // CHECK ADMIN STATUS
  // ============================================================

  const checkAdmin = async () => {
    // Already checking
    if (checkingAdmin.value) {
      return isAdmin.value;
    }

    checkingAdmin.value = true;

    try {
      console.log("=================================");
      console.log("CHECKING ADMIN STATUS...");
      console.log("=================================");

      // ========================================================
      // WAIT FOR SUPABASE SESSION
      // ========================================================

      let attempts = 0;

      while (!user.value && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        attempts++;
      }

      console.log("SUPABASE USER:", user.value?.email || "NONE");

      // ========================================================
      // NO USER
      // ========================================================

      if (!user.value) {
        console.log("❌ NO SUPABASE USER");

        isAdmin.value = false;

        // IMPORTANT:
        // Don't permanently mark the admin check as complete
        // when the Supabase session has not loaded yet.
        adminChecked.value = false;

        return false;
      }

      // ========================================================
      // CHECK ADMIN ON SERVER
      // ========================================================

      console.log("ADMIN CHECK: Checking", user.value.email);

      const result = await $fetch<{
        authenticated: boolean;
        isAdmin: boolean;
        user?: {
          id: string;
          email: string;
        } | null;
      }>("/api/admin/check", {
        method: "GET",
        credentials: "include",
      });

      console.log("ADMIN CHECK RESULT:", result);

      // ========================================================
      // UPDATE STATE
      // ========================================================

      if (result.authenticated === true && result.isAdmin === true) {
        isAdmin.value = true;
      } else {
        isAdmin.value = false;
      }

      adminChecked.value = true;

      console.log("IS ADMIN:", isAdmin.value);

      return isAdmin.value;
    } catch (error: any) {
      console.error("ADMIN CHECK ERROR:", error);

      isAdmin.value = false;

      /*
       * Do NOT permanently mark this as checked after
       * an authentication/session error.
       *
       * This allows another attempt once the session
       * is available.
       */
      adminChecked.value = false;

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

      // ========================================================
      // UNAUTHENTICATED
      // ========================================================

      if (error?.statusCode === 401) {
        isAdmin.value = false;
        adminChecked.value = false;
      }

      // ========================================================
      // NOT ADMIN
      // ========================================================

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
