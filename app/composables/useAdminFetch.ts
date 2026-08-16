export function useAdminFetch() {
  const supabase = useSupabaseClient();

  const isAdmin = useState<boolean>("admin-is-admin", () => false);
  const adminChecked = useState<boolean>("admin-checked", () => false);
  const checkingAdmin = useState<boolean>("admin-checking", () => false);

  // ============================================================
  // GET SUPABASE ACCESS TOKEN
  // ============================================================

  const getAccessToken = async (): Promise<string | null> => {
    try {
      console.log("GETTING SUPABASE SESSION...");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ SUPABASE SESSION ERROR:", error);
        return null;
      }

      if (!session) {
        console.log("❌ NO SUPABASE SESSION");
        return null;
      }

      if (!session.access_token) {
        console.log("❌ SESSION HAS NO ACCESS TOKEN");
        return null;
      }

      console.log("✅ SUPABASE ACCESS TOKEN FOUND");

      return session.access_token;
    } catch (error) {
      console.error("❌ GET SESSION ERROR:", error);
      return null;
    }
  };

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

      const token = await getAccessToken();

      if (!token) {
        console.log("❌ NO ACCESS TOKEN");

        isAdmin.value = false;
        adminChecked.value = true;

        return false;
      }

      const result = await $fetch<{
        authenticated: boolean;
        isAdmin: boolean;
        user?: {
          id: string;
          email: string;
        };
      }>("/api/admin/check", {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ADMIN CHECK RESULT:", result);

      isAdmin.value = result.isAdmin === true;
      adminChecked.value = true;

      console.log("IS ADMIN:", isAdmin.value);
      console.log("=================================");

      return isAdmin.value;
    } catch (error: any) {
      console.error("❌ ADMIN CHECK ERROR:", error);

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

    const token = await getAccessToken();

    if (!token) {
      console.error("❌ ADMIN FETCH: NO ACCESS TOKEN");

      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    // ==========================================================
    // HEADERS
    // ==========================================================

    const headers = new Headers(options.headers || {});

    headers.set("Authorization", `Bearer ${token}`);

    // ==========================================================
    // REQUEST
    // ==========================================================

    try {
      const result = await $fetch<T>(url, {
        ...options,
        headers,
        credentials: "include",
      });

      console.log("✅ ADMIN FETCH SUCCESS:", url);
      console.log("=================================");

      return result;
    } catch (error: any) {
      console.error("=================================");
      console.error("🔥 ADMIN FETCH ERROR:", url);
      console.error("STATUS:", error?.statusCode);
      console.error("MESSAGE:", error?.statusMessage);
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
