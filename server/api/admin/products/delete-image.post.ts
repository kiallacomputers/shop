import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    // ==================================================
    // GET AUTHORIZATION HEADER
    // ==================================================

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

    // ==================================================
    // SUPABASE CONFIG
    // ==================================================

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const serviceKey = config.supabaseSecretKey || config.supabaseServiceKey;

    if (!supabaseUrl || !serviceKey) {
      console.error("❌ SUPABASE SERVER CONFIGURATION MISSING");

      throw createError({
        statusCode: 500,
        statusMessage: "Supabase server configuration is missing",
      });
    }

    // ==================================================
    // SERVICE CLIENT
    // ==================================================

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ==================================================
    // VERIFY USER TOKEN
    // ==================================================

    const {
      data: { user },
      error: userError,
    } = await adminSupabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ USER TOKEN ERROR:", userError);

      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    console.log("✅ AUTHENTICATED USER:", user.email);

    // ==================================================
    // CHECK ADMIN
    // ==================================================

    const { data: adminUser, error: adminError } = await adminSupabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("❌ ADMIN DATABASE ERROR:", adminError);

      throw createError({
        statusCode: 500,
        statusMessage: `Unable to verify administrator access: ${adminError.message}`,
      });
    }

    if (!adminUser) {
      console.error("❌ ADMIN RECORD NOT FOUND FOR USER:", user.id);

      throw createError({
        statusCode: 403,
        statusMessage: "Administrator access required",
      });
    }

    console.log("✅ ADMIN VERIFIED:", adminUser.id);

    // ==================================================
    // GET REQUEST BODY
    // ==================================================

    const body = await readBody(event);

    const imageUrl = body?.image;

    if (!imageUrl || typeof imageUrl !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Image URL is required",
      });
    }

    console.log("🔥 IMAGE TO DELETE:", imageUrl);

    // ==================================================
    // EXTRACT STORAGE LOCATION
    // ==================================================

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

    if (!bucket || !filePath) {
      throw createError({
        statusCode: 400,
        statusMessage: "Unable to determine storage bucket or file path",
      });
    }

    console.log("🔥 DELETE IMAGE");

    console.log("Bucket:", bucket);

    console.log("Path:", filePath);

    // ==================================================
    // DELETE IMAGE FROM SUPABASE STORAGE
    // ==================================================

    const { data: deleteData, error: deleteError } = await adminSupabase.storage
      .from(bucket)
      .remove([filePath]);

    if (deleteError) {
      console.error("🔥 STORAGE DELETE ERROR:", deleteError);

      throw createError({
        statusCode: 500,
        statusMessage:
          deleteError.message || "Unable to delete image from storage",
      });
    }

    console.log("✅ STORAGE DELETE SUCCESS:", deleteData);

    // ==================================================
    // RETURN
    // ==================================================

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
