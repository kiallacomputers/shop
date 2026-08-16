import { getAdminUser } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("ADMIN CHECK API");
  console.log("=================================");

  try {
    const result = await getAdminUser(event);

    console.log("USER:", result.user);
    console.log("USER ID:", result.user?.id);
    console.log("USER EMAIL:", result.user?.email);
    console.log("ADMIN USER:", result.adminUser);
    console.log("IS ADMIN:", result.isAdmin);

    console.log("=================================");

    return {
      authenticated: !!result.user,
      isAdmin: result.isAdmin,
      user: result.user
        ? {
            id: result.user.id,
            email: result.user.email,
          }
        : null,
      adminUser: result.adminUser,
    };
  } catch (error: any) {
    console.error("🔥 ADMIN CHECK ERROR:", error);

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage:
        error?.statusMessage || "Unable to check administrator status",
    });
  }
});
