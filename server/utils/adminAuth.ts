import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

/**
 * Get the currently logged-in Supabase user
 */
export async function getAdminUser(event: any) {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      return {
        user: null,
        isAdmin: false,
      };
    }

    /*
     * Use the service-role client for the admin_users lookup.
     *
     * This is server-side only and avoids RLS preventing the
     * application from checking the admin_users table.
     */
    const supabase = serverSupabaseServiceRole(event);

    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("=================================");
      console.error("ADMIN DATABASE CHECK ERROR");
      console.error("=================================");
      console.error(error);
      console.error("=================================");

      return {
        user,
        isAdmin: false,
      };
    }

    return {
      user,
      isAdmin: !!data,
    };
  } catch (error) {
    console.error("=================================");
    console.error("GET ADMIN USER ERROR");
    console.error("=================================");
    console.error(error);
    console.error("=================================");

    return {
      user: null,
      isAdmin: false,
    };
  }
}

/**
 * Check whether the current user is an administrator.
 *
 * Returns only true/false.
 */
export async function isAdminUser(event: any): Promise<boolean> {
  const result = await getAdminUser(event);

  return result.isAdmin;
}

/**
 * Require the current user to be an administrator.
 *
 * API endpoints can simply call:
 *
 * await requireAdmin(event);
 *
 * It will throw a 401 if the user is not logged in
 * or a 403 if the user is logged in but not an administrator.
 */
export async function requireAdmin(event: any) {
  const result = await getAdminUser(event);

  if (!result.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  if (!result.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  return result.user;
}
