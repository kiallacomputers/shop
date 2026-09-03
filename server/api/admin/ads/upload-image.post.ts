import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const extensionFor = (filename: string, mimeType: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "webp";
};

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

  const ext = extensionFor(file.filename, mimeType);
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
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to upload banner image" });
  }

  const { data } = supabase.storage.from("products").getPublicUrl(storagePath);
  return { path: storagePath, url: data.publicUrl };
});
