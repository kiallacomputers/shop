import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const adminSupabase = getAdminSupabase();

    const body = await readBody(event);
    const imageUrl = body?.image;

    if (!imageUrl || typeof imageUrl !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Image URL is required",
      });
    }

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

    const { data: deleteData, error: deleteError } =
      await adminSupabase.storage.from(bucket).remove([filePath]);

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
      message: "Image deleted successfully",
      bucket,
      path: filePath,
      data: deleteData,
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
