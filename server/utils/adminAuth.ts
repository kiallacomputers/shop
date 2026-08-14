import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(event: any) {
  const config = useRuntimeConfig();

  const authHeader = getHeader(event, "authorization");

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  /*
   * Check logged-in user
   */

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.error("AUTH ERROR:", userError);

    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  console.log("Authenticated user:", user.email);

  /*
   * Check admin_users table
   */

  const adminSupabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("id, email")
    .eq("email", user.email)
    .maybeSingle();

  if (adminError) {
    console.error("ADMIN DATABASE ERROR:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: adminError.message,
    });
  }

  if (!adminUser) {
    console.log("NOT AN ADMIN:", user.email);

    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  console.log("ADMIN USER:", user.email);

  return {
    user,
    adminUser,
    supabase: adminSupabase,
  };
}
