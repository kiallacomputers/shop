import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    // ============================================
    // AUTHORIZATION
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
    // SUPABASE CONFIG
    // ============================================

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const anonKey = config.public.supabaseAnonKey || config.supabaseAnonKey;

    const serviceKey = config.supabaseSecretKey || config.supabaseServiceKey;

    if (!supabaseUrl || !anonKey || !serviceKey) {
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

    if (adminError) {
      console.error("❌ ADMIN CHECK ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage:
          adminError.message || "Unable to verify administrator access",
      });
    }

    if (!adminUser) {
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

      return categories || [];
    }

    // ============================================
    // CREATE CATEGORY
    // ============================================

    if (method === "POST") {
      const body = await readBody(event);

      // ==========================================
      // NAME
      // ==========================================

      const name = typeof body?.name === "string" ? body.name.trim() : "";

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Category name is required",
        });
      }

      // ==========================================
      // CREATE SLUG
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
      // PARENT
      // ==========================================

      const parentId = body?.parent_id || null;

      console.log("➕ CREATING CATEGORY:", {
        name,
        slug,
        parentId,
      });

      // ==========================================
      // CHECK FOR EXISTING SLUG
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
      // INSERT
      // ==========================================

      const { data: category, error: insertError } = await adminSupabase
        .from("categories")
        .insert({
          name,
          slug,
          parent_id: parentId,
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
