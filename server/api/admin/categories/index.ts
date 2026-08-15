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
      throw createError({
        statusCode: 500,
        statusMessage: "Supabase URL is not configured",
      });
    }

    if (!anonKey) {
      throw createError({
        statusCode: 500,
        statusMessage: "Supabase anon key is not configured",
      });
    }

    if (!serviceKey) {
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

    console.log("============================================");
    console.log("✅ AUTHENTICATED USER");
    console.log("User ID:", user.id);
    console.log("Email:", user.email);
    console.log("============================================");

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
    //
    // admin_users.id = Supabase Auth UUID
    // ============================================

    const { data: adminUser, error: adminError } = await adminSupabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    console.log("👤 ADMIN RECORD:", adminUser);
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
      console.error("❌ ADMIN ACCESS DENIED:", user.id);

      throw createError({
        statusCode: 403,
        statusMessage: "Administrator access required",
      });
    }

    console.log("✅ ADMIN ACCESS CONFIRMED");

    // ============================================
    // HTTP METHOD
    // ============================================

    const method = getMethod(event);

    console.log("📡 CATEGORY API METHOD:", method);

    // ============================================
    // GET CATEGORIES
    // ============================================

    if (method === "GET") {
      const { data: categories, error: categoryError } = await adminSupabase
        .from("categories")
        .select("*")
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
      // GENERATE SLUG
      // ==========================================

      const slug = name
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: "Unable to generate a valid category slug",
        });
      }

      // ==========================================
      // PARENT CATEGORY
      // ==========================================

      const parentId = body?.parent_id || null;

      // ==========================================
      // ACTIVE STATE
      // ==========================================

      const active = body?.active !== false;

      console.log("➕ CREATING CATEGORY:", {
        name,
        slug,
        parentId,
        active,
      });

      // ==========================================
      // CHECK EXISTING SLUG
      // ==========================================

      const { data: existingCategory, error: existingError } =
        await adminSupabase
          .from("categories")
          .select("id, name, slug")
          .eq("slug", slug)
          .maybeSingle();

      if (existingError) {
        console.error("❌ SLUG CHECK ERROR:", existingError);

        throw createError({
          statusCode: 500,
          statusMessage:
            existingError.message || "Unable to check category slug",
        });
      }

      if (existingCategory) {
        throw createError({
          statusCode: 409,
          statusMessage: "A category with this name already exists",
        });
      }

      // ==========================================
      // INSERT CATEGORY
      // ==========================================

      const { data: category, error: insertError } = await adminSupabase
        .from("categories")
        .insert({
          name,
          slug,
          parent_id: parentId,
          active,
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
