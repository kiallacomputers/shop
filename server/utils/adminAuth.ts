import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";

/**
 * Create a server-only Supabase client using the secret key.
 *
 * NEVER expose this client or its key to browser code.
 */
export const getAdminSupabase = () => {
  const config = useRuntimeConfig();

  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL;

  const supabaseSecretKey =
    config.supabaseSecretKey || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase URL is not configured",
    });
  }

  if (!supabaseSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase secret key is not configured",
    });
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Get the currently authenticated user
 * and determine whether they are an administrator.
 */
export const getAdminUser = async (event: H3Event) => {
  let user: any = null;

  try {
    user = await serverSupabaseUser(event);
  } catch (error) {
    console.error("SUPABASE USER CHECK ERROR:", error);

    user = null;
  }

  /**
   * No authenticated user.
   *
   * IMPORTANT:
   * Return a normal response instead of throwing.
   * This prevents the header from receiving a 500.
   */
  if (!user) {
    console.log("ADMIN AUTH: No authenticated user");

    return {
      user: null,
      isAdmin: false,
      adminUser: null,
    };
  }

  console.log("ADMIN AUTH USER:", user.email);

  /**
   * Make absolutely sure we have a valid
   * Supabase Auth user ID before querying
   * the UUID column in admin_users.
   */
  const userId = user.id;

  if (!userId || typeof userId !== "string") {
    console.error("ADMIN AUTH ERROR: User has no valid ID", user);

    return {
      user,
      isAdmin: false,
      adminUser: null,
    };
  }

  console.log("ADMIN AUTH USER ID:", userId);

  const adminSupabase = getAdminSupabase();

  /**
   * Look up the authenticated user's UUID
   * in admin_users.
   */
  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (adminError) {
    console.error("ADMIN USER LOOKUP ERROR:", adminError);

    /**
     * Don't turn a temporary lookup problem
     * into a server crash.
     */
    return {
      user,
      isAdmin: false,
      adminUser: null,
    };
  }

  const isAdmin = !!adminUser;

  console.log("ADMIN USER FOUND:", isAdmin);

  console.log("IS ADMIN:", isAdmin);

  return {
    user,
    isAdmin,
    adminUser,
  };
};

/**
 * Require an authenticated administrator.
 *
 * Used by protected server API routes.
 */
export const requireAdmin = async (event: H3Event) => {
  const result = await getAdminUser(event);

  if (!result.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  if (!result.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  return result.user;
};
