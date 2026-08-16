import { isAdminUser } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("ADMIN CHECK API");

  try {
    const result = await isAdminUser(event);

    console.log("ADMIN USER:", result.user?.email || "NONE");

    console.log("IS ADMIN:", result.isAdmin);

    console.log("=================================");

    if (!result.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Not authenticated",
      });
    }

    return {
      authenticated: true,

      isAdmin: result.isAdmin,

      user: {
        id: result.user.id,

        email: result.user.email,
      },
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
