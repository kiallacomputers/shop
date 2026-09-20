import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { extensionForImageMime, imageBytesMatchMime } from "~~/server/utils/imageUpload";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === "file" && part.filename);

  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: "No image file was supplied" });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: "Only JPG, PNG and WEBP images are allowed" });
  }

  if (file.data.length > 10 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: "Banner image must be 10 MB or smaller" });
  }

  if (!imageBytesMatchMime(file.data, mimeType)) {
    throw createError({ statusCode: 400, statusMessage: "The uploaded file does not match its image type." });
  }

  const ext = extensionForImageMime(mimeType);
  const storagePath = `ads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const supabase = getAdminSupabase();

  const { error } = await supabase.storage
    .from("products")
    .upload(storagePath, file.data, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("ADMIN AD IMAGE UPLOAD ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Unable to upload banner image" });
  }

  const { data } = supabase.storage.from("products").getPublicUrl(storagePath);
  return { path: storagePath, url: data.publicUrl };
});
