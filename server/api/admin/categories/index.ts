import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  try {
    // ============================================================
    // VERIFY ADMIN
    // ============================================================

    await requireAdmin(event);

    console.log("============================================");
    console.log("CATEGORY ADMIN API");
    console.log("METHOD:", event.method);
    console.log("============================================");

    // ============================================================
    // SUPABASE CONFIGURATION
    // ============================================================

    const config = useRuntimeConfig();

    const supabaseUrl = config.supabaseUrl || config.public.supabaseUrl;

    const serviceKey = config.supabaseSecretKey;

    if (!supabaseUrl) {
      console.error("❌ SUPABASE URL MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase URL is not configured",
      });
    }

    if (!serviceKey) {
      console.error("❌ SUPABASE SECRET KEY MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase secret key is not configured",
      });
    }

    // ============================================================
    // SERVER-ONLY SUPABASE CLIENT
    // ============================================================

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================================
    // GET CATEGORIES
    // ============================================================

    if (event.method === "GET") {
      console.log("📡 GET CATEGORIES");

      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error("❌ CATEGORY LOAD ERROR:", error);

        throw createError({
          statusCode: 500,
          statusMessage: error.message || "Unable to load categories",
        });
      }

      console.log("✅ CATEGORIES LOADED:", categories?.length || 0);

      console.log("CATEGORY DATA:", categories);

      // IMPORTANT:
      // Always return the array directly.
      return categories || [];
    }

    // ============================================================
    // POST - CREATE CATEGORY
    // ============================================================

    if (event.method === "POST") {
      const body = await readBody(event);

      console.log("📦 CREATE CATEGORY BODY:", body);

      // ----------------------------------------------------------
      // NAME
      // ----------------------------------------------------------

      const name = typeof body?.name === "string" ? body.name.trim() : "";

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Category name is required",
        });
      }

      // ----------------------------------------------------------
      // SLUG
      // ----------------------------------------------------------

      const slug = generateSlug(name);

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: "Unable to generate a valid category slug",
        });
      }

      // ----------------------------------------------------------
      // PARENT
      // ----------------------------------------------------------

      const parentId =
        body?.parent_id === null ||
        body?.parent_id === "" ||
        body?.parent_id === undefined
          ? null
          : body.parent_id;

      // ----------------------------------------------------------
      // ACTIVE
      // ----------------------------------------------------------

      const active = body?.active !== false;

      console.log("➕ CREATING CATEGORY:", {
        name,
        slug,
        parentId,
        active,
      });

      // ----------------------------------------------------------
      // CHECK DUPLICATE SLUG
      // ----------------------------------------------------------

      const { data: existingCategory, error: existingError } = await supabase
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

      // ----------------------------------------------------------
      // INSERT
      // ----------------------------------------------------------

      const { data: category, error: insertError } = await supabase
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

    // ============================================================
    // METHOD NOT ALLOWED
    // ============================================================

    throw createError({
      statusCode: 405,
      statusMessage: `Method ${event.method} not allowed`,
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

// ================================================================
// SLUG GENERATOR
// ================================================================

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
