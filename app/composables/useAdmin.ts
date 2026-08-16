export const useAdmin = () => {
  const { isAdmin, adminChecked, checkingAdmin, checkAdmin } = useAdminFetch();

  return {
    isAdmin,

    adminChecked,

    checkingAdmin,

    checkAdmin,
  };
};
