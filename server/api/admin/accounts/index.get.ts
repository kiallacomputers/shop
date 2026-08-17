import {
  getAdminSupabase,
  requireSuperAdmin,
} from "~~/server/utils/adminAuth";

export default defineEventHandler(
  async (event) => {
    const currentUser =
      await requireSuperAdmin(event);

    const supabase =
      getAdminSupabase();

    const allUsers: any[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const {
        data,
        error,
      } =
        await supabase.auth.admin.listUsers(
          {
            page,
            perPage,
          },
        );

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage:
            error.message ||
            "Unable to load user accounts.",
        });
      }

      const users =
        data?.users ?? [];

      allUsers.push(...users);

      if (
        users.length < perPage
      ) {
        break;
      }

      page++;

      if (page > 100) {
        break;
      }
    }

    const {
      data: adminUsers,
      error: adminError,
    } = await supabase
      .from("admin_users")
      .select(
        "id, email, created_at, role",
      );

    if (adminError) {
      throw createError({
        statusCode: 500,
        statusMessage:
          adminError.message ||
          "Unable to load administrator records.",
      });
    }

    const adminMap =
      new Map(
        (adminUsers ?? []).map(
          (admin: any) => [
            String(admin.id),
            admin,
          ],
        ),
      );

    const currentUserId =
      (currentUser as any)?.id ||
      (currentUser as any)?.sub ||
      "";

    return allUsers
      .map((user: any) => {
        const adminRecord =
          adminMap.get(
            String(user.id),
          );

        const displayName =
          user.user_metadata
            ?.display_name ||
          user.user_metadata
            ?.full_name ||
          user.user_metadata?.name ||
          "";

        return {
          id: user.id,
          email: user.email ?? "",
          display_name:
            displayName,
          created_at:
            user.created_at ??
            null,
          last_sign_in_at:
            user.last_sign_in_at ??
            null,
          email_confirmed_at:
            user.email_confirmed_at ??
            null,
          role:
            adminRecord?.role ||
            null,
          is_admin:
            Boolean(adminRecord),
          is_superadmin:
            adminRecord?.role ===
            "superadmin",
          admin_since:
            adminRecord?.created_at ??
            null,
          is_current_user:
            String(user.id) ===
            String(currentUserId),
        };
      })
      .sort(
        (
          a: any,
          b: any,
        ) => {
          const nameA =
            a.display_name ||
            a.email ||
            "";

          const nameB =
            b.display_name ||
            b.email ||
            "";

          return nameA.localeCompare(
            nameB,
            undefined,
            {
              sensitivity:
                "base",
            },
          );
        },
      );
  },
);
