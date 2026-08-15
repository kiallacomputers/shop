import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(event: any) {
  const config = useRuntimeConfig();

  // ----------------------------------------
  // GET AUTHORIZATION HEADER
  // ----------------------------------------

  const authorization = getHeader(event, "authorization");

  if (!authorization) {
    console.log("ADMIN AUTH: NO AUTHORIZATION HEADER");

    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  // ----------------------------------------
  // GET ACCESS TOKEN
  // ----------------------------------------

  const accessToken = authorization.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    console.log("ADMIN AUTH: NO ACCESS TOKEN");

    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  // ----------------------------------------
  // SUPABASE AUTH CLIENT
  // ----------------------------------------

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  );

  // ----------------------------------------
  // GET USER
  // ----------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    console.log("ADMIN AUTH: INVALID USER", userError?.message);

    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  console.log("Authenticated user:", user.email);

  // ----------------------------------------
  // SERVER SUPABASE CLIENT
  // ----------------------------------------

  const adminSupabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // ----------------------------------------
  // CHECK ADMIN TABLE
  // ----------------------------------------

  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("ADMIN DATABASE ERROR:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to check administrator status",
    });
  }

  // ----------------------------------------
  // NOT ADMIN
  // ----------------------------------------

  if (!adminUser) {
    console.log("NOT AN ADMIN:", user.email);

    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  // ----------------------------------------
  // ADMIN
  // ----------------------------------------

  console.log("✅ ADMIN VERIFIED:", user.email);

  return {
    user,
    adminUser,
  };
}
