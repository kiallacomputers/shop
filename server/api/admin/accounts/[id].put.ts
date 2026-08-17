import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const currentUser = await requireAdmin(event);

  const userId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required.",
    });
  }

  const body = await readBody(event);

  if (typeof body?.isAdmin !== "boolean") {
    throw createError({
      statusCode: 400,
      statusMessage:
        "isAdmin must be true or false.",
    });
  }

  const currentUserId =
    (currentUser as any)?.id ||
    (currentUser as any)?.sub ||
    "";

  if (
    body.isAdmin === false &&
    String(userId) === String(currentUserId)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "You cannot remove your own administrator access.",
    });
  }

  const supabase = getAdminSupabase();

  const {
    data: targetUserResult,
    error: targetUserError,
  } = await supabase.auth.admin.getUserById(
    userId,
  );

  if (
    targetUserError ||
    !targetUserResult?.user
  ) {
    console.error(
      "ADMIN TARGET USER ERROR:",
      targetUserError,
    );

    throw createError({
      statusCode: 404,
      statusMessage:
        targetUserError?.message ||
        "User account was not found.",
    });
  }

  const targetUser =
    targetUserResult.user;

  if (body.isAdmin === true) {
    const {
      data,
      error,
    } = await supabase
      .from("admin_users")
      .upsert(
        {
          id: targetUser.id,
          email: targetUser.email ?? null,
        },
        {
          onConflict: "id",
        },
      )
      .select("*")
      .single();

    if (error) {
      console.error(
        "PROMOTE ADMIN ERROR:",
        error,
      );

      throw createError({
        statusCode: 500,
        statusMessage:
          error.message ||
          "Unable to grant administrator access.",
      });
    }

    return {
      success: true,
      isAdmin: true,
      adminUser: data,
    };
  }

  const {
    error: deleteError,
  } = await supabase
    .from("admin_users")
    .delete()
    .eq("id", userId);

  if (deleteError) {
    console.error(
      "REMOVE ADMIN ERROR:",
      deleteError,
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        deleteError.message ||
        "Unable to remove administrator access.",
    });
  }

  return {
    success: true,
    isAdmin: false,
  };
});
