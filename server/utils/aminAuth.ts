import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(event: any) {
  const config = useRuntimeConfig();

  // ----------------------------------------
  // GET AUTHORIZATION HEADER
  // ----------------------------------------

  const authorization = getHeader(event, "authorization");

  if (!authorization) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const token = authorization.replace("Bearer ", "");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid authentication token",
    });
  }

  // ----------------------------------------
  // VERIFY USER
  // ----------------------------------------

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
      statusMessage: "Invalid authentication",
    });
  }

  console.log("AUTHENTICATED USER:", user.id, user.email);

  // ----------------------------------------
  // SERVER-ONLY ADMIN CLIENT
  // ----------------------------------------

  const admin = createClient(
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

  const { data: adminUser, error: adminError } = await admin
    .from("admin_users")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  console.log("ADMIN USER:", adminUser);

  console.log("ADMIN ERROR:", adminError);

  // ----------------------------------------
  // DENY ACCESS
  // ----------------------------------------

  if (adminError || !adminUser) {
    console.error("ADMIN ACCESS DENIED");

    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  // ----------------------------------------
  // ADMIN ACCESS GRANTED
  // ----------------------------------------

  console.log("✅ ADMIN ACCESS GRANTED:", user.email);

  return {
    user,
    adminUser,
  };
}
