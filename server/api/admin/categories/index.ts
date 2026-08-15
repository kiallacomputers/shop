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

    const token = authorization.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication token missing",
      });
    }

    // ============================================
    // SUPABASE CONFIGURATION
    // ============================================

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const anonKey = config.public.supabaseAnonKey || config.supabaseAnonKey;

    const serviceKey = config.supabaseSecretKey || config.supabaseServiceKey;

    if (!supabaseUrl) {
      console.error("❌ Supabase URL is missing");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase URL is not configured",
      });
    }

    if (!anonKey) {
      console.error("❌ Supabase anon key is missing");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase anon key is not configured",
      });
    }

    if (!serviceKey) {
      console.error("❌ Supabase service/secret key is missing");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase server key is not configured",
      });
    }

    // ============================================
    // USER SUPABASE CLIENT
    // ============================================

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================
    // VERIFY SUPABASE USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError) {
      console.error("❌ SUPABASE USER ERROR:", userError);

      throw createError({
        statusCode: 401,
        statusMessage: "Unable to authenticate user",
      });
    }

    if (!user) {
      console.error("❌ NO SUPABASE USER");

      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    console.log("============================================");
    console.log("✅ AUTHENTICATED USER");
    console.log("User ID:", user.id);
    console.log("Email:", user.email);
    console.log("============================================");

    // ============================================
    // SUPABASE ADMIN/SERVICE CLIENT
    // ============================================

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================
    // CHECK ADMIN USER
    //
    // Your admin_users table uses:
    //
    // admin_users.id
    //
    // for the Supabase Auth UUID.
    // ============================================

    const { data: adminUser, error: adminError } = await adminSupabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    console.log("👤 ADMIN RECORD:", adminUser);
    console.log("⚠️ ADMIN CHECK ERROR:", adminError);

    // ============================================
    // ADMIN DATABASE ERROR
    // ============================================

    if (adminError) {
      console.error("❌ ADMIN DATABASE ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage:
          adminError.message || "Unable to verify administrator access",
      });
    }

    // ============================================
    // USER IS NOT ADMIN
    // ============================================

    if (!adminUser) {
      console.error("❌ ADMIN ACCESS DENIED");

      console.error("User UUID:", user.id);

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

    console.log("📡 CATEGORY METHOD:", method);

    // ============================================
    // GET CATEGORIES
    // ============================================

    if (method === "GET") {
      const { data: categories, error: categoryError } = await adminSupabase
        .from("categories")
        .select("*")
        .order("sort_order", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        });

      if (categoryError) {
        console.error("❌ LOAD CATEGORIES ERROR:", categoryError);

        throw createError({
          statusCode: 500,
          statusMessage: categoryError.message || "Unable to load categories",
        });
      }

      console.log("✅ CATEGORIES LOADED:", categories?.length || 0);

      return categories || [];
    }

    // ============================================
    // CREATE CATEGORY
    // ============================================

    if (method === "POST") {
      const body = await readBody(event);

      console.log("📦 CREATE CATEGORY BODY:", body);

      // ==========================================
      // CATEGORY NAME
      // ==========================================

      const name = typeof body?.name === "string" ? body.name.trim() : "";

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Category name is required",
        });
      }

      // ==========================================
      // PARENT CATEGORY
      // ==========================================

      const parentId = body?.parent_id || null;

      // ==========================================
      // SORT ORDER
      // ==========================================

      const sortOrder =
        body?.sort_order !== undefined &&
        body?.sort_order !== null &&
        body?.sort_order !== ""
          ? Number(body.sort_order)
          : 0;

      // ==========================================
      // VALIDATE SORT ORDER
      // ==========================================

      if (Number.isNaN(sortOrder)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Sort order must be a number",
        });
      }

      console.log("➕ CREATING CATEGORY:", {
        name,
        parentId,
        sortOrder,
      });

      // ==========================================
      // INSERT CATEGORY
      // ==========================================

      const { data: category, error: insertError } = await adminSupabase
        .from("categories")
        .insert({
          name,
          parent_id: parentId,
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ CREATE CATEGORY ERROR:", insertError);

        throw createError({
          statusCode: 500,
          statusMessage: insertError.message || "Unable to create category",
        });
      }

      console.log("✅ CATEGORY CREATED:", category);

      return {
        success: true,
        category,
      };
    }

    // ============================================
    // UNSUPPORTED HTTP METHOD
    // ============================================

    throw createError({
      statusCode: 405,
      statusMessage: `Method ${method} not allowed`,
    });
  } catch (error: any) {
    console.error("🔥 CATEGORY API ERROR:", error);

    // Preserve Nuxt createError responses
    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Unable to process category request",
    });
  }
});
