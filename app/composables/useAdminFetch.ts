export function useAdminFetch() {
  const supabase = useSupabaseClient();

  // ============================================================
  // SHARED ADMIN STATE
  // ============================================================

  const isAdmin = useState<boolean>("isAdmin", () => false);

  const adminChecked = useState<boolean>("adminChecked", () => false);

  const checkingAdmin = useState<boolean>("checkingAdmin", () => false);

  // ============================================================
  // GET SUPABASE ACCESS TOKEN
  // ============================================================

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error("❌ NO SUPABASE ACCESS TOKEN");

        return null;
      }

      return session.access_token;
    } catch (error) {
      console.error("❌ GET ACCESS TOKEN ERROR:", error);

      return null;
    }
  };

  // ============================================================
  // CHECK ADMIN STATUS
  // ============================================================

  const checkAdmin = async (): Promise<boolean> => {
    if (checkingAdmin.value) {
      return isAdmin.value;
    }

    checkingAdmin.value = true;

    try {
      console.log("=================================");

      console.log("CHECKING ADMIN STATUS...");

      // --------------------------------------------------------
      // GET ACCESS TOKEN
      // --------------------------------------------------------

      const token = await getAccessToken();

      if (!token) {
        console.error("❌ NO TOKEN - USER NOT AUTHENTICATED");

        isAdmin.value = false;

        adminChecked.value = true;

        return false;
      }

      console.log("✅ ACCESS TOKEN FOUND");

      // --------------------------------------------------------
      // ADMIN CHECK API
      // --------------------------------------------------------

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

        credentials: "include",
      });

      console.log("ADMIN CHECK RESULT:", result);

      isAdmin.value = result.isAdmin === true;

      adminChecked.value = true;

      console.log("IS ADMIN:", isAdmin.value);

      console.log("=================================");

      return isAdmin.value;
    } catch (error: any) {
      console.error("🔥 ADMIN CHECK ERROR:", error);

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

      // --------------------------------------------------------
      // GET CURRENT ACCESS TOKEN
      // --------------------------------------------------------

      const token = await getAccessToken();

      if (!token) {
        console.error("❌ ADMIN FETCH: NO ACCESS TOKEN");

        throw createError({
          statusCode: 401,

          statusMessage: "Authentication required",
        });
      }

      console.log("✅ ADMIN FETCH TOKEN FOUND");

      // --------------------------------------------------------
      // BUILD HEADERS
      // --------------------------------------------------------

      const headers = new Headers(options.headers || {});

      headers.set("Authorization", `Bearer ${token}`);

      // --------------------------------------------------------
      // REQUEST
      // --------------------------------------------------------

      const result = await $fetch<T>(url, {
        ...options,

        headers,

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

      // --------------------------------------------------------
      // UNAUTHENTICATED
      // --------------------------------------------------------

      if (error?.statusCode === 401) {
        isAdmin.value = false;

        adminChecked.value = true;
      }

      // --------------------------------------------------------
      // NOT ADMIN
      // --------------------------------------------------------

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

    isAdmin,

    adminChecked,

    checkingAdmin,

    checkAdmin,
  };
}
