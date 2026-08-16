import { createError, defineEventHandler, readMultipartFormData } from "h3";
import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No upload data received.",
    });
  }

  const file = formData.find((item) => item.name === "file" && item.filename);

  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: "No image file selected.",
    });
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (file.type && !allowedTypes.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only JPG, PNG, WEBP and GIF images are allowed.",
    });
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image must be smaller than 5MB.",
    });
  }

  const originalName = file.filename || "image";

  const cleanName = originalName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

  const extension = cleanName.includes(".")
    ? cleanName.substring(cleanName.lastIndexOf("."))
    : "";

  const baseName = cleanName
    .replace(extension, "")
    .replace(/[^a-zA-Z0-9-]/g, "") || "image";

  const uniqueName = `${baseName}-${Date.now()}${extension}`;
  const filePath = `products/${uniqueName}`;

  console.log("🔥 UPLOADING IMAGE:", filePath);

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(filePath, file.data, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("🔥 STORAGE UPLOAD ERROR:", uploadError);

    throw createError({
      statusCode: 500,
      statusMessage: uploadError.message || "Unable to upload image.",
    });
  }

  const { data: publicUrlData } = supabase.storage
    .from("products")
    .getPublicUrl(filePath);

  return {
    success: true,
    filename: cleanName,
    path: filePath,
    url: publicUrlData.publicUrl,
  };
});
