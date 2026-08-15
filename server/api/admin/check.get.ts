import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🔐 ADMIN CHECK");
  console.log("=================================");

  const config = useRuntimeConfig();

  // ----------------------------------------
  // GET AUTHORIZATION HEADER
  // ----------------------------------------

  const authorization = getHeader(event, "authorization");

  if (!authorization) {
    console.log("NO AUTHORIZATION HEADER");

    return {
      isAdmin: false,
      user: null,
      adminUser: null,
    };
  }

  // ----------------------------------------
  // GET ACCESS TOKEN
  // ----------------------------------------

  const accessToken = authorization.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    console.log("NO ACCESS TOKEN");

    return {
      isAdmin: false,
      user: null,
      adminUser: null,
    };
  }

  // ----------------------------------------
  // SUPABASE CLIENT
  // ----------------------------------------

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  );

  // ----------------------------------------
  // GET LOGGED-IN USER
  // ----------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    console.log("NO AUTHENTICATED USER");

    return {
      isAdmin: false,
      user: null,
      adminUser: null,
    };
  }

  console.log("AUTHENTICATED USER:", user.email);

  console.log("USER ID:", user.id);

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
  // CHECK admin_users
  // ----------------------------------------

  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // ----------------------------------------
  // DATABASE ERROR
  // ----------------------------------------

  if (adminError) {
    console.error("ADMIN DATABASE CHECK ERROR:", adminError);

    // IMPORTANT:
    // Don't return 403 here.
    // This endpoint is only checking status.
    return {
      isAdmin: false,
      user: {
        id: user.id,
        email: user.email,
      },
      adminUser: null,
    };
  }

  // ----------------------------------------
  // NOT ADMIN
  // ----------------------------------------

  if (!adminUser) {
    console.log("USER IS NOT ADMIN:", user.email);

    return {
      isAdmin: false,
      user: {
        id: user.id,
        email: user.email,
      },
      adminUser: null,
    };
  }

  // ----------------------------------------
  // ADMIN
  // ----------------------------------------

  console.log("✅ USER IS ADMIN:", user.email);

  return {
    isAdmin: true,
    user: {
      id: user.id,
      email: user.email,
    },
    adminUser,
  };
});
