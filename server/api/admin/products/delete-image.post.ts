import { serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    // ----------------------------------------
    // GET USER SESSION
    // ----------------------------------------

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

    // ----------------------------------------
    // CHECK ADMIN
    // ----------------------------------------

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminUser) {
      throw createError({
        statusCode: 403,
        statusMessage: "Administrator access required",
      });
    }

    // ----------------------------------------
    // GET IMAGE
    // ----------------------------------------

    const body = await readBody(event);

    const imageUrl = body?.image;

    if (!imageUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: "Image URL is required",
      });
    }

    // ----------------------------------------
    // SUPABASE CONFIG
    // ----------------------------------------

    const config = useRuntimeConfig();

    const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl;

    const serviceKey = config.supabaseSecretKey || config.supabaseServiceKey;

    if (!supabaseUrl || !serviceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: "Supabase server configuration is missing",
      });
    }

    // ----------------------------------------
    // SERVICE CLIENT
    // ----------------------------------------

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ----------------------------------------
    // EXTRACT STORAGE PATH
    // ----------------------------------------

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
        statusMessage: "Invalid storage path",
      });
    }

    const bucket = storageLocation.substring(0, firstSlash);

    const filePath = storageLocation.substring(firstSlash + 1);

    console.log("🔥 DELETE IMAGE");
    console.log("Bucket:", bucket);
    console.log("Path:", filePath);

    // ----------------------------------------
    // DELETE IMAGE
    // ----------------------------------------

    const { error: deleteError } = await adminSupabase.storage
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

    return {
      success: true,
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
