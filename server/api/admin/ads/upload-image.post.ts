import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { extensionForImageMime, imageBytesMatchMime } from "~~/server/utils/imageUpload";
import { auditRejectedUpload, filenameLooksDangerous } from "~~/server/utils/fileUploadSecurity";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const parts = await readMultipartFormData(event);
  const files = parts?.filter((part) => part.name === "file" && part.filename) || [];
  const file = files[0];
  if (files.length !== 1 || !file?.data || !file.filename) {
    await auditRejectedUpload(event, files.length > 1 ? "multiple_files" : "missing_file");
    throw createError({ statusCode: 400, statusMessage: "Supply exactly one banner image" });
  }
  if (filenameLooksDangerous(file.filename)) {
    await auditRejectedUpload(event, "unsafe_filename", file.filename);
    throw createError({ statusCode: 400, statusMessage: "The image filename is not allowed" });
  }
  const mimeType = String(file.type || "application/octet-stream").toLowerCase();
  if (!ALLOWED_TYPES.has(mimeType)) {
    await auditRejectedUpload(event, "disallowed_image_type", file.filename);
    throw createError({ statusCode: 415, statusMessage: "Only JPG, PNG and WEBP images are allowed" });
  }
  if (file.data.length > MAX_FILE_SIZE) {
    await auditRejectedUpload(event, "image_too_large", file.filename);
    throw createError({ statusCode: 413, statusMessage: "Banner image must be 10 MB or smaller" });
  }
  if (!imageBytesMatchMime(file.data, mimeType)) {
    await auditRejectedUpload(event, "image_signature_mismatch", file.filename);
    throw createError({ statusCode: 415, statusMessage: "The uploaded file does not match its image type" });
  }
  const ext = extensionForImageMime(mimeType);
  const storagePath = `ads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const supabase = getAdminSupabase();
  const { error } = await supabase.storage.from("products").upload(storagePath, file.data, {
    contentType: mimeType, cacheControl: "3600", upsert: false,
  });
  if (error) {
    console.error("ADMIN AD IMAGE UPLOAD ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Unable to upload banner image" });
  }
  const { data } = supabase.storage.from("products").getPublicUrl(storagePath);
  return { path: storagePath, url: data.publicUrl };
});
