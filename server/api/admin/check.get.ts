import { getUserFromEvent } from "~~/server/utils/adminAuth";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    // ============================================
    // GET LOGGED-IN USER
    // ============================================

    const user = await getUserFromEvent(event);

    if (!user) {
      return {
        isAdmin: false,
        user: null,
        adminUser: null,
      };
    }

    // ============================================
    // SUPABASE SERVER CLIENT
    // ============================================

    const supabase = createClient(
      config.public.supabaseUrl,
      config.supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // ============================================
    // CHECK ADMIN TABLE
    // ============================================

    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("ADMIN CHECK ERROR:", error);

      return {
        isAdmin: false,
        user,
        adminUser: null,
      };
    }

    if (!adminUser) {
      console.log("NOT AN ADMIN:", user.email);

      return {
        isAdmin: false,
        user,
        adminUser: null,
      };
    }

    console.log("ADMIN USER:", user.email);

    return {
      isAdmin: true,
      user,
      adminUser,
    };
  } catch (error) {
    console.error("ADMIN CHECK FAILED:", error);

    return {
      isAdmin: false,
      user: null,
      adminUser: null,
    };
  }
});
