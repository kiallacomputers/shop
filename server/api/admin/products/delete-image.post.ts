import { serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    // ========================================
    // GET AUTHENTICATED USER
    // ========================================

    const supabase = await serverSupabaseClient(event);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    console.log("✅ AUTHENTICATED USER:", user.email);

    // ========================================
    // CHECK ADMIN
    // ========================================

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("🔥 ADMIN CHECK ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage: "Unable to verify administrator access",
      });
    }

    if (!adminUser) {
      throw createError({
        statusCode: 403,
        statusMessage: "Administrator access required",
      });
    }

    console.log("✅ ADMIN USER CONFIRMED");

    // ========================================
    // GET REQUEST BODY
    // ========================================

    const body = await readBody(event);

    const imageUrl = body?.image;

    if (!imageUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: "Image URL is required",
      });
    }

    console.log("🔥 IMAGE TO DELETE:", imageUrl);

    // ========================================
    // SUPABASE CONFIG
    // ========================================

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const serviceKey = config.supabaseSecretKey || config.supabaseServiceKey;

    if (!supabaseUrl) {
      console.error("🔥 SUPABASE URL IS MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase URL is not configured",
      });
    }

    if (!serviceKey) {
      console.error("🔥 SUPABASE SERVICE KEY IS MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase server secret key is not configured",
      });
    }

    // ========================================
    // CREATE SERVICE CLIENT
    // ========================================

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ========================================
    // EXTRACT STORAGE LOCATION
    // ========================================

    const marker = "/storage/v1/object/public/";

    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex === -1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Supabase Storage URL",
      });
    }

    const storageLocation = imageUrl.substring(markerIndex + marker.length);

    const firstSlash = storageLocation.indexOf("/");

    if (firstSlash === -1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Supabase Storage path",
      });
    }

    const bucket = storageLocation.substring(0, firstSlash);

    const filePath = storageLocation.substring(firstSlash + 1);

    console.log("========================================");
    console.log("🔥 DELETE IMAGE");
    console.log("Bucket:", bucket);
    console.log("Path:", filePath);
    console.log("========================================");

    // ========================================
    // DELETE FROM SUPABASE STORAGE
    // ========================================

    const { data: deletedFiles, error: deleteError } =
      await adminSupabase.storage.from(bucket).remove([filePath]);

    if (deleteError) {
      console.error("🔥 STORAGE DELETE ERROR:", deleteError);

      throw createError({
        statusCode: 500,
        statusMessage:
          deleteError.message || "Unable to delete image from Supabase Storage",
      });
    }

    console.log("✅ IMAGE DELETED:", deletedFiles);

    // ========================================
    // SUCCESS
    // ========================================

    return {
      success: true,
      message: "Image deleted successfully",
      bucket,
      path: filePath,
    };
  } catch (error: any) {
    console.error("🔥 DELETE IMAGE ERROR:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Unable to delete image",
    });
  }
});
