import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🔐 ADMIN STATUS CHECK");
  console.log("=================================");

  const config = useRuntimeConfig();

  // ----------------------------------------
  // GET AUTHORIZATION HEADER
  // ----------------------------------------

  const authorization = getHeader(event, "authorization");

  if (!authorization) {
    console.log("ADMIN CHECK: NO AUTHORIZATION HEADER");

    return {
      isAdmin: false,
      user: null,
      adminUser: null,
    };
  }

  // ----------------------------------------
  // ACCESS TOKEN
  // ----------------------------------------

  const accessToken = authorization.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    console.log("ADMIN CHECK: NO ACCESS TOKEN");

    return {
      isAdmin: false,
      user: null,
      adminUser: null,
    };
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
    console.log("ADMIN CHECK: USER NOT AUTHENTICATED");

    return {
      isAdmin: false,
      user: null,
      adminUser: null,
    };
  }

  console.log("ADMIN CHECK USER:", user.email);

  console.log("ADMIN CHECK USER ID:", user.id);

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
  // CHECK ADMIN USERS
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
    console.error("ADMIN CHECK ERROR:", adminError);

    // Don't return 403.
    // This endpoint only checks status.

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
