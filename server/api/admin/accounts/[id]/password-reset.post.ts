import {
  getAdminSupabase,
  requireSuperAdmin,
} from "~~/server/utils/adminAuth";

export default defineEventHandler(
  async (event) => {
    await requireSuperAdmin(event);

    const userId =
      getRouterParam(event, "id");

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "User ID is required.",
      });
    }

    const supabase =
      getAdminSupabase();

    // Get the account from Supabase Auth so the
    // browser never supplies the destination email.
    const {
      data: userResult,
      error: userError,
    } =
      await supabase.auth.admin.getUserById(
        userId,
      );

    if (
      userError ||
      !userResult?.user
    ) {
      console.error(
        "PASSWORD RESET USER LOOKUP ERROR:",
        userError,
      );

      throw createError({
        statusCode: 404,
        statusMessage:
          userError?.message ||
          "User account was not found.",
      });
    }

    const email =
      userResult.user.email;

    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "This account does not have an email address.",
      });
    }

    // Ask Supabase Auth to send its configured
    // password-recovery email.
    const {
      error: resetError,
    } =
      await supabase.auth.resetPasswordForEmail(
        email,
      );

    if (resetError) {
      console.error(
        "PASSWORD RESET EMAIL ERROR:",
        resetError,
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          resetError.message ||
          "Unable to send password reset email.",
      });
    }

    console.log(
      "PASSWORD RESET EMAIL SENT:",
      email,
    );

    return {
      success: true,
      email,
    };
  },
);
