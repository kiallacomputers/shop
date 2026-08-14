import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const result = await requireAdmin(event);

  return {
    isAdmin: true,
    user: result.user,
    adminUser: result.adminUser,
  };
});
