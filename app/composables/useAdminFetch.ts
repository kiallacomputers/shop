export function useAdminFetch() {
  const isAdmin = useState<boolean>("isAdmin", () => false);
  const isSuperAdmin = useState<boolean>("isSuperAdmin", () => false);
  const adminRole = useState<"superadmin" | "admin" | null>("adminRole", () => null);
  const adminPermissions = useState<Record<string, boolean>>("adminPermissions", () => ({}));
  const securityGroup = useState<{ id: string; name: string } | null>("adminSecurityGroup", () => null);
  const adminChecked = useState<boolean>("adminChecked", () => false);
  const checkingAdmin = useState<boolean>("checkingAdmin", () => false);

  // Distinguishes an expired/missing login from a signed-in user who simply
  // does not have Admin access.
  const adminAuthExpired = useState<boolean>("adminAuthExpired", () => false);

  const user = useSupabaseUser();

  const clearAdminState = () => {
    isAdmin.value = false;
    isSuperAdmin.value = false;
    adminRole.value = null;
    adminPermissions.value = {};
    securityGroup.value = null;
  };

  const currentAdminReturnPath = () => {
    if (!import.meta.client) return "/admin";

    const route = useRoute();
    const fullPath = String(route.fullPath || "/admin");

    // We only preserve an internal Admin route.
    if (
      !fullPath.startsWith("/admin") ||
      fullPath.startsWith("//") ||
      fullPath.includes("\\")
    ) {
      return "/admin";
    }

    return fullPath;
  };

  const sendToLogin = async () => {
    if (!import.meta.client) return;

    const redirect = currentAdminReturnPath();
    const route = useRoute();

    // Avoid duplicate navigation if another request has already redirected.
    if (route.path === "/auth/signin") return;

    await navigateTo({
      path: "/auth/signin",
      query: { redirect },
    });
  };

  const checkAdmin = async () => {
    if (checkingAdmin.value) return isAdmin.value;

    checkingAdmin.value = true;

    try {
      let attempts = 0;

      // Supabase can take a moment to restore a valid browser session after a
      // refresh, so retain the existing short wait before deciding it is gone.
      while (!user.value && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!user.value) {
        clearAdminState();
        adminChecked.value = false;
        adminAuthExpired.value = true;
        return false;
      }

      const result = await $fetch<{
        authenticated: boolean;
        isAdmin: boolean;
        isSuperAdmin: boolean;
        role: "superadmin" | "admin" | null;
        permissions?: Record<string, boolean>;
        securityGroup?: { id: string; name: string } | null;
        user?: { id: string; email: string | null } | null;
      }>("/api/admin/check", {
        method: "GET",
        credentials: "include",
      });

      adminAuthExpired.value = result.authenticated !== true;

      isAdmin.value =
        result.authenticated === true &&
        result.isAdmin === true;

      isSuperAdmin.value =
        result.authenticated === true &&
        result.isSuperAdmin === true;

      adminRole.value = result.role || null;
      adminPermissions.value = result.permissions || {};
      securityGroup.value = result.securityGroup || null;
      adminChecked.value = true;

      return isAdmin.value;
    } catch (error: any) {
      console.error("ADMIN CHECK ERROR:", error);

      clearAdminState();
      adminChecked.value = false;

      const status = Number(
        error?.statusCode ||
        error?.status ||
        error?.response?.status ||
        error?.data?.statusCode ||
        0
      );

      // A 401 means the session is no longer usable. A missing Supabase user
      // after the restore wait is treated the same way.
      adminAuthExpired.value = status === 401 || !user.value;

      return false;
    } finally {
      checkingAdmin.value = false;
    }
  };

  const adminFetch = async <T = any>(
    url: string,
    options: any = {},
  ): Promise<T> => {
    try {
      return await $fetch<T>(url, {
        ...options,
        credentials: "include",
      });
    } catch (error: any) {
      const status = Number(
        error?.statusCode ||
        error?.status ||
        error?.response?.status ||
        error?.data?.statusCode ||
        0
      );

      if (status === 401) {
        clearAdminState();
        adminChecked.value = false;
        adminAuthExpired.value = true;

        // Do not leave a timed-out Admin page half-rendered with API errors.
        await sendToLogin();
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
    adminPermissions,
    securityGroup,
    adminChecked,
    checkingAdmin,
    adminAuthExpired,
    clearAdminState,
    sendToLogin,
  };
}
