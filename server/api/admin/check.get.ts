import { getAdminUser } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const { user, isAdmin, adminUser } = await getAdminUser(event);

  const userId = user?.id || user?.sub || null;

  return {
    authenticated: !!user,
    isAdmin,
    user: user
      ? {
          id: userId,
          email: user.email || null,
        }
      : null,
    adminUser,
  };
});
