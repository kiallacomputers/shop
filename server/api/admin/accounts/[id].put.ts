import {
  getAdminSupabase,
  requireSuperAdmin,
} from "~~/server/utils/adminAuth";

const allowedRoles = [
  "user",
  "admin",
  "superadmin",
] as const;

export default defineEventHandler(
  async (event) => {
    const currentUser =
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

    const body =
      await readBody(event);

    const role = String(
      body?.role ?? "",
    ).toLowerCase();

    if (
      !allowedRoles.includes(
        role as any,
      )
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Role must be user, admin or superadmin.",
      });
    }

    const currentUserId =
      (currentUser as any)?.id ||
      (currentUser as any)?.sub ||
      "";

    if (
      String(userId) ===
        String(currentUserId) &&
      role !== "superadmin"
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "You cannot demote your own SuperAdmin account.",
      });
    }

    const supabase =
      getAdminSupabase();

    const {
      data: targetResult,
      error: targetError,
    } =
      await supabase.auth.admin.getUserById(
        userId,
      );

    if (
      targetError ||
      !targetResult?.user
    ) {
      throw createError({
        statusCode: 404,
        statusMessage:
          targetError?.message ||
          "User account was not found.",
      });
    }

    const targetUser =
      targetResult.user;

    if (role === "user") {
      const {
        error: deleteError,
      } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        throw createError({
          statusCode: 500,
          statusMessage:
            deleteError.message ||
            "Unable to demote account.",
        });
      }

      return {
        success: true,
        role: "user",
      };
    }

    const {
      data,
      error,
    } = await supabase
      .from("admin_users")
      .upsert(
        {
          id: targetUser.id,
          email:
            targetUser.email ??
            null,
          role,
        },
        {
          onConflict: "id",
        },
      )
      .select(
        "id, email, role, created_at",
      )
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage:
          error.message ||
          "Unable to update administrator role.",
      });
    }

    return {
      success: true,
      role,
      adminUser: data,
    };
  },
);
