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

  const supabaseUrl =
    config.public?.supabaseUrl || process.env.SUPABASE_URL;

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
}

/**
 * Get the currently authenticated Supabase user.
 *
 * @nuxtjs/supabase reads the authenticated session from the
 * request cookies, which is what the browser sends with $fetch.
 */
export const getAdminUser = async (event: H3Event) => {
  let user;

  try {
    user = await serverSupabaseUser(event);
  } catch (error) {
    console.error("SUPABASE USER CHECK ERROR:", error);
    user = null;
  }

  if (!user) {
    return {
      user: null,
      isAdmin: false,
      adminUser: null,
    };
  }

  const adminSupabase = getAdminSupabase();

  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("ADMIN USER LOOKUP ERROR:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to verify administrator status",
    });
  }

  return {
    user,
    isAdmin: !!adminUser,
    adminUser,
  };
}

/**
 * Require an authenticated administrator.
 *
 * Returns the authenticated Supabase user so existing routes can
 * use the returned value as `user`.
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
}
