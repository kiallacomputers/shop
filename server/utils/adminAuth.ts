import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(event: any) {
  const config = useRuntimeConfig();

  // ----------------------------------------
  // GET USER TOKEN
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
  // VALIDATE USER
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

  // ----------------------------------------
  // ADMIN CLIENT
  // ----------------------------------------

  const admin = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  // ----------------------------------------
  // CHECK ADMIN TABLE
  // ----------------------------------------

  const { data: adminUser, error: adminError } = await admin
    .from("admin_users")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("ADMIN CHECK ERROR:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to verify administrator",
    });
  }

  if (!adminUser) {
    console.log("ACCESS DENIED:", user.email);

    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  // ----------------------------------------
  // SUCCESS
  // ----------------------------------------

  return {
    user,
    adminUser,
  };
}
