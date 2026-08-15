import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";

/**
 * Get the currently authenticated Supabase user.
 *
 * This uses the Supabase session cookie created by @nuxtjs/supabase.
 */
export async function getUserFromEvent(event: H3Event) {
  const user = await serverSupabaseUser(event);

  return user;
}

/**
 * Get a Supabase client using the service/secret key.
 *
 * IMPORTANT:
 * This file is server-side only.
 * Never use this client in browser/client code.
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

  if (!user) {
    return {
      user: null,
      isAdmin: false,
    };
  }

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

  return {
    user,
    isAdmin: !!data,
  };
}

/**
 * Require the logged-in user to be an administrator.
 *
 * API endpoints can call this before performing admin operations.
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
