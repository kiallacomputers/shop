export function useAdminFetch() {
  const isAdmin = useState<boolean>("isAdmin", () => false);
  const adminChecked = useState<boolean>("adminChecked", () => false);
  const checkingAdmin = useState<boolean>("checkingAdmin", () => false);

  const checkAdmin = async () => {
    if (checkingAdmin.value) {
      return isAdmin.value;
    }

    checkingAdmin.value = true;

    try {
      console.log("=================================");
      console.log("CHECKING ADMIN STATUS...");

      const result = await $fetch("/api/admin/check", {
        method: "GET",
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

  return {
    isAdmin,
    adminChecked,
    checkingAdmin,
    checkAdmin,
  };
}
