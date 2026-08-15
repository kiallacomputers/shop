export const useAdmin = () => {
  const isAdmin = useState<boolean>("isAdmin", () => false);
  const checkingAdmin = useState<boolean>("checkingAdmin", () => false);

  const checkAdmin = async () => {
    checkingAdmin.value = true;

    try {
      const response = await $fetch("/api/admin/check");

      isAdmin.value = response?.isAdmin === true;

      console.log("ADMIN STATUS:", isAdmin.value);
    } catch (error: any) {
      // 403 simply means the logged-in user isn't an admin
      if (error?.statusCode === 403) {
        isAdmin.value = false;
      } else {
        console.error("ADMIN CHECK ERROR:", error);

        isAdmin.value = false;
      }
    } finally {
      checkingAdmin.value = false;
    }
  };

  return {
    isAdmin,
    checkingAdmin,
    checkAdmin,
  };
};
