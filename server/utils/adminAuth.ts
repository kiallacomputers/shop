import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import { getHeader } from "h3";
import { serverSupabaseUser } from "#supabase/server";

/**
 * Get the currently authenticated Supabase user.
 *
 * Supports:
 * 1. Nuxt Supabase authentication cookies
 * 2. Authorization: Bearer <access_token>
 */
export async function getUserFromEvent(event: H3Event) {
  // -----------------------------------------
  // First try the Nuxt Supabase session
  // -----------------------------------------

  try {
    const user = await serverSupabaseUser(event);

    if (user) {
      console.log("AUTH USER FROM SUPABASE SESSION:", user.email);

      return user;
    }
  } catch (error) {
    console.log("No Supabase server session found");
  }

  // -----------------------------------------
  // If no session, check Authorization header
  // -----------------------------------------

  const authorization = getHeader(event, "authorization");

  if (!authorization) {
    console.log("NO AUTHORIZATION HEADER");

    return null;
  }

  if (!authorization.startsWith("Bearer ")) {
    console.log("INVALID AUTHORIZATION HEADER");

    return null;
  }

  const accessToken = authorization.substring(7);

  if (!accessToken) {
    console.log("EMPTY ACCESS TOKEN");

    return null;
  }

  // -----------------------------------------
  // Create a normal Supabase client
  // using the public URL + anon key
  // -----------------------------------------

  const config = useRuntimeConfig();

  const supabaseUrl = config.supabaseUrl || config.public.supabaseUrl;

  const supabaseAnonKey =
    config.supabaseAnonKey || config.public.supabaseAnonKey;

  if (!supabaseUrl) {
    console.error("SUPABASE URL NOT CONFIGURED");

    return null;
  }

  if (!supabaseAnonKey) {
    console.error("SUPABASE ANON KEY NOT CONFIGURED");

    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // -----------------------------------------
  // Validate the access token
  // -----------------------------------------

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error) {
    console.error("SUPABASE ACCESS TOKEN ERROR:", error.message);

    return null;
  }

  if (!user) {
    console.log("ACCESS TOKEN USER NOT FOUND");

    return null;
  }

  console.log("AUTH USER FROM BEARER TOKEN:", user.email);

  return user;
}

/**
 * Get a Supabase client using the secret/service key.
 *
 * SERVER SIDE ONLY.
 *
 * Never expose this key to browser/client code.
 */
export function getAdminSupabase() {
  const config = useRuntimeConfig();

  const supabaseUrl = config.supabaseUrl || config.public.supabaseUrl;

  const supabaseKey = config.supabaseSecretKey;

  if (!supabaseUrl) {
    throw new Error("Supabase URL is not configured");
  }

  if (!supabaseKey) {
    throw new Error("Supabase secret key is not configured");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check whether the currently logged-in user
 * exists in the admin_users table.
 */
export async function isAdminUser(event: H3Event) {
  const user = await getUserFromEvent(event);

  // -----------------------------------------
  // User is not authenticated
  // -----------------------------------------

  if (!user) {
    return {
      user: null,
      isAdmin: false,
    };
  }

  // -----------------------------------------
  // Use secret key to check admin_users
  // -----------------------------------------

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("email", user.email)
    .maybeSingle();

  if (error) {
    console.error("ADMIN DATABASE CHECK ERROR:", error);

    return {
      user,
      isAdmin: false,
    };
  }

  console.log("ADMIN DATABASE RESULT:", data);

  return {
    user,
    isAdmin: !!data,
  };
}

/**
 * Require the logged-in user to be
 * an administrator.
 */
export async function requireAdmin(event: H3Event) {
  const result = await isAdminUser(event);

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
