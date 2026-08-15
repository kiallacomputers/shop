import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";

export async function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig();

  // Create Supabase admin client using the server-only secret key
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  // Get Authorization header
  const authHeader = getHeader(event, "authorization");

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  // Remove "Bearer " from token
  const token = authHeader.replace("Bearer ", "");

  // Get logged-in Supabase user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.error("AUTH ERROR:", userError);

    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  console.log("ADMIN CHECK USER:", user.email);
  console.log("ADMIN CHECK USER ID:", user.id);

  // Check admin_users table
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("ADMIN DATABASE ERROR:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to check admin status",
    });
  }

  // User is authenticated but isn't in admin_users
  if (!adminUser) {
    console.log("USER IS NOT ADMIN:", user.email);

    throw createError({
      statusCode: 403,
      statusMessage: "User is not an administrator",
    });
  }

  console.log("ADMIN USER:", user.email);

  return {
    user,
    adminUser,
  };
}
