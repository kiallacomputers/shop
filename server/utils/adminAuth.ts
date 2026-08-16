import { serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function isAdminUser(event: any) {
  console.log("=================================");
  console.log("AUTHENTICATION CHECK");
  console.log("=================================");

  try {
    // ============================================================
    // GET AUTHENTICATED SUPABASE CLIENT
    // ============================================================

    const supabase = await serverSupabaseClient(event);

    // ============================================================
    // GET LOGGED IN USER
    // ============================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ SUPABASE USER ERROR:", userError);
    }

    if (!user) {
      console.log("❌ NO LOGGED IN USER");

      return {
        user: null,
        isAdmin: false,
      };
    }

    console.log("✅ AUTHENTICATED USER:", user.email);
    console.log("USER ID:", user.id);

    // ============================================================
    // SERVER CONFIGURATION
    // ============================================================

    const config = useRuntimeConfig();

    const supabaseUrl =
      config.public.supabaseUrl ||
      config.supabaseUrl ||
      process.env.SUPABASE_URL;

    const serviceKey =
      config.supabaseSecretKey ||
      config.supabaseServiceKey ||
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
      console.error("❌ SUPABASE URL IS MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase URL is not configured",
      });
    }

    if (!serviceKey) {
      console.error("❌ SUPABASE SECRET KEY IS MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase server secret key is not configured",
      });
    }

    // ============================================================
    // SERVICE ROLE CLIENT
    // ============================================================

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================================
    // CHECK ADMIN TABLE
    // ============================================================

    const { data: adminUser, error: adminError } = await adminSupabase
      .from("admin_users")
      .select("id, email")
      .eq("id", user.id)
      .maybeSingle();

    console.log("👤 ADMIN DATABASE RESULT:", adminUser);

    if (adminError) {
      console.error("❌ ADMIN DATABASE ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage:
          adminError.message || "Unable to verify administrator access",
      });
    }

    const isAdmin = !!adminUser;

    console.log("IS ADMIN:", isAdmin);
    console.log("=================================");

    return {
      user,
      isAdmin,
    };
  } catch (error: any) {
    console.error("🔥 ADMIN AUTH ERROR:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Unable to verify administrator access",
    });
  }
}

// ================================================================
// REQUIRE ADMIN
// ================================================================

export async function requireAdmin(event: any) {
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
