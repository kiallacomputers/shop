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
 * Get the currently authenticated Supabase user.
 *
 * First try the normal Nuxt Supabase session cookie.
 *
 * If that is not available, fall back to the
 * Authorization: Bearer <token> header.
 */
export const getAdminUser = async (event: H3Event) => {
  let user = null;

  // =========================================
  // 1. TRY NORMAL NUXT SUPABASE SESSION
  // =========================================

  try {
    user = await serverSupabaseUser(event);
  } catch (error) {
    console.error("SUPABASE COOKIE USER CHECK ERROR:", error);
  }

  // =========================================
  // 2. FALL BACK TO BEARER TOKEN
  // =========================================

  if (!user) {
    const authorization = getHeader(event, "authorization");

    if (authorization && authorization.startsWith("Bearer ")) {
      const accessToken = authorization.substring(7);

      if (accessToken) {
        try {
          const supabase = getAdminSupabase();

          const { data, error } = await supabase.auth.getUser(accessToken);

          if (error) {
            console.error("BEARER TOKEN USER ERROR:", error);
          } else {
            user = data.user;
          }
        } catch (error) {
          console.error("BEARER TOKEN CHECK ERROR:", error);
        }
      }
    }
  }

  // =========================================
  // NO USER
  // =========================================

  if (!user) {
    console.log("ADMIN AUTH: No authenticated user");

    return {
      user: null,
      isAdmin: false,
      adminUser: null,
    };
  }

  console.log("ADMIN AUTH USER:", user.email);

  // =========================================
  // CHECK ADMIN_USERS
  // =========================================

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

  const isAdmin = !!adminUser;

  console.log("ADMIN USER FOUND:", !!adminUser);

  console.log("IS ADMIN:", isAdmin);

  return {
    user,
    isAdmin,
    adminUser,
  };
};

/**
 * Require an authenticated administrator.
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
