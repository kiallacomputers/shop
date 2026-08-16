import type { H3Event } from "h3";
import { createError, getHeader } from "h3";
import { serverSupabaseClient } from "#supabase/server";

// ============================================================
// GET ADMIN SUPABASE CLIENT
// ============================================================

export async function getAdminSupabase(event: H3Event) {
  return await serverSupabaseClient(event);
}

// ============================================================
// REQUIRE ADMIN
// ============================================================

export async function requireAdmin(event: H3Event) {
  console.log("=================================");
  console.log("AUTHENTICATION CHECK");
  console.log("=================================");

  const authorization = getHeader(event, "authorization");

  console.log("AUTHORIZATION HEADER:", authorization ? "PRESENT" : "MISSING");

  if (!authorization) {
    console.error("❌ NO AUTHORIZATION HEADER");

    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  const supabase = await getAdminSupabase(event);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ SUPABASE USER ERROR:", userError);

    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  console.log("✅ AUTHENTICATED USER:", user.email);
  console.log("USER ID:", user.id);

  // ============================================================
  // CHECK ADMIN TABLE
  // ============================================================

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("❌ ADMIN DATABASE ERROR:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to verify administrator",
    });
  }

  console.log("👤 ADMIN DATABASE RESULT:", adminUser);

  if (!adminUser) {
    console.error("❌ USER IS NOT AN ADMIN");

    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required",
    });
  }

  console.log("✅ ADMIN USER:", adminUser.email);

  return {
    user,
    adminUser,
    supabase,
  };
}
