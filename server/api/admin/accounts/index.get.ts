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

    const { data: pricingLevels, error: pricingLevelsError } = await supabase
      .from("customer_pricing_levels")
      .select("key,name,markup_percent,sort_order,active")
      .eq("active", true)
      .order("sort_order");

    if (pricingLevelsError) {
      throw createError({
        statusCode: 500,
        statusMessage: pricingLevelsError.message || "Unable to load pricing levels.",
      });
    }

    const { data: pricingAssignments, error: pricingAssignmentsError } = await supabase
      .from("customer_pricing_assignments")
      .select("user_id,pricing_level_key");

    if (pricingAssignmentsError) {
      throw createError({
        statusCode: 500,
        statusMessage: pricingAssignmentsError.message || "Unable to load customer pricing assignments.",
      });
    }

    const pricingLevelMap = new Map(
      (pricingLevels ?? []).map((level: any) => [String(level.key), level]),
    );
    const pricingAssignmentMap = new Map(
      (pricingAssignments ?? []).map((assignment: any) => [String(assignment.user_id), String(assignment.pricing_level_key)]),
    );
    const standardLevel = pricingLevelMap.get("standard") || { key: "standard", name: "Standard", markup_percent: 20 };

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
          pricing_level_key:
            pricingAssignmentMap.get(String(user.id)) || String(standardLevel.key),
          pricing_level_name:
            (pricingLevelMap.get(pricingAssignmentMap.get(String(user.id)) || "standard") || standardLevel).name,
          pricing_markup_percent:
            Number((pricingLevelMap.get(pricingAssignmentMap.get(String(user.id)) || "standard") || standardLevel).markup_percent),
          pricing_levels:
            (pricingLevels ?? []).map((level: any) => ({
              key: String(level.key),
              name: String(level.name),
              markup_percent: Number(level.markup_percent),
            })),
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
