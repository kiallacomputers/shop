import { getAdminUser } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const result = await getAdminUser(event);

  console.log("ADMIN CHECK RESULT:", {
    authenticated: !!result.user,
    isAdmin: result.isAdmin,
    email: result.user?.email,
  });

  return {
    authenticated: !!result.user,
    isAdmin: result.isAdmin,
    user: result.user
      ? {
          id: result.user.id,
          email: result.user.email,
        }
      : null,
  };
});
