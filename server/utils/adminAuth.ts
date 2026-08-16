import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";

export async function getAdminSupabase() {
  const config = useRuntimeConfig();

  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;

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

export async function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig();

  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;

  const supabaseAnonKey =
    config.public?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase URL is not configured",
    });
  }

  if (!supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase anon key is not configured",
    });
  }

  /*
   * Create a client using the user's authentication cookies.
   *
   * This is important because we need to determine WHICH
   * user is making the admin request.
   */
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  /*
   * Get the user's access token from the request.
   */
  const authorization = getHeader(event, "authorization");

  if (!authorization) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const token = authorization.replace(/^Bearer\s+/i, "");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid or expired authentication",
    });
  }

  /*
   * Use the service/secret client to check admin_users.
   * This bypasses RLS and is ONLY used server-side.
   */
  const adminSupabase = await getAdminSupabase();

  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Admin lookup error:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to verify administrator status",
    });
  }

  if (!adminUser) {
    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  return {
    user,
    adminUser,
    supabase: adminSupabase,
  };
}
