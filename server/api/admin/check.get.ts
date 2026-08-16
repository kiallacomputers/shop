import { getAdminUser } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("ADMIN CHECK API");
  console.log("=================================");

  try {
    const result = await getAdminUser(event);

    console.log("ADMIN USER:", result.user?.email || "NONE");
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
        : undefined,
    };
  } catch (error: any) {
    console.error("🔥 ADMIN CHECK ERROR:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to check administrator status",
    });
  }
});
