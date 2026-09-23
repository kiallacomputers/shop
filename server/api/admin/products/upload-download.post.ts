import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const safeExtension = (filename: string) => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] || "file";
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === "file" && part.filename);

  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: "No download file was supplied" });
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: "Each download file must be 20 MB or smaller" });
  }

  const extension = safeExtension(file.filename);
  const safeBase = file.filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "download";

  const storagePath = `downloads/${safeBase}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const mimeType = file.type || "application/octet-stream";
  const supabase = getAdminSupabase();

  const { error } = await supabase.storage
    .from("products")
    .upload(storagePath, file.data, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("ADMIN PRODUCT DOWNLOAD UPLOAD ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Unable to upload download file" });
  }

  const { data } = supabase.storage.from("products").getPublicUrl(storagePath);

  return {
    path: storagePath,
    url: data.publicUrl,
    filename: file.filename,
    size: file.data.length,
    fileType: extension.toUpperCase(),
  };
});
