import {
  getAdminUser,
} from "~~/server/utils/adminAuth";

export default defineEventHandler(
  async (event) => {
    const {
      user,
      isAdmin,
      isSuperAdmin,
      role,
      adminUser,
    } = await getAdminUser(event);

    const userId =
      user?.id ||
      user?.sub ||
      null;

    return {
      authenticated: !!user,
      isAdmin,
      isSuperAdmin,
      role,
      user: user
        ? {
            id: userId,
            email:
              user.email || null,
          }
        : null,
      adminUser,
    };
  },
);
