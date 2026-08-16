import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import { getHeader } from "h3";

/**
 * ============================================================
 * GET AUTHENTICATED USER
 * ============================================================
 *
 * Authentication is performed using:
 *
 * Authorization: Bearer <supabase_access_token>
 *
 * This is reliable for Netlify/serverless requests.
 *
 */

export async function getUserFromEvent(event: H3Event) {
  try {
    const authorization = getHeader(event, "authorization");

    console.log("=================================");
    console.log("AUTHENTICATION CHECK");
    console.log("AUTHORIZATION HEADER:", authorization ? "PRESENT" : "MISSING");

    // ----------------------------------------------------------
    // REQUIRE BEARER TOKEN
    // ----------------------------------------------------------

    if (!authorization) {
      console.error("❌ NO AUTHORIZATION HEADER");

      return null;
    }

    if (!authorization.startsWith("Bearer ")) {
      console.error("❌ INVALID AUTHORIZATION HEADER");

      return null;
    }

    const accessToken = authorization.substring(7).trim();

    if (!accessToken) {
      console.error("❌ EMPTY ACCESS TOKEN");

      return null;
    }

    // ----------------------------------------------------------
    // SUPABASE CONFIGURATION
    // ----------------------------------------------------------

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const supabaseAnonKey =
      config.public.supabaseAnonKey || config.supabaseAnonKey;

    if (!supabaseUrl) {
      console.error("❌ SUPABASE URL NOT CONFIGURED");

      return null;
    }

    if (!supabaseAnonKey) {
      console.error("❌ SUPABASE ANON KEY NOT CONFIGURED");

      return null;
    }

    // ----------------------------------------------------------
    // CREATE AUTH CLIENT
    // ----------------------------------------------------------

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ----------------------------------------------------------
    // VERIFY TOKEN
    // ----------------------------------------------------------

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error) {
      console.error("❌ SUPABASE TOKEN ERROR:", error.message);

      return null;
    }

    if (!user) {
      console.error("❌ USER NOT FOUND");

      return null;
    }

    console.log("✅ AUTHENTICATED USER:", user.email);
    console.log("USER ID:", user.id);
    console.log("=================================");

    return user;
  } catch (error) {
    console.error("🔥 GET USER ERROR:", error);

    return null;
  }
}

/**
 * ============================================================
 * ADMIN SUPABASE CLIENT
 * ============================================================
 *
 * SERVER SIDE ONLY.
 *
 * Uses the Supabase secret/service key.
 *
 */

export function getAdminSupabase() {
  const config = useRuntimeConfig();

  const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

  const supabaseKey = config.supabaseSecretKey || config.supabaseServiceKey;

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
 * ============================================================
 * CHECK ADMIN USER
 * ============================================================
 */

export async function isAdminUser(event: H3Event) {
  const user = await getUserFromEvent(event);

  // ----------------------------------------------------------
  // NOT AUTHENTICATED
  // ----------------------------------------------------------

  if (!user) {
    console.log("❌ ADMIN CHECK: NO USER");

    return {
      user: null,
      isAdmin: false,
    };
  }

  // ----------------------------------------------------------
  // SERVER ADMIN CLIENT
  // ----------------------------------------------------------

  const supabase = getAdminSupabase();

  // ----------------------------------------------------------
  // CHECK ADMIN USERS TABLE
  // ----------------------------------------------------------

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("🔥 ADMIN DATABASE CHECK ERROR:", error);

    return {
      user,
      isAdmin: false,
    };
  }

  console.log("👤 ADMIN DATABASE RESULT:", data);

  return {
    user,
    isAdmin: !!data,
  };
}

/**
 * ============================================================
 * REQUIRE ADMIN
 * ============================================================
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
