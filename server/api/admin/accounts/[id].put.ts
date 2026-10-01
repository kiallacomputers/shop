import {
  getAdminSupabase,
  requireSuperAdmin,
} from "~~/server/utils/adminAuth";
import { assertAllowedKeys, rejectOversizedContentLength, requireObjectBody } from "~~/server/utils/inputValidation";

const allowedRoles = [
  "user",
  "admin",
  "superadmin",
] as const;

export default defineEventHandler(
  async (event) => {
    const currentUser =
      await requireSuperAdmin(event);

    rejectOversizedContentLength(event, 4 * 1024);
    const userId = getRouterParam(event, "id");

    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "A valid user ID is required.",
      });
    }

    const body = requireObjectBody(await readBody(event));
    assertAllowedKeys(body, ["role"]);

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
