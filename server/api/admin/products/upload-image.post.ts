import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { extensionForImageMime, imageBytesMatchMime } from "~~/server/utils/imageUpload";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === "file" && part.filename);

  if (!file?.data || !file.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "No image file was supplied",
    });
  }

  const mimeType = file.type || "application/octet-stream";

  if (!ALLOWED_TYPES.has(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only JPG, PNG, WEBP and GIF images are allowed",
    });
  }

  // Keep individual uploads reasonably small for product photography.
  const maxSize = 10 * 1024 * 1024;
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 413,
      statusMessage: "Each image must be 10 MB or smaller",
    });
  }

  if (!imageBytesMatchMime(file.data, mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "The uploaded file does not match its image type.",
    });
  }

  const ext = extensionForImageMime(mimeType);
  const safeBase = file.filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "product";

  const unique = `${Date.now()}-${crypto.randomUUID()}`;
  const storagePath = `${safeBase}-${unique}.${ext}`;

  const supabase = getAdminSupabase();

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(storagePath, file.data, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("ADMIN PRODUCT IMAGE UPLOAD ERROR:", uploadError);
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to upload product image",
    });
  }

  const { data } = supabase.storage.from("products").getPublicUrl(storagePath);

  return {
    path: storagePath,
    url: data.publicUrl,
  };
});
