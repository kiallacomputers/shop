import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    // ============================================
    // GET AUTHORIZATION HEADER
    // ============================================

    const authorization = getHeader(event, "authorization");

    if (!authorization) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    const token = authorization.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication token missing",
      });
    }

    // ============================================
    // SUPABASE CONFIG
    // ============================================

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const anonKey = config.public.supabaseAnonKey || config.supabaseAnonKey;

    const serviceKey = config.supabaseSecretKey || config.supabaseServiceKey;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error("❌ Missing Supabase configuration");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase server configuration is missing",
      });
    }

    // ============================================
    // USER CLIENT
    // ============================================

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================
    // VERIFY USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ USER AUTH ERROR:", userError);

      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    console.log("✅ AUTHENTICATED USER:", user.id);
    console.log("📧 USER EMAIL:", user.email);

    // ============================================
    // SERVICE CLIENT
    // ============================================

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================
    // CHECK ADMIN
    // ============================================

    const { data: adminUser, error: adminError } = await adminSupabase
      .from("admin_users")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("👤 ADMIN USER:", adminUser);
    console.log("⚠️ ADMIN CHECK ERROR:", adminError);

    if (adminError) {
      console.error("❌ ADMIN DATABASE ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage:
          adminError.message || "Unable to verify administrator access",
      });
    }

    if (!adminUser) {
      console.error("❌ USER IS NOT IN admin_users:", user.id);

      throw createError({
        statusCode: 403,
        statusMessage: "Administrator access required",
      });
    }

    console.log("✅ ADMIN ACCESS CONFIRMED");

    // ============================================
    // GET REQUEST METHOD
    // ============================================

    const method = getMethod(event);

    // ============================================
    // GET CATEGORIES
    // ============================================

    if (method === "GET") {
      const { data: categories, error } = await adminSupabase
        .from("categories")
        .select("*")
        .order("sort_order", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error("❌ LOAD CATEGORIES ERROR:", error);

        throw createError({
          statusCode: 500,
          statusMessage: error.message || "Unable to load categories",
        });
      }

      return categories || [];
    }

    // ============================================
    // CREATE CATEGORY
    // ============================================

    if (method === "POST") {
      const body = await readBody(event);

      const name = body?.name?.trim();

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Category name is required",
        });
      }

      const parentId = body?.parent_id || null;

      const sortOrder = Number(body?.sort_order) || 0;

      console.log("➕ CREATING CATEGORY:", {
        name,
        parentId,
        sortOrder,
      });

      const { data: category, error } = await adminSupabase
        .from("categories")
        .insert({
          name,
          parent_id: parentId,
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ CREATE CATEGORY ERROR:", error);

        throw createError({
          statusCode: 500,
          statusMessage: error.message || "Unable to create category",
        });
      }

      console.log("✅ CATEGORY CREATED:", category);

      return {
        success: true,
        category,
      };
    }

    // ============================================
    // UNSUPPORTED METHOD
    // ============================================

    throw createError({
      statusCode: 405,
      statusMessage: `Method ${method} not allowed`,
    });
  } catch (error: any) {
    console.error("🔥 CATEGORY API ERROR:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Unable to process category request",
    });
  }
});
