import {
  getAdminSupabase,
  requireAdmin,
} from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ========================================
  // REQUIRE ADMIN
  // ========================================
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  // ========================================
  // GET USER ID
  // ========================================
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required.",
    });
  }

  // ========================================
  // GET USER FROM SUPABASE AUTH
  // ========================================
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.admin.getUserById(id);

  if (userError) {
    console.error("PASSWORD RESET USER LOOKUP ERROR:", userError);

    throw createError({
      statusCode: 500,
      statusMessage:
        userError.message || "Unable to find user.",
    });
  }

  const user = userData?.user;

  if (!user?.email) {
    throw createError({
      statusCode: 404,
      statusMessage: "User email address was not found.",
    });
  }

  // ========================================
  // BUILD RESET REDIRECT URL
  // ========================================
  const config = useRuntimeConfig();

  const siteUrl =
    config.public?.siteUrl ||
    "https://shop.kiallacomputers.com.au";

  const redirectTo =
    `${String(siteUrl).replace(/\/$/, "")}/reset-password`;

  // ========================================
  // SEND PASSWORD RESET EMAIL
  // ========================================
  const {
    data: resetData,
    error: resetError,
  } = await supabase.auth.resetPasswordForEmail(
    user.email,
    {
      redirectTo,
    },
  );

  if (resetError) {
    console.error("PASSWORD RESET EMAIL ERROR:", resetError);

    throw createError({
      statusCode: 500,
      statusMessage:
        resetError.message ||
        "Unable to send password reset email.",
    });
  }

  // Supabase normally returns an empty object for
  // resetPasswordForEmail(). A null error means the
  // reset request was accepted.
  console.log(
    "PASSWORD RESET EMAIL REQUEST ACCEPTED:",
    user.email,
    resetData,
  );

  return {
    success: true,
    message: `Password reset email sent to ${user.email}`,
    email: user.email,
  };
});
